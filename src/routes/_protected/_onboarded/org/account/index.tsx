import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { z } from "zod/v4";
import { authClient } from "#/lib/auth-client";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Field, FieldError, FieldLabel } from "#/components/ui/field";
import { Label } from "#/components/ui/label";
import { Separator } from "#/components/ui/separator";
import { toast } from "sonner";
import { m } from "#/paraglide/messages";

export const Route = createFileRoute(
  "/_protected/_onboarded/org/account/",
)({
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = Route.useRouteContext();

  const profileSchema = z.object({
    name: z.string().min(1, m.validation_name_required()),
    image: z.string(),
  });

  const form = useForm({
    defaultValues: {
      name: user.name ?? "",
      image: user.image ?? "",
    },
    validators: {
      onSubmit: profileSchema,
      onBlur: profileSchema,
    },
    onSubmit: async ({ value }) => {
      const { error: updateError } = await authClient.updateUser({
        name: value.name,
        image: value.image || undefined,
      });
      if (updateError) {
        toast.error(
          updateError.message ?? m.settings_profile_update_failed(),
        );
        return;
      }
      toast.success(m.settings_profile_update_success());
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">
          {m.settings_profile_title()}
        </h3>
        <p className="text-sm text-muted-foreground">
          {m.settings_profile_description()}
        </p>
      </div>
      <Separator />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void form.handleSubmit();
        }}
        className="space-y-8"
      >
        <div className="space-y-2">
          <Label>{m.common_label_email()}</Label>
          <Input value={user.email} disabled />
        </div>

        <form.Field name="name">
          {(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor="profile-name">
                  {m.common_label_name()}
                </FieldLabel>
                <Input
                  id="profile-name"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  aria-invalid={isInvalid}
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>

        <form.Field name="image">
          {(field) => (
            <Field>
              <FieldLabel htmlFor="profile-image">
                {m.settings_label_avatar()}
              </FieldLabel>
              <Input
                id="profile-image"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                placeholder={m.settings_placeholder_avatar()}
              />
            </Field>
          )}
        </form.Field>

        <form.Subscribe selector={(s) => s.isSubmitting}>
          {(isSubmitting) => (
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? m.common_saving() : m.common_save_changes()}
            </Button>
          )}
        </form.Subscribe>
      </form>
    </div>
  );
}
