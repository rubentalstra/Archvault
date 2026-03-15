import { useForm } from "@tanstack/react-form";
import { authClient } from "#/lib/auth-client";
import { Button } from "#/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog";
import { Field, FieldLabel } from "#/components/ui/field";
import { Textarea } from "#/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";
import { toast } from "sonner";
import { BAN_DURATIONS } from "#/lib/admin.utils";
import type { AdminUser } from "./user-table-columns";
import { m } from "#/paraglide/messages";

interface BanUserDialogProps {
  user: AdminUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function BanUserDialog({
  user,
  open,
  onOpenChange,
  onSuccess,
}: BanUserDialogProps) {
  const form = useForm({
    defaultValues: {
      banReason: "",
      durationIndex: "4",
    },
    onSubmit: async ({ value }) => {
      if (!user) return;

      const duration = BAN_DURATIONS[Number(value.durationIndex)];

      const { error: banError } = await authClient.admin.banUser({
        userId: user.id,
        banReason: value.banReason || undefined,
        banExpiresIn: duration.seconds,
      });

      if (banError) {
        toast.error(banError.message ?? m.admin_ban_user_failed());
        return;
      }

      toast.success(m.admin_ban_user_success({ name: user.name }));
      onOpenChange(false);
      onSuccess();
    },
  });

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{m.admin_ban_user_title()}</DialogTitle>
          <DialogDescription>
            {m.admin_ban_user_description({ name: user.name, email: user.email })}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void form.handleSubmit();
          }}
          className="flex flex-col gap-4"
        >
          <form.Field name="banReason">
            {(field) => (
              <Field>
                <FieldLabel htmlFor="ban-reason">{m.admin_label_reason()}</FieldLabel>
                <Textarea
                  id="ban-reason"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder={m.admin_placeholder_reason()}
                  rows={3}
                />
              </Field>
            )}
          </form.Field>

          <form.Field name="durationIndex">
            {(field) => (
              <Field>
                <FieldLabel>{m.admin_label_duration()}</FieldLabel>
                <Select
                  value={field.state.value}
                  onValueChange={(val: string | null) => {
                    if (val) field.handleChange(val);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BAN_DURATIONS.map((d, i) => (
                      <SelectItem key={d.label} value={String(i)}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
          </form.Field>

          <DialogFooter>
            <form.Subscribe selector={(s) => s.isSubmitting}>
              {(isSubmitting) => (
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? m.admin_banning() : m.admin_ban_user_submit()}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
