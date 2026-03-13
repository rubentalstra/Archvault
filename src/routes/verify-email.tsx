import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
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
import { Label } from "#/components/ui/label";
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
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(false);

  const form = useForm({
    defaultValues: { otp: "" },
    onSubmit: async ({ value }) => {
      setError(null);
      if (!email) {
        setError("Email is required");
        return;
      }

      const { error: verifyError } =
        await authClient.emailOtp.verifyEmail({
          email,
          otp: value.otp,
        });

      if (verifyError) {
        setError(verifyError.message ?? "Verification failed");
        return;
      }

      toast.success("Email verified!");
      navigate({ to: "/login" });
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
      toast.error(resendError.message ?? "Failed to resend");
    } else {
      toast.success("Code resent!");
    }

    setTimeout(() => setResendCooldown(false), 30000);
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            Verify Your Email
          </CardTitle>
          <CardDescription>
            {email
              ? `Enter the verification code sent to ${email}`
              : "Check your email for a verification code"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
            className="flex flex-col gap-3"
          >
            <form.Field name="otp">
              {(field) => (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="otp">Verification Code</Label>
                  <Input
                    id="otp"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="Enter code"
                    autoFocus
                  />
                </div>
              )}
            </form.Field>

            <form.Subscribe selector={(s) => s.isSubmitting}>
              {(isSubmitting) => (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Verifying..." : "Verify Email"}
                </Button>
              )}
            </form.Subscribe>
          </form>

          <Button
            variant="ghost"
            disabled={resendCooldown || !email}
            onClick={handleResend}
          >
            {resendCooldown ? "Code sent (wait 30s)" : "Resend Code"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            <Link to="/login" className="text-primary underline">
              Back to sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
