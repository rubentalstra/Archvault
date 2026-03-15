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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";
import { Textarea } from "#/components/ui/textarea";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { m } from "#/paraglide/messages";

interface RegisterSSODialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function RegisterSSODialog({
  open,
  onOpenChange,
  onSuccess,
}: RegisterSSODialogProps) {
  const [showSecret, setShowSecret] = useState(false);

  const ssoSchema = z.object({
    providerId: z
      .string()
      .min(2, m.validation_provider_id_min())
      .regex(/^[a-z0-9-]+$/, m.validation_provider_id_format()),
    issuer: z.url(m.validation_url_invalid()),
    domain: z.string().min(3, m.validation_domain_required()),
    type: z.enum(["oidc", "saml"]),
    clientId: z.string().optional(),
    clientSecret: z.string().optional(),
    entryPoint: z.string().optional(),
    certificate: z.string().optional(),
    callbackUrl: z.string().optional(),
    organizationId: z.string().optional(),
  });

  const form = useForm({
    defaultValues: {
      providerId: "",
      issuer: "",
      domain: "",
      type: "oidc" as "oidc" | "saml",
      clientId: "",
      clientSecret: "",
      entryPoint: "",
      certificate: "",
      callbackUrl: "",
      organizationId: "",
    },
    validators: {
      onSubmit: ssoSchema,
      onBlur: ssoSchema,
    },
    onSubmit: async ({ value }) => {
      const body: Record<string, unknown> = {
        providerId: value.providerId,
        issuer: value.issuer,
        domain: value.domain,
      };

      if (value.organizationId) {
        body.organizationId = value.organizationId;
      }

      if (value.type === "oidc") {
        if (!value.clientId || !value.clientSecret) {
          toast.error(m.validation_oidc_credentials_required());
          return;
        }
        body.oidcConfig = {
          clientId: value.clientId,
          clientSecret: value.clientSecret,
        };
      } else {
        if (!value.entryPoint || !value.certificate) {
          toast.error(m.validation_saml_credentials_required());
          return;
        }
        body.samlConfig = {
          entryPoint: value.entryPoint,
          cert: value.certificate,
          callbackUrl: value.callbackUrl || undefined,
        };
      }

      const { error: registerError } = await authClient.sso.register(
        body as Parameters<typeof authClient.sso.register>[0],
      );

      if (registerError) {
        toast.error((registerError as { message?: string }).message ?? m.admin_sso_register_failed());
        return;
      }

      toast.success(m.admin_sso_register_success());
      onOpenChange(false);
      onSuccess();
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{m.admin_sso_register_title()}</DialogTitle>
          <DialogDescription>
            {m.admin_sso_register_description()}
          </DialogDescription>
        </DialogHeader>

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
                  <FieldLabel htmlFor="sso-provider-id">{m.admin_sso_label_provider_id()}</FieldLabel>
                  <Input
                    id="sso-provider-id"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder={m.admin_sso_placeholder_provider_id()}
                    aria-invalid={isInvalid}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>

          <form.Field name="issuer">
            {(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor="sso-issuer">{m.admin_sso_label_issuer_url()}</FieldLabel>
                  <Input
                    id="sso-issuer"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder={m.admin_sso_placeholder_issuer_url()}
                    aria-invalid={isInvalid}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>

          <form.Field name="domain">
            {(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor="sso-domain">{m.admin_sso_label_domain()}</FieldLabel>
                  <Input
                    id="sso-domain"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder={m.admin_sso_placeholder_domain()}
                    aria-invalid={isInvalid}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>

          <form.Field name="type">
            {(field) => (
              <Field>
                <FieldLabel>{m.admin_sso_label_type()}</FieldLabel>
                <Select
                  value={field.state.value}
                  onValueChange={(val: string | null) => {
                    if (val) field.handleChange(val as "oidc" | "saml");
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="oidc">OIDC</SelectItem>
                    <SelectItem value="saml">SAML</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            )}
          </form.Field>

          <form.Subscribe selector={(s) => s.values.type}>
            {(type) =>
              type === "oidc" ? (
                <>
                  <form.Field name="clientId">
                    {(field) => (
                      <Field>
                        <FieldLabel htmlFor="sso-client-id">{m.admin_sso_label_client_id()}</FieldLabel>
                        <Input
                          id="sso-client-id"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                          placeholder={m.admin_sso_placeholder_client_id()}
                        />
                      </Field>
                    )}
                  </form.Field>

                  <form.Field name="clientSecret">
                    {(field) => (
                      <Field>
                        <FieldLabel htmlFor="sso-client-secret">{m.admin_sso_label_client_secret()}</FieldLabel>
                        <div className="relative">
                          <Input
                            id="sso-client-secret"
                            type={showSecret ? "text" : "password"}
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            onBlur={field.handleBlur}
                            placeholder={m.admin_sso_placeholder_client_secret()}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="absolute right-1 top-1/2 -translate-y-1/2"
                            onClick={() => setShowSecret(!showSecret)}
                          >
                            {showSecret ? (
                              <EyeOff className="size-4" />
                            ) : (
                              <Eye className="size-4" />
                            )}
                          </Button>
                        </div>
                        <FieldDescription>
                          {m.admin_sso_oidc_auto_discover()}
                        </FieldDescription>
                      </Field>
                    )}
                  </form.Field>
                </>
              ) : (
                <>
                  <form.Field name="entryPoint">
                    {(field) => (
                      <Field>
                        <FieldLabel htmlFor="sso-entry-point">{m.admin_sso_label_entry_point()}</FieldLabel>
                        <Input
                          id="sso-entry-point"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                          placeholder={m.admin_sso_placeholder_entry_point()}
                        />
                      </Field>
                    )}
                  </form.Field>

                  <form.Field name="certificate">
                    {(field) => (
                      <Field>
                        <FieldLabel htmlFor="sso-certificate">{m.admin_sso_label_certificate()}</FieldLabel>
                        <Textarea
                          id="sso-certificate"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                          placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                          rows={4}
                        />
                      </Field>
                    )}
                  </form.Field>

                  <form.Field name="callbackUrl">
                    {(field) => (
                      <Field>
                        <FieldLabel htmlFor="sso-callback-url">{m.admin_sso_label_callback_url()}</FieldLabel>
                        <Input
                          id="sso-callback-url"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                          placeholder={m.admin_sso_placeholder_callback_url()}
                        />
                      </Field>
                    )}
                  </form.Field>
                </>
              )
            }
          </form.Subscribe>

          <form.Field name="organizationId">
            {(field) => (
              <Field>
                <FieldLabel htmlFor="sso-org-id">{m.admin_sso_label_org_id()}</FieldLabel>
                <Input
                  id="sso-org-id"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder={m.admin_sso_placeholder_org_link()}
                />
              </Field>
            )}
          </form.Field>

          <DialogFooter>
            <form.Subscribe selector={(s) => s.isSubmitting}>
              {(isSubmitting) => (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? m.admin_sso_registering() : m.admin_sso_register()}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
