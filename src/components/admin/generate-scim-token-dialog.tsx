import { useState } from "react";
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
import { Field, FieldDescription, FieldError, FieldLabel } from "#/components/ui/field";
import { toast } from "sonner";
import { Copy, AlertTriangle } from "lucide-react";
import { m } from "#/paraglide/messages";

interface GenerateScimTokenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function GenerateScimTokenDialog({
  open,
  onOpenChange,
  onSuccess,
}: GenerateScimTokenDialogProps) {
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);

  const tokenSchema = z.object({
    providerId: z.string().min(1, m.validation_provider_id_required()),
    organizationId: z.string().optional(),
  });

  const form = useForm({
    defaultValues: {
      providerId: "",
      organizationId: "",
    },
    validators: {
      onSubmit: tokenSchema,
      onBlur: tokenSchema,
    },
    onSubmit: async ({ value }) => {
      setGeneratedToken(null);

      const body: { providerId: string; organizationId?: string } = {
        providerId: value.providerId,
      };
      if (value.organizationId) {
        body.organizationId = value.organizationId;
      }

      const { data, error: genError } = await authClient.scim.generateToken(body);

      if (genError) {
        toast.error((genError as { message?: string }).message ?? m.admin_scim_generate_failed());
        return;
      }

      const token = (data as { token?: string })?.token ?? String(data);
      setGeneratedToken(token);
      toast.success(m.admin_scim_generate_success());
      onSuccess();
    },
  });

  const handleCopyToken = async () => {
    if (!generatedToken) return;
    await navigator.clipboard.writeText(generatedToken);
    toast.success(m.admin_scim_token_copied());
  };

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      setGeneratedToken(null);
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{m.admin_scim_generate_title()}</DialogTitle>
          <DialogDescription>
            {m.admin_scim_generate_description()}
          </DialogDescription>
        </DialogHeader>

        {generatedToken ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-2 rounded-lg border border-amber-500/50 bg-amber-50 p-3 dark:bg-amber-950/20">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
              <p className="text-sm text-amber-800 dark:text-amber-200">
                {m.admin_scim_token_warning()}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <code className="flex-1 overflow-x-auto rounded bg-muted p-3 text-xs break-all">
                {generatedToken}
              </code>
              <Button variant="outline" size="icon-sm" onClick={handleCopyToken}>
                <Copy className="size-4" />
              </Button>
            </div>

            <div className="rounded-lg border bg-muted/30 p-3">
              <p className="text-sm">
                <span className="font-medium">{m.admin_scim_base_url()} </span>
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                  {typeof window !== "undefined" ? window.location.origin : ""}/api/auth/scim/v2
                </code>
              </p>
            </div>

            <DialogFooter>
              <Button onClick={() => handleClose(false)}>{m.common_done()}</Button>
            </DialogFooter>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void form.handleSubmit();
            }}
            className="flex flex-col gap-4"
          >
            <form.Field name="providerId">
              {(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor="scim-provider-id">{m.admin_scim_label_provider_id()}</FieldLabel>
                    <Input
                      id="scim-provider-id"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder={m.admin_scim_placeholder_provider_id()}
                      aria-invalid={isInvalid}
                    />
                    <FieldDescription>
                      {m.admin_scim_provider_id_hint()}
                    </FieldDescription>
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                );
              }}
            </form.Field>

            <form.Field name="organizationId">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor="scim-org-id">{m.admin_scim_label_org_id()}</FieldLabel>
                  <Input
                    id="scim-org-id"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder={m.admin_scim_placeholder_org_id()}
                  />
                </Field>
              )}
            </form.Field>

            <DialogFooter>
              <form.Subscribe selector={(s) => s.isSubmitting}>
                {(isSubmitting) => (
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? m.admin_scim_generating() : m.admin_scim_generate_token()}
                  </Button>
                )}
              </form.Subscribe>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
