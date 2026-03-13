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

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<"request" | "reset">("request");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  const requestForm = useForm({
    defaultValues: { email: "" },
    onSubmit: async ({ value }) => {
      setError(null);
      const { error: otpError } =
        await authClient.emailOtp.sendVerificationOtp({
          email: value.email,
          type: "forget-password",
        });

      if (otpError) {
        setError(otpError.message ?? "Failed to send code");
        return;
      }

      setEmail(value.email);
      setPhase("reset");
      toast.success("Reset code sent to your email");
    },
  });

  const resetForm = useForm({
    defaultValues: { otp: "", newPassword: "", confirmPassword: "" },
    onSubmit: async ({ value }) => {
      setError(null);

      if (value.newPassword !== value.confirmPassword) {
        setError("Passwords don't match");
        return;
      }

      if (value.newPassword.length < 8) {
        setError("Password must be at least 8 characters");
        return;
      }

      const { error: resetError } = await authClient.emailOtp.resetPassword({
        email,
        otp: value.otp,
        password: value.newPassword,
      });

      if (resetError) {
        setError(resetError.message ?? "Password reset failed");
        return;
      }

      toast.success("Password reset successfully!");
      navigate({ to: "/login" });
    },
  });

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
          <CardDescription>
            {phase === "request"
              ? "Enter your email to receive a reset code"
              : `Enter the code sent to ${email}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          {phase === "request" ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                requestForm.handleSubmit();
              }}
              className="flex flex-col gap-3"
            >
              <requestForm.Field name="email">
                {(field) => (
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="reset-email">Email</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="you@example.com"
                      autoFocus
                    />
                  </div>
                )}
              </requestForm.Field>

              <requestForm.Subscribe selector={(s) => s.isSubmitting}>
                {(isSubmitting) => (
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Sending..." : "Send Reset Code"}
                  </Button>
                )}
              </requestForm.Subscribe>
            </form>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                resetForm.handleSubmit();
              }}
              className="flex flex-col gap-3"
            >
              <resetForm.Field name="otp">
                {(field) => (
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="reset-otp">Reset Code</Label>
                    <Input
                      id="reset-otp"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="Enter code"
                      autoFocus
                    />
                  </div>
                )}
              </resetForm.Field>

              <resetForm.Field name="newPassword">
                {(field) => (
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="Min. 8 characters"
                    />
                  </div>
                )}
              </resetForm.Field>

              <resetForm.Field name="confirmPassword">
                {(field) => (
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="confirm-new-password">
                      Confirm New Password
                    </Label>
                    <Input
                      id="confirm-new-password"
                      type="password"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                    />
                  </div>
                )}
              </resetForm.Field>

              <resetForm.Subscribe selector={(s) => s.isSubmitting}>
                {(isSubmitting) => (
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Resetting..." : "Reset Password"}
                  </Button>
                )}
              </resetForm.Subscribe>
            </form>
          )}

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
