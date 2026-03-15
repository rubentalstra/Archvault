import { useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useEditorStore } from "#/stores/editor-store";
import { useHistoryStore } from "#/stores/history-store";
import {
  removeDiagramElement,
  removeDiagramConnection,
  addDiagramElement,
  addDiagramConnection,
} from "#/lib/diagram.functions";
import { createConnection, deleteConnection } from "#/lib/connection.functions";
import type { AppNode, AppEdge } from "#/lib/types/diagram-nodes";

export function useEditorActions() {
  const removeDiagramElementFn = useServerFn(removeDiagramElement);
  const removeDiagramConnectionFn = useServerFn(removeDiagramConnection);
  const addDiagramElementFn = useServerFn(addDiagramElement);
  const addDiagramConnectionFn = useServerFn(addDiagramConnection);
  const createConnectionFn = useServerFn(createConnection);
  const deleteConnectionFn = useServerFn(deleteConnection);

  const addNodeWithHistory = useCallback(
    (node: AppNode) => {
      useEditorStore.getState().addNode(node);
      useHistoryStore.getState().pushAction({
        type: "add_node",
        before: { nodes: [], edges: [] },
        after: { nodes: [node], edges: [] },
      });
    },
    [],
  );

  const removeNodesWithHistory = useCallback(
    (nodeIds: string[]) => {
      const state = useEditorStore.getState();
      const nodesToRemove: AppNode[] = [];
      const allIdsToRemove = new Set<string>();

      // Collect nodes and their children
      for (const id of nodeIds) {
        const node = state.nodes.find((n) => n.id === id);
        if (node) {
          nodesToRemove.push(node);
          allIdsToRemove.add(id);
        }
      }
      // Add children
      for (const node of state.nodes) {
        if (node.parentId && allIdsToRemove.has(node.parentId)) {
          nodesToRemove.push(node);
          allIdsToRemove.add(node.id);
        }
      }

      // Collect affected edges
      const edgesToRemove = state.edges.filter(
        (e) => allIdsToRemove.has(e.source) || allIdsToRemove.has(e.target),
      );

      // Push history before modifying state
      useHistoryStore.getState().pushAction({
        type: "remove_node",
        before: { nodes: [...nodesToRemove], edges: [...edgesToRemove] },
        after: { nodes: [], edges: [] },
      });

      // Remove from store + server
      for (const edge of edgesToRemove) {
        if (edge.data) {
          void removeDiagramConnectionFn({ data: { id: edge.data.diagramConnectionId } });
        }
      }
      for (const id of allIdsToRemove) {
        const node = state.nodes.find((n) => n.id === id);
        if (node) {
          void removeDiagramElementFn({ data: { id: node.data.diagramElementId } });
        }
        useEditorStore.getState().removeNodeById(id);
      }
    },
    [removeDiagramElementFn, removeDiagramConnectionFn],
  );

  const addEdgeWithHistory = useCallback(
    (edge: AppEdge) => {
      useEditorStore.getState().addEdge(edge);
      useHistoryStore.getState().pushAction({
        type: "add_edge",
        before: { nodes: [], edges: [] },
        after: { nodes: [], edges: [edge] },
      });
    },
    [],
  );

  const removeEdgesWithHistory = useCallback(
    (edgeIds: string[]) => {
      const state = useEditorStore.getState();
      const edgesToRemove = state.edges.filter((e) => edgeIds.includes(e.id));

      useHistoryStore.getState().pushAction({
        type: "remove_edge",
        before: { nodes: [], edges: [...edgesToRemove] },
        after: { nodes: [], edges: [] },
      });

      for (const edge of edgesToRemove) {
        if (edge.data) {
          void removeDiagramConnectionFn({ data: { id: edge.data.diagramConnectionId } });
          void deleteConnectionFn({ data: { id: edge.data.connectionId } });
        }
        useEditorStore.getState().removeEdgeById(edge.id);
      }
    },
    [removeDiagramConnectionFn, deleteConnectionFn],
  );

  const undo = useCallback(() => {
    const action = useHistoryStore.getState().popUndo();
    if (!action) return;

    const store = useEditorStore.getState();

    switch (action.type) {
      case "move_nodes":
      case "resize_node": {
        // Restore before positions/sizes
        const beforeNodes = action.before.nodes ?? [];
        const updates = beforeNodes.map((bn) => ({
          id: bn.id,
          position: bn.position,
          style: bn.style,
          zIndex: bn.zIndex,
        }));
        const newNodes = store.nodes.map((n) => {
          const update = updates.find((u) => u.id === n.id);
          if (!update) return n;
          return { ...n, position: update.position, style: update.style, zIndex: update.zIndex } as AppNode;
        });
        useEditorStore.setState({ nodes: newNodes });
        break;
      }
      case "add_node": {
        // Undo add = remove from diagram (keep model element)
        const addedNodes = action.after.nodes ?? [];
        for (const node of addedNodes) {
          void removeDiagramElementFn({ data: { id: node.data.diagramElementId } });
          useEditorStore.getState().removeNodeById(node.id);
        }
        break;
      }
      case "remove_node": {
        // Undo remove = re-add to diagram
        const removedNodes = action.before.nodes ?? [];
        const removedEdges = action.before.edges ?? [];
        const diagramId = store.diagramId;
        if (!diagramId) break;

        for (const node of removedNodes) {
          void addDiagramElementFn({
            data: {
              diagramId,
              elementId: node.data.elementId,
              x: node.position.x,
              y: node.position.y,
              width: node.style?.width ? Number(node.style.width) : 200,
              height: node.style?.height ? Number(node.style.height) : 120,
              zIndex: node.zIndex ?? 0,
            },
          });
          store.addNode(node);
        }
        for (const edge of removedEdges) {
          if (edge.data) {
            void createConnectionFn({
              data: {
                workspaceId: store.workspaceId!,
                sourceElementId: store.nodes.find((n) => n.id === edge.source)?.data.elementId ?? "",
                targetElementId: store.nodes.find((n) => n.id === edge.target)?.data.elementId ?? "",
              },
            });
          }
          store.addEdge(edge);
        }
        break;
      }
      case "add_edge": {
        const addedEdges = action.after.edges ?? [];
        for (const edge of addedEdges) {
          if (edge.data) {
            void removeDiagramConnectionFn({ data: { id: edge.data.diagramConnectionId } });
            void deleteConnectionFn({ data: { id: edge.data.connectionId } });
          }
          useEditorStore.getState().removeEdgeById(edge.id);
        }
        break;
      }
      case "remove_edge": {
        const removedEdges = action.before.edges ?? [];
        for (const edge of removedEdges) {
          store.addEdge(edge);
          // Server re-creation is best-effort; edges stored in history have full data
          if (edge.data && store.workspaceId && store.diagramId) {
            const sourceNode = store.nodes.find((n) => n.id === edge.source);
            const targetNode = store.nodes.find((n) => n.id === edge.target);
            if (sourceNode && targetNode) {
              void createConnectionFn({
                data: {
                  workspaceId: store.workspaceId,
                  sourceElementId: sourceNode.data.elementId,
                  targetElementId: targetNode.data.elementId,
                },
              });
            }
          }
        }
        break;
      }
    }
  }, [removeDiagramElementFn, removeDiagramConnectionFn, addDiagramElementFn, addDiagramConnectionFn, createConnectionFn, deleteConnectionFn]);

  const redo = useCallback(() => {
    const action = useHistoryStore.getState().popRedo();
    if (!action) return;

    const store = useEditorStore.getState();

    switch (action.type) {
      case "move_nodes":
      case "resize_node": {
        const afterNodes = action.after.nodes ?? [];
        const updates = afterNodes.map((an) => ({
          id: an.id,
          position: an.position,
          style: an.style,
          zIndex: an.zIndex,
        }));
        const newNodes = store.nodes.map((n) => {
          const update = updates.find((u) => u.id === n.id);
          if (!update) return n;
          return { ...n, position: update.position, style: update.style, zIndex: update.zIndex } as AppNode;
        });
        useEditorStore.setState({ nodes: newNodes });
        break;
      }
      case "add_node": {
        const addedNodes = action.after.nodes ?? [];
        const diagramId = store.diagramId;
        if (!diagramId) break;
        for (const node of addedNodes) {
          void addDiagramElementFn({
            data: {
              diagramId,
              elementId: node.data.elementId,
              x: node.position.x,
              y: node.position.y,
              width: node.style?.width ? Number(node.style.width) : 200,
              height: node.style?.height ? Number(node.style.height) : 120,
              zIndex: node.zIndex ?? 0,
            },
          });
          store.addNode(node);
        }
        break;
      }
      case "remove_node": {
        const removedNodes = action.before.nodes ?? [];
        for (const node of removedNodes) {
          void removeDiagramElementFn({ data: { id: node.data.diagramElementId } });
          useEditorStore.getState().removeNodeById(node.id);
        }
        break;
      }
      case "add_edge": {
        const addedEdges = action.after.edges ?? [];
        for (const edge of addedEdges) {
          store.addEdge(edge);
        }
        break;
      }
      case "remove_edge": {
        const removedEdges = action.before.edges ?? [];
        for (const edge of removedEdges) {
          if (edge.data) {
            void removeDiagramConnectionFn({ data: { id: edge.data.diagramConnectionId } });
            void deleteConnectionFn({ data: { id: edge.data.connectionId } });
          }
          useEditorStore.getState().removeEdgeById(edge.id);
        }
        break;
      }
    }
  }, [removeDiagramElementFn, removeDiagramConnectionFn, addDiagramElementFn, deleteConnectionFn]);

  return {
    addNodeWithHistory,
    removeNodesWithHistory,
    addEdgeWithHistory,
    removeEdgesWithHistory,
    undo,
    redo,
  };
}
