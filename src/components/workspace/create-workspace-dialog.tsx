import { useNavigate } from "@tanstack/react-router";
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
import { createWorkspace } from "#/lib/workspace.functions";
import { m } from "#/paraglide/messages";

interface CreateWorkspaceDialogProps {
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

export function CreateWorkspaceDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateWorkspaceDialogProps) {
  const navigate = useNavigate();

  const workspaceSchema = z.object({
    name: z.string().min(1, m.validation_name_required()),
    slug: z.string(),
    description: z.string(),
    iconEmoji: z.string(),
  });

  const form = useForm({
    defaultValues: { name: "", slug: "", description: "", iconEmoji: "" },
    validators: {
      onSubmit: workspaceSchema,
      onBlur: workspaceSchema,
    },
    onSubmit: async ({ value }) => {
      const slug = value.slug || slugify(value.name);

      try {
        await createWorkspace({
          data: {
            name: value.name,
            slug,
            description: value.description || undefined,
            iconEmoji: value.iconEmoji || undefined,
          },
        });

        toast.success(m.workspace_create_success());
        onOpenChange(false);
        onSuccess();
        navigate({ to: "/workspace/$workspaceSlug", params: { workspaceSlug: slug } });
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : m.workspace_create_failed(),
        );
      }
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        onOpenChange(val);
        if (val) {
          form.reset();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{m.workspace_create_title()}</DialogTitle>
          <DialogDescription>
            {m.workspace_create_description()}
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
                  <FieldLabel htmlFor="create-ws-name">{m.common_label_name()}</FieldLabel>
                  <Input
                    id="create-ws-name"
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
                  <FieldLabel htmlFor="create-ws-slug">{m.common_label_slug()}</FieldLabel>
                  <Input
                    id="create-ws-slug"
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
                <FieldLabel htmlFor="create-ws-desc">{m.common_label_description()}</FieldLabel>
                <Textarea
                  id="create-ws-desc"
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
                <FieldLabel htmlFor="create-ws-emoji">{m.workspace_label_icon_emoji()}</FieldLabel>
                <Input
                  id="create-ws-emoji"
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
                  {isSubmitting ? m.common_creating() : m.common_create()}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
