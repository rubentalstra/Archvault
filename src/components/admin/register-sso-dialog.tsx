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
import { Label } from "#/components/ui/label";
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

const registerSSOSchema = z.object({
  providerId: z
    .string()
    .min(2, "Provider ID must be at least 2 characters")
    .regex(/^[a-z0-9-]+$/, "Only lowercase alphanumeric and hyphens"),
  issuer: z.url("Must be a valid URL"),
  domain: z.string().min(3, "Domain is required"),
  type: z.enum(["oidc", "saml"]),
  // OIDC fields
  clientId: z.string().optional(),
  clientSecret: z.string().optional(),
  // SAML fields
  entryPoint: z.string().optional(),
  certificate: z.string().optional(),
  callbackUrl: z.string().optional(),
  // Optional
  organizationId: z.string().optional(),
});

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
  const [error, setError] = useState<string | null>(null);

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
    onSubmit: async ({ value }) => {
      setError(null);
      const parsed = registerSSOSchema.safeParse(value);
      if (!parsed.success) {
        setError(parsed.error.issues[0].message);
        return;
      }

      const { providerId, issuer, domain, type, organizationId } = parsed.data;

      const body: Record<string, unknown> = {
        providerId,
        issuer,
        domain,
      };

      if (organizationId) {
        body.organizationId = organizationId;
      }

      if (type === "oidc") {
        if (!parsed.data.clientId || !parsed.data.clientSecret) {
          setError("Client ID and Client Secret are required for OIDC");
          return;
        }
        body.oidcConfig = {
          clientId: parsed.data.clientId,
          clientSecret: parsed.data.clientSecret,
        };
      } else {
        if (!parsed.data.entryPoint || !parsed.data.certificate) {
          setError("Entry Point and Certificate are required for SAML");
          return;
        }
        body.samlConfig = {
          entryPoint: parsed.data.entryPoint,
          cert: parsed.data.certificate,
          callbackUrl: parsed.data.callbackUrl || undefined,
        };
      }

      const { error: registerError } = await authClient.sso.register(
        body as Parameters<typeof authClient.sso.register>[0],
      );

      if (registerError) {
        setError((registerError as { message?: string }).message ?? "Failed to register SSO provider");
        return;
      }

      toast.success("SSO provider registered successfully");
      onOpenChange(false);
      onSuccess();
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Register SSO Provider</DialogTitle>
          <DialogDescription>
            Register a new OIDC or SAML identity provider for enterprise SSO.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className="flex flex-col gap-4"
        >
          {error && <p className="text-sm text-destructive">{error}</p>}

          <form.Field name="providerId">
            {(field) => (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="sso-provider-id">Provider ID</Label>
                <Input
                  id="sso-provider-id"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="acme-corp"
                />
              </div>
            )}
          </form.Field>

          <form.Field name="issuer">
            {(field) => (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="sso-issuer">Issuer URL</Label>
                <Input
                  id="sso-issuer"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="https://idp.example.com"
                />
              </div>
            )}
          </form.Field>

          <form.Field name="domain">
            {(field) => (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="sso-domain">Domain</Label>
                <Input
                  id="sso-domain"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="example.com"
                />
              </div>
            )}
          </form.Field>

          <form.Field name="type">
            {(field) => (
              <div className="flex flex-col gap-1.5">
                <Label>Type</Label>
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
              </div>
            )}
          </form.Field>

          <form.Subscribe selector={(s) => s.values.type}>
            {(type) =>
              type === "oidc" ? (
                <>
                  <form.Field name="clientId">
                    {(field) => (
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="sso-client-id">Client ID</Label>
                        <Input
                          id="sso-client-id"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                          placeholder="your-client-id"
                        />
                      </div>
                    )}
                  </form.Field>

                  <form.Field name="clientSecret">
                    {(field) => (
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="sso-client-secret">Client Secret</Label>
                        <div className="relative">
                          <Input
                            id="sso-client-secret"
                            type={showSecret ? "text" : "password"}
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            onBlur={field.handleBlur}
                            placeholder="your-client-secret"
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
                        <p className="text-xs text-muted-foreground">
                          Other OIDC endpoints are auto-discovered from the issuer URL.
                        </p>
                      </div>
                    )}
                  </form.Field>
                </>
              ) : (
                <>
                  <form.Field name="entryPoint">
                    {(field) => (
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="sso-entry-point">SSO Entry Point URL</Label>
                        <Input
                          id="sso-entry-point"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                          placeholder="https://idp.example.com/sso"
                        />
                      </div>
                    )}
                  </form.Field>

                  <form.Field name="certificate">
                    {(field) => (
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="sso-certificate">IdP Certificate</Label>
                        <Textarea
                          id="sso-certificate"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                          placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                          rows={4}
                        />
                      </div>
                    )}
                  </form.Field>

                  <form.Field name="callbackUrl">
                    {(field) => (
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="sso-callback-url">Callback URL (optional)</Label>
                        <Input
                          id="sso-callback-url"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                          placeholder="https://yourapp.com/api/auth/sso/saml2/callback/provider-id"
                        />
                      </div>
                    )}
                  </form.Field>
                </>
              )
            }
          </form.Subscribe>

          <form.Field name="organizationId">
            {(field) => (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="sso-org-id">Organization ID (optional)</Label>
                <Input
                  id="sso-org-id"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="Link to an organization"
                />
              </div>
            )}
          </form.Field>

          <DialogFooter>
            <form.Subscribe selector={(s) => s.isSubmitting}>
              {(isSubmitting) => (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Registering..." : "Register Provider"}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
