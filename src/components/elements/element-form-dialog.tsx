import { useState } from "react";
import { useForm } from "@tanstack/react-form";
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
import { Switch } from "#/components/ui/switch";
import { Badge } from "#/components/ui/badge";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { m } from "#/paraglide/messages";
import {
  elementTypes,
  elementStatuses,
  validateElementHierarchy,
} from "#/lib/element.validators";
import type { ElementType, ElementStatus } from "#/lib/element.validators";
import {
  createElement,
  updateElement,
  addTechnology,
  removeTechnology,
  addElementToGroup,
  removeElementFromGroup,
  addLink,
  removeLink,
} from "#/lib/element.functions";
import { addElementTag, removeElementTag } from "#/lib/tag.functions";
import { addGroupMembership, removeGroupMembership } from "#/lib/group.functions";
import { TagPicker } from "#/components/tags/tag-picker";
import { GroupPicker } from "#/components/groups/group-picker";

type CreatedElement = { id: string };

interface ElementData {
  id: string;
  elementType: ElementType;
  name: string;
  displayDescription: string | null;
  description: string | null;
  status: ElementStatus;
  external: boolean;
  parentElementId: string | null;
  technologies: { id: string; name: string; iconSlug: string | null }[];
  links: { id: string; url: string; label: string | null }[];
  tags: { id: string; name: string; color: string; icon: string | null }[];
  groups: { id: string; name: string }[];
  groupMemberships: { id: string; name: string; color: string }[];
}

interface ParentOption {
  id: string;
  name: string;
  elementType: ElementType;
}

interface WorkspaceTag {
  id: string;
  name: string;
  color: string;
  icon: string | null;
}

interface WorkspaceGroup {
  id: string;
  name: string;
  color: string;
}

interface ElementFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  element?: ElementData;
  parentOptions: ParentOption[];
  defaultParentId?: string;
  defaultType?: ElementType;
  workspaceTags?: WorkspaceTag[];
  workspaceGroups?: WorkspaceGroup[];
  onSuccess: () => void;
}

const TYPE_LABELS: Record<ElementType, () => string> = {
  actor: () => m.element_type_actor(),
  group: () => m.element_type_system(),
  system: () => m.element_type_system(),
  app: () => m.element_type_app(),
  store: () => m.element_type_store(),
  component: () => m.element_type_component(),
};

const STATUS_LABELS: Record<ElementStatus, () => string> = {
  planned: () => m.element_status_planned(),
  live: () => m.element_status_live(),
  deprecated: () => m.element_status_deprecated(),
};

