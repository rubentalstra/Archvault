import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
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
import { z } from "zod/v4";

const searchSchema = z.object({
  email: z.string().optional(),
});

export const Route = createFileRoute("/verify-email")({
  validateSearch: (search) => searchSchema.parse(search),
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const navigate = useNavigate();
  const { email } = Route.useSearch();
  const [resendCooldown, setResendCooldown] = useState(false);

  const otpSchema = z.object({
    otp: z.string().min(1, m.validation_otp_required()),
  });

  const form = useForm({
    defaultValues: { otp: "" },
    validators: {
      onSubmit: otpSchema,
      onBlur: otpSchema,
    },
    onSubmit: async ({ value }) => {
      if (!email) {
        toast.error(m.auth_verify_email_required());
        return;
      }

      const { error: verifyError } =
        await authClient.emailOtp.verifyEmail({
          email,
          otp: value.otp,
        });

      if (verifyError) {
        toast.error(verifyError.message ?? m.auth_verify_email_failed());
        return;
      }

      toast.success(m.auth_verify_email_success());
      void navigate({ to: "/login" });
    },
  });

  const handleResend = async () => {
    if (!email || resendCooldown) return;
    setResendCooldown(true);

    const { error: resendError } =
      await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "email-verification",
      });

    if (resendError) {
      toast.error(resendError.message ?? m.auth_verify_email_resend_failed());
    } else {
      toast.success(m.auth_verify_email_resend_success());
    }

    setTimeout(() => setResendCooldown(false), 30000);
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {m.auth_verify_email_title()}
          </CardTitle>
          <CardDescription>
            {email
              ? m.auth_verify_email_description({ email })
              : m.auth_verify_email_description_generic()}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void form.handleSubmit();
            }}
            className="flex flex-col gap-3"
          >
            <form.Field name="otp">
              {(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor="otp">{m.auth_verify_email_label()}</FieldLabel>
                    <Input
                      id="otp"
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
            </form.Field>

            <form.Subscribe selector={(s) => s.isSubmitting}>
              {(isSubmitting) => (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? m.common_verifying() : m.auth_verify_email_submit()}
                </Button>
              )}
            </form.Subscribe>
          </form>

          <Button
            variant="ghost"
            disabled={resendCooldown || !email}
            onClick={handleResend}
          >
            {resendCooldown ? m.auth_verify_email_resend_cooldown() : m.auth_verify_email_resend()}
          </Button>

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
