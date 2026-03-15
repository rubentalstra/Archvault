import { useEffect } from "react";
import { useForm } from "@tanstack/react-form";
import { z } from "zod/v4";
import { Button } from "#/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";
import { Textarea } from "#/components/ui/textarea";
import { Field, FieldError, FieldLabel } from "#/components/ui/field";
import { toast } from "sonner";
import { updateWorkspace } from "#/lib/workspace.functions";
import { m } from "#/paraglide/messages";
import type { Workspace } from "./workspace-table-columns";

interface EditWorkspaceDialogProps {
  workspace: Workspace | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function EditWorkspaceDialog({
  workspace,
  open,
  onOpenChange,
  onSuccess,
}: EditWorkspaceDialogProps) {
  const editSchema = z.object({
    name: z.string().min(1, m.validation_name_required()),
    slug: z.string().min(1, m.validation_field_required()),
    description: z.string(),
    iconEmoji: z.string(),
  });

  const form = useForm({
    defaultValues: {
      name: workspace?.name ?? "",
      slug: workspace?.slug ?? "",
      description: workspace?.description ?? "",
      iconEmoji: workspace?.iconEmoji ?? "",
    },
    validators: {
      onSubmit: editSchema,
      onBlur: editSchema,
    },
    onSubmit: async ({ value }) => {
      if (!workspace) return;

      try {
        await updateWorkspace({
          data: {
            id: workspace.id,
            name: value.name,
            slug: value.slug,
            description: value.description || undefined,
            iconEmoji: value.iconEmoji || undefined,
          },
        });

        toast.success(m.workspace_edit_success());
        onOpenChange(false);
        onSuccess();
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : m.workspace_edit_failed(),
        );
      }
    },
  });

  useEffect(() => {
    if (workspace && open) {
      form.reset();
      form.setFieldValue("name", workspace.name);
      form.setFieldValue("slug", workspace.slug);
      form.setFieldValue("description", workspace.description ?? "");
      form.setFieldValue("iconEmoji", workspace.iconEmoji ?? "");
    }
  }, [workspace, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{m.workspace_edit_title()}</DialogTitle>
          <DialogDescription>
            {m.workspace_edit_description()}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void form.handleSubmit();
          }}
          className="flex flex-col gap-4"
        >
          <form.Field name="name">
            {(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor="edit-ws-name">{m.common_label_name()}</FieldLabel>
                  <Input
                    id="edit-ws-name"
                    value={field.state.value}
                    onChange={(e) => {
                      field.handleChange(e.target.value);
                      const slugField = form.getFieldValue("slug");
                      if (
                        !slugField ||
                        slugField === slugify(field.state.value)
                      ) {
                        form.setFieldValue("slug", slugify(e.target.value));
                      }
                    }}
                    onBlur={field.handleBlur}
                    placeholder={m.workspace_placeholder_name()}
                    aria-invalid={isInvalid}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>

          <form.Field name="slug">
            {(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor="edit-ws-slug">{m.common_label_slug()}</FieldLabel>
                  <Input
                    id="edit-ws-slug"
                    value={field.state.value}
                    onChange={(e) =>
                      field.handleChange(
                        e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                      )
                    }
                    onBlur={field.handleBlur}
                    placeholder={m.workspace_placeholder_slug()}
                    aria-invalid={isInvalid}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>

          <form.Field name="description">
            {(field) => (
              <Field>
                <FieldLabel htmlFor="edit-ws-desc">
                  {m.common_label_description()}
                </FieldLabel>
                <Textarea
                  id="edit-ws-desc"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder={m.workspace_placeholder_description()}
                  rows={3}
                />
              </Field>
            )}
          </form.Field>

          <form.Field name="iconEmoji">
            {(field) => (
              <Field>
                <FieldLabel htmlFor="edit-ws-emoji">
                  {m.workspace_label_icon_emoji()}
                </FieldLabel>
                <Input
                  id="edit-ws-emoji"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="📁"
                  className="w-20"
                />
              </Field>
            )}
          </form.Field>

          <DialogFooter>
            <form.Subscribe selector={(s) => s.isSubmitting}>
              {(isSubmitting) => (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? m.common_saving()
                    : m.common_save_changes()}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
