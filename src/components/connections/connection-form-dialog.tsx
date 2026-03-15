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
import { Field, FieldError, FieldLabel } from "#/components/ui/field";
import { Label } from "#/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";
import { toast } from "sonner";
import { m } from "#/paraglide/messages";
import {
  connectionDirections,
  validateConnectionEndpoints,
} from "#/lib/connection.validators";
import type { ConnectionDirection } from "#/lib/connection.validators";
import {
  createConnection,
  updateConnection,
} from "#/lib/connection.functions";
import { addConnectionTag, removeConnectionTag } from "#/lib/tag.functions";
import { addConnectionTechnology, removeConnectionTechnology } from "#/lib/technology.functions";
import { TagPicker } from "#/components/tags/tag-picker";
import { TechnologyPicker } from "#/components/technologies/technology-picker";

interface ConnectionData {
  id: string;
  sourceElementId: string;
  targetElementId: string;
  direction: ConnectionDirection;
  description: string | null;
  technologies: { technologyId: string; name: string; iconSlug: string | null }[];
  tags: { id: string; name: string; color: string; icon: string | null }[];
}

interface ElementOption {
  id: string;
  name: string;
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

interface ConnectionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  connection?: ConnectionData;
  elementOptions: ElementOption[];
  workspaceTags?: WorkspaceTag[];
  workspaceTechnologies?: WorkspaceTechnology[];
  onSuccess: () => void;
}

const DIRECTION_LABELS: Record<ConnectionDirection, () => string> = {
  outgoing: () => m.connection_direction_outgoing(),
  incoming: () => m.connection_direction_incoming(),
  bidirectional: () => m.connection_direction_bidirectional(),
  none: () => m.connection_direction_none(),
};

