import { useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ReactFlowProvider } from "@xyflow/react";
import { DnDProvider, DragGhost } from "#/components/editor/dnd-context";
import { authClient } from "#/lib/auth-client";
import { getDiagramData, getDiagramAncestry } from "#/lib/diagram.functions";
import { useEditorStore } from "#/stores/editor-store";
import {
  toFlowNodes,
  toFlowEdges,
  buildElementIdToNodeIdMap,
} from "#/lib/converters/diagram-to-flow";
import type { DeeperDiagramInfo } from "#/lib/converters/diagram-to-flow";
import { DiagramCanvas } from "#/components/editor/diagram-canvas";
import { PropertiesPanel } from "#/components/editor/properties-panel";
import { ElementPickerSidebar } from "#/components/editor/element-picker-sidebar";
import type { DiagramType } from "#/lib/diagram.validators";

export const Route = createFileRoute(
  "/_protected/_onboarded/workspace/$workspaceSlug/diagram/$diagramId",
)({
  beforeLoad: async ({ params }) => {
    const diagramData = await getDiagramData({
      data: { id: params.diagramId },
    });

    const ancestry = await getDiagramAncestry({
      data: {
        diagramId: params.diagramId,
        workspaceId: diagramData.diagram.workspaceId,
      },
    }).catch(() => [] as Awaited<ReturnType<typeof getDiagramAncestry>>);

    return { diagramData, ancestry };
  },
  component: DiagramEditorPage,
});

function DiagramEditorPage() {
  const { workspace, diagramData, ancestry } = Route.useRouteContext();
  const { data: activeMember } = authClient.useActiveMember();
  const initDiagram = useEditorStore((s) => s.initDiagram);
  const reset = useEditorStore((s) => s.reset);
  const propertiesPanelOpen = useEditorStore((s) => s.propertiesPanelOpen);
  const elementPickerOpen = useEditorStore((s) => s.elementPickerOpen);

  const memberRole = activeMember?.role;
  const readOnly = !["owner", "admin", "editor"].includes(memberRole ?? "");

  useEffect(() => {
    // Build deeper diagrams map from server data
    const deeperDiagramsMap = new Map<string, DeeperDiagramInfo[]>();
    if (diagramData.subFlowDiagrams) {
      for (const [elementId, diagrams] of Object.entries(
        diagramData.subFlowDiagrams as Record<string, DeeperDiagramInfo[]>,
      )) {
        deeperDiagramsMap.set(elementId, diagrams);
      }
    }

    const nodes = toFlowNodes(
      diagramData.elements,
      diagramData.diagram.diagramType as DiagramType,
      deeperDiagramsMap,
    );
    const elementIdToNodeId = buildElementIdToNodeIdMap(diagramData.elements);
    const edges = toFlowEdges(diagramData.connections, elementIdToNodeId);

    initDiagram({
      diagramId: diagramData.diagram.id,
      diagramType: diagramData.diagram.diagramType as DiagramType,
      workspaceId: diagramData.diagram.workspaceId,
      nodes,
      edges,
      gridSize: diagramData.diagram.gridSize,
      snapToGrid: diagramData.diagram.snapToGrid,
    });

    return () => {
      reset();
    };
  }, [diagramData, initDiagram, reset]);

  return (
    <div className="flex h-full flex-col">
      <ReactFlowProvider>
        <DnDProvider>
          <div className="flex flex-1 overflow-hidden">
            {elementPickerOpen && !readOnly && (
              <div className="w-72 shrink-0 overflow-y-auto">
                <ElementPickerSidebar />
              </div>
            )}
            <div className="flex-1">
              <DiagramCanvas
                readOnly={readOnly}
                navBar={{
                  workspaceSlug: workspace.slug,
                  workspaceName: workspace.name,
                  currentDiagramName: diagramData.diagram.name,
                  currentDiagramType: diagramData.diagram.diagramType as DiagramType,
                  ancestry,
                  readOnly,
                }}
              />
            </div>
            {propertiesPanelOpen && (
              <div className="nowheel nopan w-80 shrink-0 border-l overflow-y-auto">
                <PropertiesPanel
                  diagramName={diagramData.diagram.name}
                  diagramDescription={diagramData.diagram.description}
                />
              </div>
            )}
          </div>
          <DragGhost />
        </DnDProvider>
      </ReactFlowProvider>
    </div>
  );
}
