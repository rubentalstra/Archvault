import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { useEditorStore } from "#/stores/editor-store";
import { removeDiagramElement } from "#/lib/diagram.functions";
import { updateElement } from "#/lib/element.functions";
import { getGroups, addGroupMembership } from "#/lib/group.functions";
import { Button } from "#/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";
import { Label } from "#/components/ui/label";
import { StatusDot } from "#/components/editor/nodes/status-dot";
import { m } from "#/paraglide/messages";
import type { ElementStatus } from "#/lib/element.validators";

const STATUS_OPTIONS: { value: ElementStatus; label: () => string }[] = [
  { value: "planned", label: () => m.element_status_planned() },
  { value: "live", label: () => m.element_status_live() },
  { value: "deprecated", label: () => m.element_status_deprecated() },
];

export function MultiSelectPanel() {
  const selectedNodeIds = useEditorStore((s) => s.selectedNodeIds);
  const nodes = useEditorStore((s) => s.nodes);
  const workspaceId = useEditorStore((s) => s.workspaceId);
  const removeNodeById = useEditorStore((s) => s.removeNodeById);
  const updateNodeData = useEditorStore((s) => s.updateNodeData);

  const removeDiagramElementFn = useServerFn(removeDiagramElement);
  const updateElementFn = useServerFn(updateElement);
  const getGroupsFn = useServerFn(getGroups);
  const addGroupMembershipFn = useServerFn(addGroupMembership);
  const queryClient = useQueryClient();

  const { data: groups = [] } = useQuery({
    queryKey: ["groups", workspaceId],
    queryFn: () => getGroupsFn({ data: { workspaceId: workspaceId! } }),
    enabled: !!workspaceId,
  });

  const selectedNodes = nodes.filter((n) => selectedNodeIds.includes(n.id));

  const handleRemoveAll = useCallback(async () => {
    try {
      for (const node of selectedNodes) {
        await removeDiagramElementFn({ data: { id: node.data.diagramElementId } });
        removeNodeById(node.id);
      }
    } catch {
      toast.error(m.editor_panel_save_failed());
    }
  }, [selectedNodes, removeDiagramElementFn, removeNodeById]);

  const handleBulkStatus = useCallback(
    async (status: string) => {
      try {
        for (const node of selectedNodes) {
          await updateElementFn({ data: { id: node.data.elementId, status } });
          updateNodeData(node.id, { status: status as ElementStatus });
        }
      } catch {
        toast.error(m.editor_panel_save_failed());
      }
    },
    [selectedNodes, updateElementFn, updateNodeData],
  );

  const handleBulkAddGroup = useCallback(
    async (groupId: string) => {
      try {
        for (const node of selectedNodes) {
          await addGroupMembershipFn({
            data: { elementId: node.data.elementId, groupId },
          });
        }
        queryClient.invalidateQueries({ queryKey: ["groups"] });
      } catch {
        toast.error(m.editor_panel_save_failed());
      }
    },
    [selectedNodes, addGroupMembershipFn, queryClient],
  );

  return (
    <div className="space-y-4 p-4">
      <p className="text-sm font-medium">
        {m.editor_panel_multi_selected({ count: selectedNodeIds.length })}
      </p>

      <Button variant="destructive" size="sm" className="w-full" onClick={handleRemoveAll}>
        {m.editor_panel_multi_delete()}
      </Button>

      <div className="space-y-2">
        <Label>{m.editor_panel_multi_status()}</Label>
        <Select onValueChange={handleBulkStatus}>
          <SelectTrigger>
            <SelectValue placeholder={m.element_placeholder_select_status()} />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                <div className="flex items-center gap-2">
                  <StatusDot status={opt.value} />
                  {opt.label()}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {groups.length > 0 && (
        <div className="space-y-2">
          <Label>{m.editor_panel_multi_group()}</Label>
          <Select onValueChange={(v) => { if (v) void handleBulkAddGroup(v as string); }}>
            <SelectTrigger>
              <SelectValue placeholder={m.group_picker_title()} />
            </SelectTrigger>
            <SelectContent>
              {groups.map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  <div className="flex items-center gap-2">
                    <div
                      className="size-3 rounded-full"
                      style={{ backgroundColor: g.color }}
                    />
                    {g.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