export function ElementFormDialog({
  open,
  onOpenChange,
  workspaceId,
  element: editElement,
  parentOptions,
  defaultParentId,
  defaultType,
  workspaceTags = [],
  workspaceGroups = [],
  onSuccess,
}: ElementFormDialogProps) {
  const isEdit = !!editElement;
  const [hierarchyError, setHierarchyError] = useState<string | null>(null);
  const [newTechName, setNewTechName] = useState("");
  const [newTechIcon, setNewTechIcon] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [newLinkLabel, setNewLinkLabel] = useState("");
  const [localTechs, setLocalTechs] = useState(editElement?.technologies ?? []);
  const [localLinks, setLocalLinks] = useState(editElement?.links ?? []);
  const [localTagIds, setLocalTagIds] = useState<string[]>(
    editElement?.tags?.map((t) => t.id) ?? [],
  );
  const [localGroupIds, setLocalGroupIds] = useState<string[]>(
    editElement?.groups?.map((g) => g.id) ?? [],
  );
  const [localGroupMembershipIds, setLocalGroupMembershipIds] = useState<string[]>(
    editElement?.groupMemberships?.map((g) => g.id) ?? [],
  );

  const groupOptions = parentOptions.filter((p) => p.elementType === "group");

  const form = useForm({
    defaultValues: {
      elementType: editElement?.elementType ?? defaultType ?? ("system" as ElementType),
      name: editElement?.name ?? "",
      displayDescription: editElement?.displayDescription ?? "",
      description: editElement?.description ?? "",
      status: editElement?.status ?? ("live" as ElementStatus),
      external: editElement?.external ?? false,
      parentElementId: editElement?.parentElementId ?? defaultParentId ?? "",
    },
    onSubmit: async ({ value }) => {
      try {
        const parentType = value.parentElementId
          ? parentOptions.find((p) => p.id === value.parentElementId)?.elementType ?? null
          : null;
        const hierarchy = validateElementHierarchy(value.elementType, parentType);
        if (!hierarchy.valid) {
          setHierarchyError(hierarchy.message ?? null);
          return;
        }

        if (isEdit) {
          await updateElement({
            data: {
              id: editElement.id,
              name: value.name,
              displayDescription: value.displayDescription || null,
              description: value.description || null,
              status: value.status,
              external: value.external,
              parentElementId: value.parentElementId || null,
            },
          });

          // Sync technologies: remove deleted, add new
          const existingTechIds = new Set(editElement.technologies.map((t) => t.id));
          const currentTechIds = new Set(localTechs.filter((t) => t.id).map((t) => t.id));

          for (const t of editElement.technologies) {
            if (!currentTechIds.has(t.id)) {
              await removeTechnology({ data: { id: t.id } });
            }
          }
          for (const t of localTechs) {
            if (!existingTechIds.has(t.id)) {
              await addTechnology({
                data: { elementId: editElement.id, name: t.name, iconSlug: t.iconSlug ?? undefined },
              });
            }
          }

          // Sync links
          const existingLinkIds = new Set(editElement.links.map((l) => l.id));
          const currentLinkIds = new Set(localLinks.filter((l) => l.id).map((l) => l.id));

          for (const l of editElement.links) {
            if (!currentLinkIds.has(l.id)) {
              await removeLink({ data: { id: l.id } });
            }
          }
          for (const l of localLinks) {
            if (!existingLinkIds.has(l.id)) {
              await addLink({
                data: { elementId: editElement.id, url: l.url, label: l.label ?? undefined },
              });
            }
          }

          // Sync tags
          const existingTagIds = new Set(editElement.tags.map((t) => t.id));
          const currentTagIds = new Set(localTagIds);

          for (const tagId of existingTagIds) {
            if (!currentTagIds.has(tagId)) {
              await removeElementTag({ data: { elementId: editElement.id, tagId } });
            }
          }
          for (const tagId of currentTagIds) {
            if (!existingTagIds.has(tagId)) {
              await addElementTag({ data: { elementId: editElement.id, tagId } });
            }
          }

          // Sync group assignments (element-type groups)
          const existingGroupIds = new Set(editElement.groups.map((g) => g.id));
          const currentGroupIds = new Set(localGroupIds);
          for (const groupId of existingGroupIds) {
            if (!currentGroupIds.has(groupId)) {
              await removeElementFromGroup({
                data: { elementId: editElement.id, groupElementId: groupId },
              });
            }
          }
          for (const groupId of currentGroupIds) {
            if (!existingGroupIds.has(groupId)) {
              await addElementToGroup({
                data: { elementId: editElement.id, groupElementId: groupId },
              });
            }
          }

          // Sync visual group memberships (Phase 2e)
          const existingMembershipIds = new Set(editElement.groupMemberships?.map((g) => g.id) ?? []);
          const currentMembershipIds = new Set(localGroupMembershipIds);
          for (const groupId of existingMembershipIds) {
            if (!currentMembershipIds.has(groupId)) {
              await removeGroupMembership({
                data: { elementId: editElement.id, groupId },
              });
            }
          }
          for (const groupId of currentMembershipIds) {
            if (!existingMembershipIds.has(groupId)) {
              await addGroupMembership({
                data: { elementId: editElement.id, groupId },
              });
            }
          }

          toast.success(m.element_edit_success());
        } else {
          const created = (await createElement({
            data: {
              workspaceId,
              elementType: value.elementType,
              name: value.name,
              displayDescription: value.displayDescription || undefined,
              description: value.description || undefined,
              status: value.status,
              external: value.external,
              parentElementId: value.parentElementId || undefined,
            },
          })) as CreatedElement;

          // Add technologies, links, and tags to newly created element
          for (const t of localTechs) {
            await addTechnology({
              data: { elementId: created.id, name: t.name, iconSlug: t.iconSlug ?? undefined },
            });
          }
          for (const l of localLinks) {
            await addLink({
              data: { elementId: created.id, url: l.url, label: l.label ?? undefined },
            });
          }
          for (const tagId of localTagIds) {
            await addElementTag({ data: { elementId: created.id, tagId } });
          }
          for (const groupId of localGroupIds) {
            await addElementToGroup({
              data: { elementId: created.id, groupElementId: groupId },
            });
          }
          for (const groupId of localGroupMembershipIds) {
            await addGroupMembership({
              data: { elementId: created.id, groupId },
            });
          }

          toast.success(m.element_create_success());
        }
        onOpenChange(false);
        onSuccess();
      } catch (err) {
        toast.error(
          err instanceof Error
            ? err.message
            : isEdit
              ? m.element_edit_failed()
              : m.element_create_failed(),
        );
      }
    },
  });

  const handleTypeOrParentChange = (type: ElementType, parentId: string) => {
    const parentType = parentId
      ? parentOptions.find((p) => p.id === parentId)?.elementType ?? null
      : null;
    const result = validateElementHierarchy(type, parentType);
    setHierarchyError(result.valid ? null : (result.message ?? null));
  };

  const getValidParentOptions = (type: ElementType) => {
    return parentOptions.filter((p) => {
      if (type === "actor") return p.elementType === "group";
      if (type === "group") return p.elementType === "group";
      if (type === "system") return p.elementType === "group";
      if (type === "app") return p.elementType === "system";
      if (type === "store") return p.elementType === "system";
      if (type === "component") return p.elementType === "app";
      return false;
    });
  };

  const handleAddTech = () => {
    if (!newTechName.trim()) return;
    setLocalTechs((prev) => [
      ...prev,
      { id: `new-${Date.now()}`, name: newTechName.trim(), iconSlug: newTechIcon.trim() || null },
    ]);
    setNewTechName("");
    setNewTechIcon("");
  };

  const handleRemoveTech = (id: string) => {
    setLocalTechs((prev) => prev.filter((t) => t.id !== id));
  };

  const handleAddLink = () => {
    if (!newLinkUrl.trim()) return;
    setLocalLinks((prev) => [
      ...prev,
      { id: `new-${Date.now()}`, url: newLinkUrl.trim(), label: newLinkLabel.trim() || null },
    ]);
    setNewLinkUrl("");
    setNewLinkLabel("");
  };

  const handleRemoveLink = (id: string) => {
    setLocalLinks((prev) => prev.filter((l) => l.id !== id));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? m.element_edit_title() : m.element_create_title()}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? m.element_edit_description() : m.element_create_description()}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className="flex flex-col gap-4"
        >
          {/* Element Type (create only) */}
          {!isEdit && (
            <form.Field name="elementType">
              {(field) => (
                <div className="flex flex-col gap-1.5">
                  <Label>{m.element_label_type()}</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={field.state.value}
                    onChange={(e) => {
                      const newType = e.target.value as ElementType;
                      field.handleChange(newType);
                      const parentId = form.getFieldValue("parentElementId");
                      handleTypeOrParentChange(newType, parentId);
                    }}
                  >
                    {elementTypes.map((type) => (
                      <option key={type} value={type}>
                        {TYPE_LABELS[type]()}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </form.Field>
          )}

          {/* Name */}
          <form.Field name="name">
            {(field) => (
              <div className="flex flex-col gap-1.5">
                <Label>{m.element_label_name()}</Label>
                <Input
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder={m.element_placeholder_name()}
                  maxLength={100}
                />
              </div>
            )}
          </form.Field>

          {/* Display Description */}
          <form.Field name="displayDescription">
            {(field) => (
              <div className="flex flex-col gap-1.5">
                <Label>{m.element_label_display_description()}</Label>
                <Input
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder={m.element_placeholder_display_description()}
                  maxLength={120}
                />
                <span className="text-xs text-muted-foreground text-right">
                  {m.element_hint_display_description_count({
                    count: field.state.value.length,
                  })}
                </span>
              </div>
            )}
          </form.Field>

          {/* Description */}
          <form.Field name="description">
            {(field) => (
              <div className="flex flex-col gap-1.5">
                <Label>{m.element_label_description()}</Label>
                <Textarea
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder={m.element_placeholder_description()}
                  rows={3}
                />
              </div>
            )}
          </form.Field>

          {/* Status */}
          <form.Field name="status">
            {(field) => (
              <div className="flex flex-col gap-1.5">
                <Label>{m.element_label_status()}</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value as ElementStatus)}
                >
                  {elementStatuses.map((status) => (
                    <option key={status} value={status}>
                      {STATUS_LABELS[status]()}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </form.Field>

          {/* Parent Element */}
          <form.Field name="elementType">
            {(typeField) => (
              <form.Field name="parentElementId">
                {(field) => {
                  const validParents = getValidParentOptions(typeField.state.value);
                  const allowsNoParent = ["actor", "group", "system"].includes(typeField.state.value);
                  return (
                    <div className="flex flex-col gap-1.5">
                      <Label>{m.element_label_parent()}</Label>
                      <select
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={field.state.value}
                        onChange={(e) => {
                          field.handleChange(e.target.value);
                          handleTypeOrParentChange(typeField.state.value, e.target.value);
                        }}
                        disabled={!allowsNoParent && validParents.length === 0}
                      >
                        <option value="">{m.element_no_parent()}</option>
                        {validParents.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({TYPE_LABELS[p.elementType]()})
                          </option>
                        ))}
                      </select>
                      {hierarchyError && (
                        <p className="text-xs text-destructive">{hierarchyError}</p>
                      )}
                    </div>
                  );
                }}
              </form.Field>
            )}
          </form.Field>

          {/* External */}
          <form.Field name="external">
            {(field) => (
              <div className="flex items-center gap-3">
                <Switch
                  checked={field.state.value}
                  onCheckedChange={field.handleChange}
                />
                <Label>{m.element_hint_external()}</Label>
              </div>
            )}
          </form.Field>

          {/* Technologies */}
          <div className="flex flex-col gap-2">
            <Label>{m.element_label_technologies()}</Label>
            <div className="flex flex-wrap gap-1">
              {localTechs.map((t) => (
                <Badge key={t.id} variant="secondary" className="gap-1">
                  {t.name}
                  <button
                    type="button"
                    onClick={() => handleRemoveTech(t.id)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newTechName}
                onChange={(e) => setNewTechName(e.target.value)}
                placeholder={m.element_tech_placeholder_name()}
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTech();
                  }
                }}
              />
              <Input
                value={newTechIcon}
                onChange={(e) => setNewTechIcon(e.target.value)}
                placeholder={m.element_tech_placeholder_icon()}
                className="w-32"
              />
              <Button type="button" variant="outline" size="icon" onClick={handleAddTech}>
                <Plus className="size-4" />
              </Button>
            </div>
          </div>

          {/* Links */}
          <div className="flex flex-col gap-2">
            <Label>{m.element_label_links()}</Label>
            {localLinks.map((l) => (
              <div key={l.id} className="flex items-center gap-2 text-sm">
                <a
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate text-blue-600 underline"
                >
                  {l.label || l.url}
                </a>
                <button
                  type="button"
                  onClick={() => handleRemoveLink(l.id)}
                  className="shrink-0 hover:text-destructive"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <Input
                value={newLinkUrl}
                onChange={(e) => setNewLinkUrl(e.target.value)}
                placeholder={m.element_link_placeholder_url()}
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddLink();
                  }
                }}
              />
              <Input
                value={newLinkLabel}
                onChange={(e) => setNewLinkLabel(e.target.value)}
                placeholder={m.element_link_placeholder_label()}
                className="w-32"
              />
              <Button type="button" variant="outline" size="icon" onClick={handleAddLink}>
                <Plus className="size-4" />
              </Button>
            </div>
          </div>

          {/* Tags */}
          {workspaceTags.length > 0 && (
            <div className="flex flex-col gap-2">
              <Label>{m.tag_picker_title()}</Label>
              <TagPicker
                workspaceTags={workspaceTags}
                selectedTagIds={localTagIds}
                onChange={setLocalTagIds}
              />
            </div>
          )}

          {/* Visual group memberships (Phase 2e) */}
          {workspaceGroups.length > 0 && (
            <div className="flex flex-col gap-2">
              <Label>{m.group_picker_title()}</Label>
              <GroupPicker
                workspaceGroups={workspaceGroups}
                selectedGroupIds={localGroupMembershipIds}
                onChange={setLocalGroupMembershipIds}
              />
            </div>
          )}

          {/* Element-type group assignments */}
          {groupOptions.length > 0 && form.getFieldValue("elementType") !== "group" && (
            <div className="flex flex-col gap-2">
              <Label>{m.element_label_parent()}</Label>
              <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border p-2">
                {groupOptions.map((group) => {
                  const checked = localGroupIds.includes(group.id);
                  return (
                    <label key={group.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          setLocalGroupIds((prev) =>
                            e.target.checked
                              ? [...prev, group.id]
                              : prev.filter((id) => id !== group.id),
                          );
                        }}
                      />
                      <span>{group.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {m.common_cancel()}
            </Button>
            <form.Subscribe selector={(s) => s.isSubmitting}>
              {(isSubmitting) => (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? m.common_saving()
                    : isEdit
                      ? m.common_save_changes()
                      : m.common_create()}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
