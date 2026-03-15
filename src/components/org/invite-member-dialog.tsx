import { useForm } from "@tanstack/react-form";
import { z } from "zod/v4";
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
import { Input } from "#/components/ui/input";
import { Field, FieldError, FieldLabel } from "#/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";
import { toast } from "sonner";
import { m } from "#/paraglide/messages";

interface InviteMemberDialogProps {
  organizationId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function InviteMemberDialog({
  organizationId,
  open,
  onOpenChange,
  onSuccess,
}: InviteMemberDialogProps) {
  const inviteSchema = z.object({
    email: z.email(m.validation_email_invalid()),
    role: z.enum(["admin", "editor", "viewer"]),
  });

  const form = useForm({
    defaultValues: { email: "", role: "viewer" as "admin" | "editor" | "viewer" },
    validators: {
      onSubmit: inviteSchema,
      onBlur: inviteSchema,
    },
    onSubmit: async ({ value }) => {
      const { error: inviteError } =
        await authClient.organization.inviteMember({
          email: value.email,
          role: value.role,
          organizationId,
        });

      if (inviteError) {
        toast.error(inviteError.message ?? m.org_invite_failed());
        return;
      }

      toast.success(m.org_invite_success({ email: value.email }));
      onOpenChange(false);
      onSuccess();
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
          <DialogTitle>{m.org_invite_title()}</DialogTitle>
          <DialogDescription>
            {m.org_invite_description()}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void form.handleSubmit();
          }}
          className="flex flex-col gap-4"
        >
          <form.Field name="email">
            {(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor="invite-email">{m.common_label_email()}</FieldLabel>
                  <Input
                    id="invite-email"
                    type="email"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder={m.org_invite_placeholder_email()}
                    aria-invalid={isInvalid}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>

          <form.Field name="role">
            {(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel>{m.common_label_role()}</FieldLabel>
                  <Select
                    value={field.state.value}
                    onValueChange={(val: string | null) => {
                      if (val) field.handleChange(val as "admin" | "editor" | "viewer");
                    }}
                  >
                    <SelectTrigger className="w-full" aria-invalid={isInvalid}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">{m.common_role_admin()}</SelectItem>
                      <SelectItem value="editor">{m.common_role_editor()}</SelectItem>
                      <SelectItem value="viewer">{m.common_role_viewer()}</SelectItem>
                    </SelectContent>
                  </Select>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>

          <DialogFooter>
            <form.Subscribe selector={(s) => s.isSubmitting}>
              {(isSubmitting) => (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? m.org_invite_sending() : m.org_invite_submit()}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
