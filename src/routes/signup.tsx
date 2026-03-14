import { useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod/v4";
import { m } from "#/paraglide/messages";
import { authClient } from "#/lib/auth-client";
import { getEnabledSocialProviders } from "#/lib/auth.functions";
import type { SocialProviderId } from "#/lib/auth.social";
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
import { Separator } from "#/components/ui/separator";
import { toast } from "sonner";
import { Github } from "lucide-react";

const signupSchema = z
  .object({
    name: z.string().min(1, m.validation_name_required()),
    email: z.email(m.validation_email_invalid()),
    password: z.string().min(8, m.validation_password_min_length()),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: m.validation_passwords_dont_match(),
    path: ["confirmPassword"],
  });

export const Route = createFileRoute("/signup")({
  component: SignUpPage,
});

function SignUpPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const getEnabledSocialProvidersFn = useServerFn(getEnabledSocialProviders);
  const { data: enabledSocialProviders = [] } = useQuery({
    queryKey: ["auth-social-providers"],
    queryFn: () => getEnabledSocialProvidersFn(),
  });

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    onSubmit: async ({ value }) => {
      setError(null);
      const parsed = signupSchema.safeParse(value);
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? "Validation failed");
        return;
      }

      const { error: signUpError } = await authClient.signUp.email({
        name: value.name,
        email: value.email,
        password: value.password,
      });

      if (signUpError) {
        if (signUpError.message?.includes("compromised")) {
          setError(m.auth_password_compromised());
        } else {
          setError(signUpError.message ?? m.auth_sign_up_failed());
        }
        return;
      }

      toast.success(m.auth_account_created());
      void navigate({ to: "/dashboard" });
    },
  });

  const handleSocial = (provider: SocialProviderId) => {
    void authClient.signIn.social({
      provider,
      callbackURL: "/dashboard",
    });
  };

  const socialProviderMap: Record<SocialProviderId, { label: string; icon: ReactNode }> = {
    github: { label: m.auth_social_github(), icon: <Github className="size-4" /> },
    google: { label: m.auth_social_google(), icon: null },
    microsoft: { label: m.auth_social_microsoft(), icon: null },
  };

  const socialProviders = enabledSocialProviders.map((id) => ({
    id,
    ...socialProviderMap[id],
  }));

  const hasSocialProviders = socialProviders.length > 0;

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">{m.auth_sign_up_title()}</CardTitle>
          <CardDescription>
            {m.auth_sign_up_description()}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {hasSocialProviders && (
            <>
              <div className="flex flex-col gap-2">
                {socialProviders.map(({ id, label, icon }) => (
                  <Button
                    key={id}
                    variant="outline"
                    className="w-full"
                    onClick={() => handleSocial(id)}
                  >
                    {icon}
                    {m.auth_continue_with({ provider: label })}
                  </Button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <Separator className="flex-1" />
                <span className="text-xs text-muted-foreground">
                  {m.auth_or_continue_with_email()}
                </span>
                <Separator className="flex-1" />
              </div>
            </>
          )}

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void form.handleSubmit();
            }}
            className="flex flex-col gap-3"
          >
            <form.Field name="name">
              {(field) => (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="name">{m.common_label_name()}</Label>
                  <Input
                    id="name"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder={m.auth_placeholder_name()}
                  />
                </div>
              )}
            </form.Field>

            <form.Field name="email">
              {(field) => (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="email">{m.common_label_email()}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder={m.common_placeholder_email()}
                  />
                </div>
              )}
            </form.Field>

            <form.Field name="password">
              {(field) => (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="password">{m.common_label_password()}</Label>
                  <Input
                    id="password"
                    type="password"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder={m.auth_placeholder_password_min()}
                  />
                </div>
              )}
            </form.Field>

            <form.Field name="confirmPassword">
              {(field) => (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="confirmPassword">{m.auth_label_confirm_password()}</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder={m.auth_placeholder_confirm_password()}
                  />
                </div>
              )}
            </form.Field>

            <form.Subscribe selector={(s) => s.isSubmitting}>
              {(isSubmitting) => (
                <Button type="submit" disabled={isSubmitting} className="mt-1">
                  {isSubmitting ? m.auth_creating_account() : m.auth_sign_up_title()}
                </Button>
              )}
            </form.Subscribe>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {m.auth_already_have_account()}{" "}
            <Link to="/login" className="text-primary underline">
              {m.auth_sign_in()}
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
