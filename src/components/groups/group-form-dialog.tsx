import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Textarea } from "#/components/ui/textarea";
import { ColorPicker } from "#/components/tags/color-picker";
import { GroupBadge } from "#/components/groups/group-badge";
import { toast } from "sonner";
import { m } from "#/paraglide/messages";
import { GROUP_COLOR_PRESETS, validateGroupParent } from "#/lib/group.validators";
import { createGroup, updateGroup } from "#/lib/group.functions";

interface GroupData {
  id: string;
  name: string;
  color: string;
  parentGroupId: string | null;
  description: string | null;
}

interface GroupFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  group?: GroupData;
  allGroups: { id: string; name: string; color: string; parentGroupId: string | null }[];
  onSuccess: () => void;
}

export function GroupFormDialog({
  open,
  onOpenChange,
  workspaceId,
  group: editGroup,
  allGroups,
  onSuccess,
}: GroupFormDialogProps) {
  const isEdit = !!editGroup;
  const [name, setName] = useState(editGroup?.name ?? "");
  const [color, setColor] = useState(editGroup?.color ?? GROUP_COLOR_PRESETS[0]);
  const [parentGroupId, setParentGroupId] = useState(editGroup?.parentGroupId ?? "");
  const [description, setDescription] = useState(editGroup?.description ?? "");
  const [submitting, setSubmitting] = useState(false);

  const getDescendantIds = (groupId: string): Set<string> => {
    const descendants = new Set<string>();
    const queue = [groupId];
    while (queue.length > 0) {
      const current = queue.pop()!;
      for (const g of allGroups) {
        if (g.parentGroupId === current && !descendants.has(g.id)) {
          descendants.add(g.id);
          queue.push(g.id);
        }
      }
    }
    return descendants;
  };

  const excludedIds = editGroup ? getDescendantIds(editGroup.id) : new Set<string>();
  if (editGroup) excludedIds.add(editGroup.id);
  const parentOptions = allGroups.filter((g) => !excludedIds.has(g.id));

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const parentId = parentGroupId || null;

      if (isEdit && parentId) {
        const validation = validateGroupParent(editGroup.id, parentId, allGroups);
        if (!validation.valid) {
          toast.error(m.group_error_circular());
          setSubmitting(false);
          return;
        }
      }

      if (isEdit) {
        await updateGroup({
          data: {
            id: editGroup.id,
            name: name.trim(),
            color,
            parentGroupId: parentId,
            description: description.trim() || null,
          },
        });
        toast.success(m.group_edit_success());
      } else {
        await createGroup({
          data: {
            workspaceId,
            name: name.trim(),
            color,
            parentGroupId: parentId ?? undefined,
            description: description.trim() || undefined,
          },
        });
        toast.success(m.group_create_success());
      }
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : isEdit
            ? m.group_edit_failed()
            : m.group_create_failed(),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? m.group_edit_title() : m.group_create_title()}
          </DialogTitle>
          <DialogDescription>
            {m.group_manager_description()}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>{m.group_label_name()}</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={m.group_placeholder_name()}
              maxLength={100}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>{m.group_label_color()}</Label>
            <ColorPicker value={color} onChange={setColor} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>{m.group_label_parent()}</Label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={parentGroupId}
              onChange={(e) => setParentGroupId(e.target.value)}
            >
              <option value="">{m.group_no_parent()}</option>
              {parentOptions.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>{m.group_label_description()}</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={m.group_placeholder_description()}
              rows={3}
            />
          </div>

          {name.trim() && (
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Preview</Label>
              <GroupBadge name={name.trim()} color={color} />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {m.common_cancel()}
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !name.trim()}>
            {submitting
              ? m.common_saving()
              : isEdit
                ? m.common_save_changes()
                : m.common_create()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
