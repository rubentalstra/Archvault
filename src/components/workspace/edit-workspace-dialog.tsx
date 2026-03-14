import { useEffect, useState } from "react";
import { useForm } from "@tanstack/react-form";
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
import { Label } from "#/components/ui/label";
import { Textarea } from "#/components/ui/textarea";
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
  const [error, setError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      name: workspace?.name ?? "",
      slug: workspace?.slug ?? "",
      description: workspace?.description ?? "",
      iconEmoji: workspace?.iconEmoji ?? "",
    },
    onSubmit: async ({ value }) => {
      if (!workspace) return;
      setError(null);

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
        setError(
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
      setError(null);
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

        {error && <p className="text-sm text-destructive">{error}</p>}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className="flex flex-col gap-4"
        >
          <form.Field name="name">
            {(field) => (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-ws-name">{m.common_label_name()}</Label>
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
                />
              </div>
            )}
          </form.Field>

          <form.Field name="slug">
            {(field) => (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-ws-slug">{m.common_label_slug()}</Label>
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
                />
              </div>
            )}
          </form.Field>

          <form.Field name="description">
            {(field) => (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-ws-desc">
                  {m.common_label_description()}
                </Label>
                <Textarea
                  id="edit-ws-desc"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder={m.workspace_placeholder_description()}
                  rows={3}
                />
              </div>
            )}
          </form.Field>

          <form.Field name="iconEmoji">
            {(field) => (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-ws-emoji">
                  {m.workspace_label_icon_emoji()}
                </Label>
                <Input
                  id="edit-ws-emoji"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="📁"
                  className="w-20"
                />
              </div>
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
