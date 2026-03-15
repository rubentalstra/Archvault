import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { z } from "zod/v4";
import { authClient } from "#/lib/auth-client";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Field, FieldError, FieldLabel } from "#/components/ui/field";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "#/components/ui/alert-dialog";
import { Badge } from "#/components/ui/badge";
import { Separator } from "#/components/ui/separator";
import { ShieldCheck, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { m } from "#/paraglide/messages";

export const Route = createFileRoute(
  "/_protected/_onboarded/org/account/security",
)({
  component: SecurityPage,
});

function SecurityPage() {
  const { user } = Route.useRouteContext();
  const [totpUri, setTotpUri] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);

  const is2FAEnabled = user.twoFactorEnabled ?? false;

  const passwordSchema = z.object({
    password: z.string().min(1, m.validation_field_required()),
  });

  const codeSchema = z.object({
    code: z.string().length(6, m.validation_totp_length()),
  });

  const enableForm = useForm({
    defaultValues: { password: "" },
    validators: {
      onSubmit: passwordSchema,
      onBlur: passwordSchema,
    },
    onSubmit: async ({ value }) => {
      const { data, error: enableError } =
        await authClient.twoFactor.enable({ password: value.password });
      if (enableError) {
        toast.error(
          enableError.message ?? m.settings_two_factor_enable_failed(),
        );
        return;
      }
      if (data) {
        setTotpUri(data.totpURI);
        setBackupCodes(data.backupCodes);
      }
    },
  });

  const verifyForm = useForm({
    defaultValues: { code: "" },
    validators: {
      onSubmit: codeSchema,
      onBlur: codeSchema,
    },
    onSubmit: async ({ value }) => {
      const { error: verifyError } = await authClient.twoFactor.verifyTotp({
        code: value.code,
      });
      if (verifyError) {
        toast.error(
          verifyError.message ?? m.settings_two_factor_invalid_code(),
        );
        return;
      }
      toast.success(m.settings_two_factor_enable_success());
      setTotpUri(null);
      setBackupCodes(null);
      window.location.reload();
    },
  });

  const handleDisable = async () => {
    const password = prompt("Enter your password to disable 2FA");
    if (!password) return;
    const { error: disableError } = await authClient.twoFactor.disable({
      password,
    });
    if (disableError) {
      toast.error(
        disableError.message ?? m.settings_two_factor_disable_failed(),
      );
      return;
    }
    toast.success(m.settings_two_factor_disable_success());
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">
          {m.settings_security_title()}
        </h3>
        <p className="text-sm text-muted-foreground">
          {m.settings_security_description()}
        </p>
      </div>
      <Separator />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {is2FAEnabled ? (
              <ShieldCheck className="size-5 text-emerald-500" />
            ) : (
              <ShieldOff className="size-5 text-muted-foreground" />
            )}
            <div>
              <p className="text-sm font-medium">
                {m.settings_two_factor_title()}
              </p>
              <p className="text-[0.8rem] text-muted-foreground">
                {is2FAEnabled
                  ? m.settings_two_factor_enabled()
                  : m.settings_two_factor_disabled()}
              </p>
            </div>
          </div>
          <Badge variant={is2FAEnabled ? "default" : "outline"}>
            {is2FAEnabled ? "Enabled" : "Disabled"}
          </Badge>
        </div>

        {is2FAEnabled && !totpUri && (
          <AlertDialog>
            <AlertDialogTrigger render={<Button variant="destructive" />}>
              {m.settings_two_factor_disable()}
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {m.settings_two_factor_disable_title()}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {m.settings_two_factor_disable_description()}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{m.common_cancel()}</AlertDialogCancel>
                <AlertDialogAction onClick={handleDisable}>
                  {m.settings_two_factor_disable_confirm()}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {!is2FAEnabled && !totpUri && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void enableForm.handleSubmit();
            }}
            className="space-y-4"
          >
            <enableForm.Field name="password">
              {(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor="2fa-password">
                      {m.settings_two_factor_enable_password()}
                    </FieldLabel>
                    <Input
                      id="2fa-password"
                      type="password"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      className="max-w-sm"
                      aria-invalid={isInvalid}
                    />
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                );
              }}
            </enableForm.Field>
            <enableForm.Subscribe selector={(s) => s.isSubmitting}>
              {(isSubmitting) => (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? m.settings_two_factor_setting_up()
                    : m.settings_two_factor_enable()}
                </Button>
              )}
            </enableForm.Subscribe>
          </form>
        )}

        {totpUri && (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-3">
              <p className="text-sm text-muted-foreground">
                {m.settings_two_factor_qr_description()}
              </p>
              <div className="rounded-lg border bg-white p-4">
                <QRCodeSVG value={totpUri} size={200} />
              </div>
            </div>

            {backupCodes && (
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  {m.settings_two_factor_backup_codes()}
                </p>
                <div className="grid grid-cols-2 gap-1 rounded-lg border bg-muted p-3 font-mono text-sm">
                  {backupCodes.map((code) => (
                    <span key={code}>{code}</span>
                  ))}
                </div>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                void verifyForm.handleSubmit();
              }}
              className="space-y-4"
            >
              <verifyForm.Field name="code">
                {(field) => {
                  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor="verify-totp">
                        {m.settings_two_factor_verify_label()}
                      </FieldLabel>
                      <Input
                        id="verify-totp"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="000000"
                        maxLength={6}
                        className="max-w-[200px]"
                        aria-invalid={isInvalid}
                      />
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  );
                }}
              </verifyForm.Field>
              <verifyForm.Subscribe selector={(s) => s.isSubmitting}>
                {(isSubmitting) => (
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting
                      ? m.common_verifying()
                      : m.settings_two_factor_verify_submit()}
                  </Button>
                )}
              </verifyForm.Subscribe>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
