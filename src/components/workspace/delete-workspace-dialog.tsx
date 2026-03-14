import { useState } from "react";
import { Button } from "#/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "#/components/ui/alert-dialog";
import { toast } from "sonner";
import { deleteWorkspace } from "#/lib/workspace.functions";
import { m } from "#/paraglide/messages";
import type { Workspace } from "./workspace-table-columns";

interface DeleteWorkspaceDialogProps {
  workspace: Workspace | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function DeleteWorkspaceDialog({
  workspace,
  open,
  onOpenChange,
  onSuccess,
}: DeleteWorkspaceDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!workspace) return;
    setLoading(true);

    try {
      await deleteWorkspace({ data: { id: workspace.id } });
      toast.success(m.workspace_delete_workspace_success());
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : m.workspace_delete_workspace_failed(),
      );
    } finally {
      setLoading(false);
    }
  };

  if (!workspace) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {m.workspace_delete_workspace()}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {m.workspace_delete_workspace_confirm({ name: workspace.name })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{m.common_cancel()}</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? m.common_deleting() : m.common_delete()}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
