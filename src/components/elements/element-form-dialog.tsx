import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { z } from "zod/v4";
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
import { Textarea } from "#/components/ui/textarea";
import { Switch } from "#/components/ui/switch";
import { Checkbox } from "#/components/ui/checkbox";
import { Field, FieldDescription, FieldError, FieldLabel } from "#/components/ui/field";
import { Label } from "#/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";
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
  addElementToGroup,
  removeElementFromGroup,
  addLink,
  removeLink,
} from "#/lib/element.functions";
import { addElementTechnology, removeElementTechnology } from "#/lib/technology.functions";
import { addElementTag, removeElementTag } from "#/lib/tag.functions";
import { TagPicker } from "#/components/tags/tag-picker";
import { TechnologyPicker } from "#/components/technologies/technology-picker";

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
  technologies: { technologyId: string; name: string; iconSlug: string | null }[];
  links: { id: string; url: string; label: string | null }[];
  tags: { id: string; name: string; color: string; icon: string | null }[];
  groups: { id: string; name: string }[];
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

interface WorkspaceTechnology {
  id: string;
  name: string;
  iconSlug: string | null;
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
  workspaceTechnologies?: WorkspaceTechnology[];
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
  workspaceTechnologies = [],
  onSuccess,
}: ElementFormDialogProps) {
  const isEdit = !!editElement;
  const [hierarchyError, setHierarchyError] = useState<string | null>(null);
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [newLinkLabel, setNewLinkLabel] = useState("");
  const [localTechnologyIds, setLocalTechnologyIds] = useState<string[]>(
    editElement?.technologies?.map((t) => t.technologyId) ?? [],
  );
  const [localLinks, setLocalLinks] = useState(editElement?.links ?? []);
  const [localTagIds, setLocalTagIds] = useState<string[]>(
    editElement?.tags?.map((t) => t.id) ?? [],
  );
  const [localGroupIds, setLocalGroupIds] = useState<string[]>(
    editElement?.groups?.map((g) => g.id) ?? [],
  );
  const groupOptions = parentOptions.filter((p) => p.elementType === "group");

  const elementSchema = z.object({
    elementType: z.enum(["actor", "group", "system", "app", "store", "component"] as const),
    name: z.string().min(1, m.validation_name_required()),
    displayDescription: z.string(),
    description: z.string(),
    status: z.enum(["planned", "live", "deprecated"] as const),
    external: z.boolean(),
    parentElementId: z.string(),
  });

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
    validators: {
      onSubmit: elementSchema,
      onBlur: elementSchema,
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

          const existingTechIds = new Set(editElement.technologies.map((t) => t.technologyId));
          const currentTechIds = new Set(localTechnologyIds);

          for (const techId of existingTechIds) {
            if (!currentTechIds.has(techId)) {
              await removeElementTechnology({ data: { elementId: editElement.id, technologyId: techId } });
            }
          }
          for (const techId of currentTechIds) {
            if (!existingTechIds.has(techId)) {
              await addElementTechnology({ data: { elementId: editElement.id, technologyId: techId } });
            }
          }

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

          for (const techId of localTechnologyIds) {
            await addElementTechnology({ data: { elementId: created.id, technologyId: techId } });
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
            void form.handleSubmit();
          }}
          className="flex flex-col gap-4"
        >
          {!isEdit && (
            <form.Field name="elementType">
              {(field) => (
                <Field>
                  <FieldLabel>{m.element_label_type()}</FieldLabel>
                  <Select
                    value={field.state.value}
                    onValueChange={(val: string | null) => {
                      if (val) {
                        const newType = val as ElementType;
                        field.handleChange(newType);
                        const parentId = form.getFieldValue("parentElementId");
                        handleTypeOrParentChange(newType, parentId);
                      }
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {elementTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {TYPE_LABELS[type]()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            </form.Field>
          )}

          <form.Field name="name">
            {(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel>{m.element_label_name()}</FieldLabel>
                  <Input
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder={m.element_placeholder_name()}
                    maxLength={100}
                    aria-invalid={isInvalid}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>

          <form.Field name="displayDescription">
            {(field) => (
              <Field>
                <FieldLabel>{m.element_label_display_description()}</FieldLabel>
                <Input
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder={m.element_placeholder_display_description()}
                  maxLength={120}
                />
                <FieldDescription className="text-right">
                  {m.element_hint_display_description_count({
                    count: field.state.value.length,
                  })}
                </FieldDescription>
              </Field>
            )}
          </form.Field>

          <form.Field name="description">
            {(field) => (
              <Field>
                <FieldLabel>{m.element_label_description()}</FieldLabel>
                <Textarea
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder={m.element_placeholder_description()}
                  rows={3}
                />
              </Field>
            )}
          </form.Field>

          <form.Field name="status">
            {(field) => (
              <Field>
                <FieldLabel>{m.element_label_status()}</FieldLabel>
                <Select
                  value={field.state.value}
                  onValueChange={(val: string | null) => {
                    if (val) field.handleChange(val as ElementStatus);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {elementStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {STATUS_LABELS[status]()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
          </form.Field>

          <form.Field name="elementType">
            {(typeField) => (
              <form.Field name="parentElementId">
                {(field) => {
                  const validParents = getValidParentOptions(typeField.state.value);
                  const allowsNoParent = ["actor", "group", "system"].includes(typeField.state.value);
                  return (
                    <Field data-invalid={!!hierarchyError}>
                      <FieldLabel>{m.element_label_parent()}</FieldLabel>
                      <Select
                        value={field.state.value || "__none__"}
                        onValueChange={(val: string | null) => {
                          const newVal = val === "__none__" ? "" : (val ?? "");
                          field.handleChange(newVal);
                          handleTypeOrParentChange(typeField.state.value, newVal);
                        }}
                        disabled={!allowsNoParent && validParents.length === 0}
                      >
                        <SelectTrigger className="w-full" aria-invalid={!!hierarchyError}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">{m.element_no_parent()}</SelectItem>
                          {validParents.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name} ({TYPE_LABELS[p.elementType]()})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {hierarchyError && (
                        <p className="text-xs text-destructive">{hierarchyError}</p>
                      )}
                    </Field>
                  );
                }}
              </form.Field>
            )}
          </form.Field>

          <form.Field name="external">
            {(field) => (
              <Field orientation="horizontal">
                <Switch
                  checked={field.state.value}
                  onCheckedChange={field.handleChange}
                />
                <FieldLabel>{m.element_hint_external()}</FieldLabel>
              </Field>
            )}
          </form.Field>

          {workspaceTechnologies.length > 0 && (
            <div className="flex flex-col gap-2">
              <Label>{m.element_label_technologies()}</Label>
              <TechnologyPicker
                workspaceTechnologies={workspaceTechnologies}
                selectedTechnologyIds={localTechnologyIds}
                onChange={setLocalTechnologyIds}
              />
            </div>
          )}

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

          {groupOptions.length > 0 && form.getFieldValue("elementType") !== "group" && (
            <div className="flex flex-col gap-2">
              <Label>{m.element_label_parent()}</Label>
              <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border p-2">
                {groupOptions.map((group) => {
                  const checked = localGroupIds.includes(group.id);
                  return (
                    <label key={group.id} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(c) => {
                          setLocalGroupIds((prev) =>
                            c === true
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
