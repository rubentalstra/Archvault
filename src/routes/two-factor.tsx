import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { z } from "zod/v4";
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

const searchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/two-factor")({
  validateSearch: (search) => searchSchema.parse(search),
  component: TwoFactorPage,
});

function TwoFactorPage() {
  const navigate = useNavigate();
  const { redirect: redirectTo } = Route.useSearch();
  const [useBackup, setUseBackup] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSuccess = () => {
    toast.success("Verified!");
    if (redirectTo) {
      window.location.href = redirectTo;
    } else {
      navigate({ to: "/_protected/dashboard" });
    }
  };

  const totpForm = useForm({
    defaultValues: { code: "" },
    onSubmit: async ({ value }) => {
      setError(null);
      const { error: verifyError } = await authClient.twoFactor.verifyTotp({
        code: value.code,
      });

      if (verifyError) {
        setError(verifyError.message ?? "Invalid code");
        return;
      }

      onSuccess();
    },
  });

  const backupForm = useForm({
    defaultValues: { code: "" },
    onSubmit: async ({ value }) => {
      setError(null);
      const { error: verifyError } =
        await authClient.twoFactor.verifyBackupCode({
          code: value.code,
        });

      if (verifyError) {
        setError(verifyError.message ?? "Invalid backup code");
        return;
      }

      onSuccess();
    },
  });

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            {useBackup
              ? "Enter one of your backup codes"
              : "Enter the 6-digit code from your authenticator app"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          {!useBackup ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                totpForm.handleSubmit();
              }}
              className="flex flex-col gap-3"
            >
              <totpForm.Field name="code">
                {(field) => (
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="totp-code">Authentication Code</Label>
                    <Input
                      id="totp-code"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="000000"
                      maxLength={6}
                      autoFocus
                    />
                  </div>
                )}
              </totpForm.Field>

              <totpForm.Subscribe selector={(s) => s.isSubmitting}>
                {(isSubmitting) => (
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Verifying..." : "Verify"}
                  </Button>
                )}
              </totpForm.Subscribe>
            </form>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                backupForm.handleSubmit();
              }}
              className="flex flex-col gap-3"
            >
              <backupForm.Field name="code">
                {(field) => (
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="backup-code">Backup Code</Label>
                    <Input
                      id="backup-code"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="Enter backup code"
                      autoFocus
                    />
                  </div>
                )}
              </backupForm.Field>

              <backupForm.Subscribe selector={(s) => s.isSubmitting}>
                {(isSubmitting) => (
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Verifying..." : "Verify Backup Code"}
                  </Button>
                )}
              </backupForm.Subscribe>
            </form>
          )}

          <Button
            variant="ghost"
            onClick={() => {
              setUseBackup(!useBackup);
              setError(null);
            }}
          >
            {useBackup
              ? "Use authenticator app instead"
              : "Use a backup code"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            <Link to="/login" className="text-primary underline">
              Cancel
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
