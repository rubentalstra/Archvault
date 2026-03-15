import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { z } from "zod/v4";
import { m } from "#/paraglide/messages";
import { authClient } from "#/lib/auth-client";
import { Button } from "#/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "#/components/ui/card";
import { Input } from "#/components/ui/input";
import { Field, FieldError, FieldLabel } from "#/components/ui/field";
import { toast } from "sonner";
import { ArchVaultLogo } from "#/components/archvault-logo";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<"request" | "reset">("request");
  const [email, setEmail] = useState("");

  const requestSchema = z.object({
    email: z.email(m.validation_email_invalid()),
  });

  const resetSchema = z
    .object({
      otp: z.string().min(1, m.validation_otp_required()),
      newPassword: z.string().min(8, m.validation_password_min_length()),
      confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: m.validation_passwords_dont_match(),
      path: ["confirmPassword"],
    });

  const requestForm = useForm({
    defaultValues: { email: "" },
    validators: {
      onSubmit: requestSchema,
      onBlur: requestSchema,
    },
    onSubmit: async ({ value }) => {
      const { error: otpError } =
        await authClient.emailOtp.sendVerificationOtp({
          email: value.email,
          type: "forget-password",
        });

      if (otpError) {
        toast.error(otpError.message ?? m.auth_reset_code_failed());
        return;
      }

      setEmail(value.email);
      setPhase("reset");
      toast.success(m.auth_reset_code_sent());
    },
  });

  const resetForm = useForm({
    defaultValues: { otp: "", newPassword: "", confirmPassword: "" },
    validators: {
      onSubmit: resetSchema,
      onBlur: resetSchema,
    },
    onSubmit: async ({ value }) => {
      const { error: resetError } = await authClient.emailOtp.resetPassword({
        email,
        otp: value.otp,
        password: value.newPassword,
      });

      if (resetError) {
        toast.error(resetError.message ?? m.auth_reset_failed());
        return;
      }

      toast.success(m.auth_reset_success());
      void navigate({ to: "/login" });
    },
  });

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center">
            <ArchVaultLogo className="size-10" />
          </div>
          <CardTitle className="text-2xl font-bold">{m.auth_reset_password_title()}</CardTitle>
          <CardDescription>
            {phase === "request"
              ? m.auth_reset_password_description_request()
              : m.auth_reset_password_description_reset({ email })}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {phase === "request" ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void requestForm.handleSubmit();
              }}
              className="flex flex-col gap-3"
            >
              <requestForm.Field name="email">
                {(field) => {
                  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor="reset-email">{m.common_label_email()}</FieldLabel>
                      <Input
                        id="reset-email"
                        type="email"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        placeholder={m.common_placeholder_email()}
                        autoFocus
                        aria-invalid={isInvalid}
                      />
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  );
                }}
              </requestForm.Field>

              <requestForm.Subscribe selector={(s) => s.isSubmitting}>
                {(isSubmitting) => (
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? m.auth_sending() : m.auth_send_reset_code()}
                  </Button>
                )}
              </requestForm.Subscribe>
            </form>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void resetForm.handleSubmit();
              }}
              className="flex flex-col gap-3"
            >
              <resetForm.Field name="otp">
                {(field) => {
                  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor="reset-otp">{m.auth_reset_code_label()}</FieldLabel>
                      <Input
                        id="reset-otp"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        placeholder={m.auth_reset_code_placeholder()}
                        autoFocus
                        aria-invalid={isInvalid}
                      />
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  );
                }}
              </resetForm.Field>

              <resetForm.Field name="newPassword">
                {(field) => {
                  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor="new-password">{m.auth_label_new_password()}</FieldLabel>
                      <Input
                        id="new-password"
                        type="password"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        placeholder={m.auth_placeholder_password_min()}
                        aria-invalid={isInvalid}
                      />
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  );
                }}
              </resetForm.Field>

              <resetForm.Field name="confirmPassword">
                {(field) => {
                  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor="confirm-new-password">
                        {m.auth_label_confirm_new_password()}
                      </FieldLabel>
                      <Input
                        id="confirm-new-password"
                        type="password"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        aria-invalid={isInvalid}
                      />
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  );
                }}
              </resetForm.Field>

              <resetForm.Subscribe selector={(s) => s.isSubmitting}>
                {(isSubmitting) => (
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? m.auth_resetting() : m.auth_reset_password_title()}
                  </Button>
                )}
              </resetForm.Subscribe>
            </form>
          )}

          <p className="text-center text-sm text-muted-foreground">
            <Link to="/login" className="text-primary underline">
              {m.common_back_to_sign_in()}
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
