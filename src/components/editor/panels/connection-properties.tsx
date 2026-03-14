import { useCallback, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { useEditorStore } from "#/stores/editor-store";
import { updateConnection } from "#/lib/connection.functions";
import { updateDiagramConnection } from "#/lib/diagram.functions";
import {
  getTechnologies,
  addConnectionTechnology,
  removeConnectionTechnology,
  setConnectionIconTechnology,
} from "#/lib/technology.functions";
import { TechnologyBadge } from "#/components/technologies/technology-badge";
import { Label } from "#/components/ui/label";
import { Textarea } from "#/components/ui/textarea";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "#/components/ui/popover";
import { ScrollArea } from "#/components/ui/scroll-area";
import { Slider } from "#/components/ui/slider";
import { Check, Cpu, Star } from "lucide-react";
import { m } from "#/paraglide/messages";
import { PATH_TYPE_TO_EDGE_TYPE } from "#/lib/types/diagram-nodes";
import type { AppEdge } from "#/lib/types/diagram-nodes";
import type { ConnectionDirection } from "#/lib/connection.validators";
import type { PathType, LineStyle } from "#/lib/diagram.validators";

const EDGE_TYPE_TO_PATH_TYPE: Record<string, PathType> = {
  curved: "curved",
  straight: "straight",
  orthogonal: "orthogonal",
};

const DIRECTION_OPTIONS: { value: ConnectionDirection; label: () => string }[] = [
  { value: "outgoing", label: () => m.connection_direction_outgoing() },
  { value: "incoming", label: () => m.connection_direction_incoming() },
  { value: "bidirectional", label: () => m.connection_direction_bidirectional() },
  { value: "none", label: () => m.connection_direction_none() },
];

const PATH_TYPE_OPTIONS: { value: PathType; label: () => string }[] = [
  { value: "curved", label: () => m.editor_edge_path_curved() },
  { value: "straight", label: () => m.editor_edge_path_straight() },
  { value: "orthogonal", label: () => m.editor_edge_path_orthogonal() },
];

const LINE_STYLE_OPTIONS: { value: LineStyle; label: () => string }[] = [
  { value: "solid", label: () => m.editor_edge_line_solid() },
  { value: "dashed", label: () => m.editor_edge_line_dashed() },
  { value: "dotted", label: () => m.editor_edge_line_dotted() },
];

export function ConnectionProperties({ edge }: { edge: AppEdge }) {
  const nodes = useEditorStore((s) => s.nodes);
  const edges = useEditorStore((s) => s.edges);
  const workspaceId = useEditorStore((s) => s.workspaceId);
  const setSelection = useEditorStore((s) => s.setSelection);
  const setEdges = useEditorStore((s) => s.setEdges);
  const updateEdgeData = useEditorStore((s) => s.updateEdgeData);
  const queryClient = useQueryClient();

  const updateConnectionFn = useServerFn(updateConnection);
  const updateDiagramConnectionFn = useServerFn(updateDiagramConnection);
  const getTechnologiesFn = useServerFn(getTechnologies);
  const addConnectionTechnologyFn = useServerFn(addConnectionTechnology);
  const removeConnectionTechnologyFn = useServerFn(removeConnectionTechnology);
  const setConnectionIconTechnologyFn = useServerFn(setConnectionIconTechnology);

  const edgeData = edge.data!;
  const sourceNode = nodes.find((n) => n.id === edge.source);
  const targetNode = nodes.find((n) => n.id === edge.target);

  const [description, setDescription] = useState(edgeData.description ?? "");

  // Track assigned technology names from edge data
  const assignedTechNames = edgeData.technologies ?? [];

  const { data: allTechs } = useQuery({
    queryKey: ["technologies", workspaceId],
    queryFn: () => getTechnologiesFn({ data: { workspaceId: workspaceId! } }),
    enabled: !!workspaceId,
  });

  // Build a set of assigned tech IDs based on name matching with workspace techs
  const assignedTechIds = new Set(
    allTechs
      ?.filter((t) => assignedTechNames.includes(t.name))
      .map((t) => t.id) ?? [],
  );

  useEffect(() => {
    setDescription(edgeData.description ?? "");
  }, [edgeData.description]);

  const saveConnection = useCallback(
    async (field: string, value: unknown) => {
      try {
        await updateConnectionFn({
          data: { id: edgeData.connectionId, [field]: value },
        });
        if (field === "description") {
          updateEdgeData(edge.id, { description: value as string | null });
        } else if (field === "direction") {
          const dir = value as ConnectionDirection;
          const arrow = { type: "arrowclosed" as const, width: 30, height: 30 };
          const markerEnd = dir === "outgoing" || dir === "bidirectional" ? arrow : undefined;
          const markerStart = dir === "incoming" || dir === "bidirectional" ? arrow : undefined;
          const currentEdges = useEditorStore.getState().edges;
          setEdges(
            currentEdges.map((e) =>
              e.id === edge.id
                ? { ...e, markerEnd, markerStart, data: { ...e.data!, direction: dir } } as AppEdge
                : e,
            ),
          );
        }
      } catch {
        toast.error(m.editor_panel_save_failed());
      }
    },
    [edgeData.connectionId, updateConnectionFn, updateEdgeData, setEdges, edge.id],
  );

  const saveDiagramConnection = useCallback(
    async (field: string, value: unknown) => {
      try {
        await updateDiagramConnectionFn({
          data: { id: edgeData.diagramConnectionId, [field]: value },
        });
        if (field === "lineStyle" || field === "labelPosition") {
          updateEdgeData(edge.id, { [field]: value } as Record<string, unknown>);
        } else if (field === "pathType") {
          const newType = PATH_TYPE_TO_EDGE_TYPE[value as PathType];
          const currentEdges = useEditorStore.getState().edges;
          setEdges(
            currentEdges.map((e) =>
              e.id === edge.id ? { ...e, type: newType } as AppEdge : e,
            ),
          );
        }
      } catch {
        toast.error(m.editor_panel_save_failed());
      }
    },
    [edgeData.diagramConnectionId, updateDiagramConnectionFn, updateEdgeData, setEdges, edge.id],
  );

  const handleToggleTech = useCallback(
    async (technologyId: string) => {
      try {
        if (assignedTechIds.has(technologyId)) {
          await removeConnectionTechnologyFn({
            data: { connectionId: edgeData.connectionId, technologyId },
          });
        } else {
          await addConnectionTechnologyFn({
            data: { connectionId: edgeData.connectionId, technologyId },
          });
        }
        queryClient.invalidateQueries({ queryKey: ["technologies", workspaceId] });
      } catch {
        toast.error(m.editor_panel_save_failed());
      }
    },
    [edgeData.connectionId, assignedTechIds, addConnectionTechnologyFn, removeConnectionTechnologyFn, queryClient, workspaceId],
  );

  const handleSetIcon = useCallback(
    async (technologyId: string | null) => {
      try {
        await setConnectionIconTechnologyFn({
          data: { connectionId: edgeData.connectionId, technologyId },
        });
      } catch {
        toast.error(m.editor_panel_save_failed());
      }
    },
    [edgeData.connectionId, setConnectionIconTechnologyFn],
  );

  return (
    <div className="space-y-4 p-4">
      <h3 className="text-sm font-semibold">{m.editor_panel_connection()}</h3>

      <div className="space-y-2">
        <Label>{m.editor_panel_source()}</Label>
        <Badge
          variant="outline"
          className="cursor-pointer"
          onClick={() => sourceNode && setSelection([sourceNode.id], [])}
        >
          {sourceNode?.data.name ?? "Unknown"}
        </Badge>
      </div>

      <div className="space-y-2">
        <Label>{m.editor_panel_target()}</Label>
        <Badge
          variant="outline"
          className="cursor-pointer"
          onClick={() => targetNode && setSelection([targetNode.id], [])}
        >
          {targetNode?.data.name ?? "Unknown"}
        </Badge>
      </div>

      <div className="space-y-2">
        <Label>{m.connection_label_direction()}</Label>
        <Select
          value={edgeData.direction}
          onValueChange={(v) => saveConnection("direction", v)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DIRECTION_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>{m.connection_label_description()}</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={() => {
            if (description !== (edgeData.description ?? "")) {
              saveConnection("description", description || null);
            }
          }}
          rows={2}
          placeholder={m.connection_placeholder_description()}
        />
      </div>

      {/* Technologies */}
      <div className="space-y-2">
        <Label className="flex items-center gap-1">
          <Cpu className="size-3.5" /> {m.technology_picker_title()}
        </Label>
        {assignedTechNames.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {assignedTechNames.map((name) => {
              const tech = allTechs?.find((t) => t.name === name);
              return (
                <TechnologyBadge
                  key={name}
                  name={name}
                  isIcon={edgeData.iconTechSlug === tech?.iconSlug && !!tech?.iconSlug}
                  onRemove={tech ? () => handleToggleTech(tech.id) : undefined}
                />
              );
            })}
          </div>
        )}
        {assignedTechNames.length > 0 && allTechs && (
          <div className="flex flex-wrap gap-1">
            {assignedTechNames.map((name) => {
              const tech = allTechs.find((t) => t.name === name);
              if (!tech) return null;
              return (
                <Button
                  key={tech.id}
                  variant="ghost"
                  size="sm"
                  className="h-6 gap-1 px-1.5 text-xs"
                  onClick={() =>
                    handleSetIcon(
                      edgeData.iconTechSlug === tech.iconSlug && tech.iconSlug
                        ? null
                        : tech.id,
                    )
                  }
                >
                  <Star
                    className={`size-3 ${edgeData.iconTechSlug === tech.iconSlug && tech.iconSlug ? "fill-current" : ""}`}
                  />
                  {tech.name}
                </Button>
              );
            })}
          </div>
        )}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="w-full justify-start">
              {m.technology_picker_title()}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-0" align="start">
            <ScrollArea className="max-h-48">
              <div className="p-1">
                {allTechs?.map((tech) => (
                  <button
                    key={tech.id}
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                    onClick={() => handleToggleTech(tech.id)}
                  >
                    <span
                      className={`flex size-4 items-center justify-center rounded-sm border ${assignedTechIds.has(tech.id) ? "border-primary bg-primary text-primary-foreground" : ""}`}
                    >
                      {assignedTechIds.has(tech.id) && <Check className="size-3" />}
                    </span>
                    <span className="flex-1 text-left">{tech.name}</span>
                  </button>
                ))}
                {(!allTechs || allTechs.length === 0) && (
                  <p className="px-2 py-3 text-center text-sm text-muted-foreground">
                    {m.technology_picker_empty()}
                  </p>
                )}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label>{m.editor_panel_path_type()}</Label>
        <Select
          value={EDGE_TYPE_TO_PATH_TYPE[edge.type ?? "default"] ?? "curved"}
          onValueChange={(v) => saveDiagramConnection("pathType", v)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PATH_TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>{m.editor_panel_line_style()}</Label>
        <Select
          value={edgeData.lineStyle}
          onValueChange={(v) => saveDiagramConnection("lineStyle", v)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LINE_STYLE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>{m.editor_panel_label_position()}</Label>
        <Slider
          value={[edgeData.labelPosition]}
          min={0}
          max={1}
          step={0.05}
          onValueCommit={([v]) => saveDiagramConnection("labelPosition", v)}
        />
      </div>
    </div>
  );
}
