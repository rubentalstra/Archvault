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

  const onSuccess = () => {
    toast.success(m.auth_two_factor_verified());
    if (redirectTo) {
      window.location.href = redirectTo;
    } else {
      void navigate({ to: "/dashboard" });
    }
  };

  const totpSchema = z.object({
    code: z.string().length(6, m.validation_totp_length()),
  });

  const backupSchema = z.object({
    code: z.string().min(1, m.validation_code_required()),
  });

  const totpForm = useForm({
    defaultValues: { code: "" },
    validators: {
      onSubmit: totpSchema,
      onBlur: totpSchema,
    },
    onSubmit: async ({ value }) => {
      const { error: verifyError } = await authClient.twoFactor.verifyTotp({
        code: value.code,
      });

      if (verifyError) {
        toast.error(verifyError.message ?? m.auth_two_factor_invalid_code());
        return;
      }

      onSuccess();
    },
  });

  const backupForm = useForm({
    defaultValues: { code: "" },
    validators: {
      onSubmit: backupSchema,
      onBlur: backupSchema,
    },
    onSubmit: async ({ value }) => {
      const { error: verifyError } =
        await authClient.twoFactor.verifyBackupCode({
          code: value.code,
        });

      if (verifyError) {
        toast.error(verifyError.message ?? m.auth_two_factor_invalid_backup());
        return;
      }

      onSuccess();
    },
  });

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center">
            <ArchVaultLogo className="size-10" />
          </div>
          <CardTitle className="text-2xl font-bold">
            {m.auth_two_factor_title()}
          </CardTitle>
          <CardDescription>
            {useBackup
              ? m.auth_two_factor_description_backup()
              : m.auth_two_factor_description_totp()}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {!useBackup ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void totpForm.handleSubmit();
              }}
              className="flex flex-col gap-3"
            >
              <totpForm.Field name="code">
                {(field) => {
                  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor="totp-code">{m.auth_two_factor_code_label()}</FieldLabel>
                      <Input
                        id="totp-code"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        placeholder={m.auth_two_factor_code_placeholder()}
                        maxLength={6}
                        autoFocus
                        aria-invalid={isInvalid}
                      />
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  );
                }}
              </totpForm.Field>

              <totpForm.Subscribe selector={(s) => s.isSubmitting}>
                {(isSubmitting) => (
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? m.common_verifying() : m.auth_two_factor_verify()}
                  </Button>
                )}
              </totpForm.Subscribe>
            </form>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void backupForm.handleSubmit();
              }}
              className="flex flex-col gap-3"
            >
              <backupForm.Field name="code">
                {(field) => {
                  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor="backup-code">{m.auth_two_factor_backup_label()}</FieldLabel>
                      <Input
                        id="backup-code"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        placeholder={m.auth_two_factor_backup_placeholder()}
                        autoFocus
                        aria-invalid={isInvalid}
                      />
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  );
                }}
              </backupForm.Field>

              <backupForm.Subscribe selector={(s) => s.isSubmitting}>
                {(isSubmitting) => (
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? m.common_verifying() : m.auth_two_factor_verify_backup()}
                  </Button>
                )}
              </backupForm.Subscribe>
            </form>
          )}

          <Button
            variant="ghost"
            onClick={() => setUseBackup(!useBackup)}
          >
            {useBackup
              ? m.auth_two_factor_use_authenticator()
              : m.auth_two_factor_use_backup()}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            <Link to="/login" className="text-primary underline">
              {m.common_cancel()}
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
