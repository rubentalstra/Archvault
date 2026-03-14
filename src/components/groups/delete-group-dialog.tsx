import { useState } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "#/components/ui/alert-dialog";
import { Button } from "#/components/ui/button";
import { toast } from "sonner";
import { m } from "#/paraglide/messages";
import { deleteGroup } from "#/lib/group.functions";

interface DeleteGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: { id: string; name: string } | null;
  onSuccess: () => void;
}

export function DeleteGroupDialog({
  open,
  onOpenChange,
  group: g,
  onSuccess,
}: DeleteGroupDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!g) return;
    setLoading(true);
    try {
      await deleteGroup({ data: { id: g.id } });
      toast.success(m.group_delete_success());
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : m.group_delete_failed(),
      );
    } finally {
      setLoading(false);
    }
  };

  if (!g) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{m.group_delete_title()}</AlertDialogTitle>
          <AlertDialogDescription>
            {m.group_delete_confirm({ name: g.name })}
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
