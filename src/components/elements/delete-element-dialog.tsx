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
import { deleteElement } from "#/lib/element.functions";

interface DeleteElementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  element: { id: string; name: string } | null;
  hasChildren: boolean;
  onSuccess: () => void;
}

export function DeleteElementDialog({
  open,
  onOpenChange,
  element,
  hasChildren,
  onSuccess,
}: DeleteElementDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!element) return;
    setLoading(true);
    try {
      await deleteElement({ data: { id: element.id } });
      toast.success(m.element_delete_success());
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : m.element_delete_failed(),
      );
    } finally {
      setLoading(false);
    }
  };

  if (!element) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{m.element_delete_title()}</AlertDialogTitle>
          <AlertDialogDescription>
            {hasChildren
              ? m.element_delete_confirm({ name: element.name })
              : m.element_delete_confirm_no_children({ name: element.name })}
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