export function ConnectionFormDialog({
  open,
  onOpenChange,
  workspaceId,
  connection: editConnection,
  elementOptions,
  workspaceTags = [],
  workspaceTechnologies = [],
  onSuccess,
}: ConnectionFormDialogProps) {
  const isEdit = !!editConnection;
  const [endpointError, setEndpointError] = useState<string | null>(null);
  const [localTagIds, setLocalTagIds] = useState<string[]>(
    editConnection?.tags?.map((t) => t.id) ?? [],
  );
  const [localTechnologyIds, setLocalTechnologyIds] = useState<string[]>(
    editConnection?.technologies?.map((t) => t.technologyId) ?? [],
  );

  const connectionSchema = z.object({
    sourceElementId: z.string().min(1, m.validation_source_required()),
    targetElementId: z.string().min(1, m.validation_target_required()),
    direction: z.enum(["outgoing", "incoming", "bidirectional", "none"] as const),
    description: z.string(),
  });

  const form = useForm({
    defaultValues: {
      sourceElementId: editConnection?.sourceElementId ?? "",
      targetElementId: editConnection?.targetElementId ?? "",
      direction: editConnection?.direction ?? ("outgoing" as ConnectionDirection),
      description: editConnection?.description ?? "",
    },
    validators: {
      onSubmit: connectionSchema,
      onBlur: connectionSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const validation = validateConnectionEndpoints(
          value.sourceElementId,
          value.targetElementId,
        );
        if (!validation.valid) {
          setEndpointError(validation.message ?? null);
          return;
        }
        setEndpointError(null);

        if (isEdit) {
          await updateConnection({
            data: {
              id: editConnection.id,
              sourceElementId: value.sourceElementId,
              targetElementId: value.targetElementId,
              direction: value.direction,
              description: value.description || null,
            },
          });

          const existingTagIds = new Set(editConnection.tags.map((t) => t.id));
          const currentTagIds = new Set(localTagIds);

          for (const tagId of existingTagIds) {
            if (!currentTagIds.has(tagId)) {
              await removeConnectionTag({ data: { connectionId: editConnection.id, tagId } });
            }
          }
          for (const tagId of currentTagIds) {
            if (!existingTagIds.has(tagId)) {
              await addConnectionTag({ data: { connectionId: editConnection.id, tagId } });
            }
          }

          const existingTechIds = new Set(editConnection.technologies.map((t) => t.technologyId));
          const currentTechIds = new Set(localTechnologyIds);

          for (const techId of existingTechIds) {
            if (!currentTechIds.has(techId)) {
              await removeConnectionTechnology({ data: { connectionId: editConnection.id, technologyId: techId } });
            }
          }
          for (const techId of currentTechIds) {
            if (!existingTechIds.has(techId)) {
              await addConnectionTechnology({ data: { connectionId: editConnection.id, technologyId: techId } });
            }
          }

          toast.success(m.connection_edit_success());
        } else {
          const created = await createConnection({
            data: {
              workspaceId,
              sourceElementId: value.sourceElementId,
              targetElementId: value.targetElementId,
              direction: value.direction,
              description: value.description || undefined,
            },
          });
          for (const tagId of localTagIds) {
            await addConnectionTag({ data: { connectionId: created.id, tagId } });
          }
          for (const techId of localTechnologyIds) {
            await addConnectionTechnology({ data: { connectionId: created.id, technologyId: techId } });
          }

          toast.success(m.connection_create_success());
        }
        onOpenChange(false);
        onSuccess();
      } catch (err) {
        toast.error(
          err instanceof Error
            ? err.message
            : isEdit
              ? m.connection_edit_failed()
              : m.connection_create_failed(),
        );
      }
    },
  });

  const handleEndpointChange = (sourceId: string, targetId: string) => {
    if (sourceId && targetId) {
      const result = validateConnectionEndpoints(sourceId, targetId);
      setEndpointError(result.valid ? null : (result.message ?? null));
    } else {
      setEndpointError(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? m.connection_edit_title() : m.connection_create_title()}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? m.connection_edit_description() : m.connection_create_description()}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void form.handleSubmit();
          }}
          className="flex flex-col gap-4"
        >
          <form.Field name="sourceElementId">
            {(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel>{m.connection_label_source()}</FieldLabel>
                  <Select
                    value={field.state.value}
                    onValueChange={(val: string | null) => {
                      if (val) {
                        field.handleChange(val);
                        handleEndpointChange(val, form.getFieldValue("targetElementId"));
                      }
                    }}
                  >
                    <SelectTrigger className="w-full" aria-invalid={isInvalid}>
                      <SelectValue placeholder={m.connection_placeholder_select_source()} />
                    </SelectTrigger>
                    <SelectContent>
                      {elementOptions.map((el) => (
                        <SelectItem key={el.id} value={el.id}>
                          {el.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>

          <form.Field name="targetElementId">
            {(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid || !!endpointError}>
                  <FieldLabel>{m.connection_label_target()}</FieldLabel>
                  <Select
                    value={field.state.value}
                    onValueChange={(val: string | null) => {
                      if (val) {
                        field.handleChange(val);
                        handleEndpointChange(form.getFieldValue("sourceElementId"), val);
                      }
                    }}
                  >
                    <SelectTrigger className="w-full" aria-invalid={isInvalid || !!endpointError}>
                      <SelectValue placeholder={m.connection_placeholder_select_target()} />
                    </SelectTrigger>
                    <SelectContent>
                      {elementOptions.map((el) => (
                        <SelectItem key={el.id} value={el.id}>
                          {el.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  {endpointError && (
                    <p className="text-xs text-destructive">{endpointError}</p>
                  )}
                </Field>
              );
            }}
          </form.Field>

          <form.Field name="direction">
            {(field) => (
              <Field>
                <FieldLabel>{m.connection_label_direction()}</FieldLabel>
                <Select
                  value={field.state.value}
                  onValueChange={(val: string | null) => {
                    if (val) field.handleChange(val as ConnectionDirection);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {connectionDirections.map((dir) => (
                      <SelectItem key={dir} value={dir}>
                        {DIRECTION_LABELS[dir]()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
          </form.Field>

          <form.Field name="description">
            {(field) => (
              <Field>
                <FieldLabel>{m.connection_label_description()}</FieldLabel>
                <Input
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder={m.connection_placeholder_description()}
                />
              </Field>
            )}
          </form.Field>

          {workspaceTechnologies.length > 0 && (
            <div className="flex flex-col gap-2">
              <Label>{m.technology_picker_title()}</Label>
              <TechnologyPicker
                workspaceTechnologies={workspaceTechnologies}
                selectedTechnologyIds={localTechnologyIds}
                onChange={setLocalTechnologyIds}
              />
            </div>
          )}

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
