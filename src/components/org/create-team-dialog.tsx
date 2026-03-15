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
import { toast } from "sonner";
import { m } from "#/paraglide/messages";

interface CreateTeamDialogProps {
  organizationId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateTeamDialog({
  organizationId,
  open,
  onOpenChange,
  onSuccess,
}: CreateTeamDialogProps) {
  const teamSchema = z.object({
    name: z.string().min(1, m.validation_name_required()),
  });

  const form = useForm({
    defaultValues: { name: "" },
    validators: {
      onSubmit: teamSchema,
      onBlur: teamSchema,
    },
    onSubmit: async ({ value }) => {
      const { error: createError } = await authClient.organization.createTeam({
        name: value.name,
        organizationId,
      });

      if (createError) {
        toast.error(createError.message ?? m.org_create_team_failed());
        return;
      }

      toast.success(m.org_create_team_success({ name: value.name }));
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
          <DialogTitle>{m.org_create_team_title()}</DialogTitle>
          <DialogDescription>
            {m.org_create_team_description()}
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
                  <FieldLabel htmlFor="team-name">{m.org_label_team_name()}</FieldLabel>
                  <Input
                    id="team-name"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder={m.org_placeholder_team_name()}
                    aria-invalid={isInvalid}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>

          <DialogFooter>
            <form.Subscribe selector={(s) => s.isSubmitting}>
              {(isSubmitting) => (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? m.common_creating() : m.org_create_team_title()}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
