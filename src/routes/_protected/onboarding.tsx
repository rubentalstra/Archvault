import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { z } from "zod/v4";
import { authClient } from "#/lib/auth-client";
import { getUserOrganizations } from "#/lib/org.functions";
import { Button } from "#/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "#/components/ui/card";
import { Input } from "#/components/ui/input";
import { Field, FieldDescription, FieldError, FieldLabel } from "#/components/ui/field";
import { toast } from "sonner";
import { m } from "#/paraglide/messages";

export const Route = createFileRoute("/_protected/onboarding")({
  beforeLoad: async () => {
    const organizations = await getUserOrganizations();
    if (organizations && organizations.length > 0) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: OnboardingPage,
});

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function OnboardingPage() {
  const navigate = useNavigate();

  const onboardingSchema = z.object({
    name: z.string().min(1, m.validation_name_required()),
    slug: z.string(),
  });

  const form = useForm({
    defaultValues: { name: "", slug: "" },
    validators: {
      onSubmit: onboardingSchema,
      onBlur: onboardingSchema,
    },
    onSubmit: async ({ value }) => {
      const slug = value.slug || slugify(value.name);

      const { data, error: createError } =
        await authClient.organization.create({
          name: value.name,
          slug,
        });

      if (createError) {
        toast.error(createError.message ?? m.onboarding_create_failed());
        return;
      }

      if (data) {
        await authClient.organization.setActive({
          organizationId: data.id,
        });
      }

      toast.success(m.onboarding_create_success());
      void navigate({ to: "/dashboard" });
    },
  });

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {m.onboarding_title()}
          </CardTitle>
          <CardDescription>
            {m.onboarding_description()}
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                    <FieldLabel htmlFor="org-name">{m.onboarding_label_name()}</FieldLabel>
                    <Input
                      id="org-name"
                      value={field.state.value}
                      onChange={(e) => {
                        field.handleChange(e.target.value);
                        const slugField = form.getFieldValue("slug");
                        if (!slugField || slugField === slugify(field.state.value)) {
                          form.setFieldValue("slug", slugify(e.target.value));
                        }
                      }}
                      onBlur={field.handleBlur}
                      placeholder={m.onboarding_placeholder_name()}
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
                    <FieldLabel htmlFor="org-slug">{m.common_label_slug()}</FieldLabel>
                    <Input
                      id="org-slug"
                      value={field.state.value}
                      onChange={(e) =>
                        field.handleChange(
                          e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9-]/g, ""),
                        )
                      }
                      onBlur={field.handleBlur}
                      placeholder={m.onboarding_placeholder_slug()}
                      aria-invalid={isInvalid}
                    />
                    <FieldDescription>
                      {m.onboarding_slug_hint()}
                    </FieldDescription>
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                );
              }}
            </form.Field>

            <form.Subscribe selector={(s) => s.isSubmitting}>
              {(isSubmitting) => (
                <Button type="submit" disabled={isSubmitting} className="mt-2">
                  {isSubmitting ? m.common_creating() : m.onboarding_submit()}
                </Button>
              )}
            </form.Subscribe>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
