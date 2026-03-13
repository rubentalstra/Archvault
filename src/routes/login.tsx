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
import { Separator } from "#/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs";
import { Badge } from "#/components/ui/badge";
import { toast } from "sonner";
import { Github } from "lucide-react";

const searchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/login")({
  validateSearch: (search) => searchSchema.parse(search),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { redirect: redirectTo } = Route.useSearch();
  const [error, setError] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otpEmail, setOtpEmail] = useState("");

  const { data: lastMethod } = authClient.useLastLoginMethod();

  const onSuccess = () => {
    if (redirectTo) {
      window.location.href = redirectTo;
    } else {
      navigate({ to: "/_protected/dashboard" });
    }
  };

  const passwordForm = useForm({
    defaultValues: { email: "", password: "" },
    onSubmit: async ({ value }) => {
      setError(null);
      const { data, error: signInError } = await authClient.signIn.email({
        email: value.email,
        password: value.password,
      });

      if (signInError) {
        setError(signInError.message ?? "Sign in failed");
        return;
      }

      if (data && "twoFactorRedirect" in data && data.twoFactorRedirect) {
        navigate({ to: "/two-factor", search: { redirect: redirectTo } });
        return;
      }

      toast.success("Signed in!");
      onSuccess();
    },
  });

  const otpForm = useForm({
    defaultValues: { email: "", otp: "" },
    onSubmit: async ({ value }) => {
      setError(null);

      if (!otpSent) {
        const { error: otpError } =
          await authClient.emailOtp.sendVerificationOtp({
            email: value.email,
            type: "sign-in",
          });
        if (otpError) {
          setError(otpError.message ?? "Failed to send OTP");
          return;
        }
        setOtpEmail(value.email);
        setOtpSent(true);
        toast.success("OTP sent to your email");
        return;
      }

      const { error: verifyError } = await authClient.signIn.emailOtp({
        email: otpEmail,
        otp: value.otp,
      });
      if (verifyError) {
        setError(verifyError.message ?? "Invalid OTP");
        return;
      }

      toast.success("Signed in!");
      onSuccess();
    },
  });

  const handleSocial = (provider: "github" | "google" | "microsoft") => {
    authClient.signIn.social({
      provider,
      callbackURL: redirectTo ?? "/_protected/dashboard",
    });
  };

  const socialProviders = [
    { id: "github" as const, label: "GitHub", icon: <Github className="size-4" /> },
    { id: "google" as const, label: "Google", icon: null },
    { id: "microsoft" as const, label: "Microsoft", icon: null },
  ];

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
          <CardDescription>Sign in to your Archvault account</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            {socialProviders.map(({ id, label, icon }) => (
              <Button
                key={id}
                variant="outline"
                className="w-full"
                onClick={() => handleSocial(id)}
              >
                {icon}
                Continue with {label}
                {lastMethod === id && (
                  <Badge variant="secondary" className="ml-2">
                    Last used
                  </Badge>
                )}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">
              or continue with
            </span>
            <Separator className="flex-1" />
          </div>

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          <Tabs defaultValue="password">
            <TabsList className="w-full">
              <TabsTrigger value="password">Password</TabsTrigger>
              <TabsTrigger value="email-otp">Email OTP</TabsTrigger>
            </TabsList>

            <TabsContent value="password">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  passwordForm.handleSubmit();
                }}
                className="flex flex-col gap-3 pt-3"
              >
                <passwordForm.Field name="email">
                  {(field) => (
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="pw-email">Email</Label>
                      <Input
                        id="pw-email"
                        type="email"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="you@example.com"
                      />
                    </div>
                  )}
                </passwordForm.Field>

                <passwordForm.Field name="password">
                  {(field) => (
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="pw-password">Password</Label>
                        <Link
                          to="/reset-password"
                          className="text-xs text-muted-foreground hover:text-primary"
                        >
                          Forgot password?
                        </Link>
                      </div>
                      <Input
                        id="pw-password"
                        type="password"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                      />
                    </div>
                  )}
                </passwordForm.Field>

                <passwordForm.Subscribe selector={(s) => s.isSubmitting}>
                  {(isSubmitting) => (
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="mt-1"
                    >
                      {isSubmitting ? "Signing in..." : "Sign In"}
                    </Button>
                  )}
                </passwordForm.Subscribe>
              </form>
            </TabsContent>

            <TabsContent value="email-otp">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  otpForm.handleSubmit();
                }}
                className="flex flex-col gap-3 pt-3"
              >
                {!otpSent ? (
                  <otpForm.Field name="email">
                    {(field) => (
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="otp-email">Email</Label>
                        <Input
                          id="otp-email"
                          type="email"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                          placeholder="you@example.com"
                        />
                      </div>
                    )}
                  </otpForm.Field>
                ) : (
                  <otpForm.Field name="otp">
                    {(field) => (
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="otp-code">
                          Enter the code sent to {otpEmail}
                        </Label>
                        <Input
                          id="otp-code"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                          placeholder="Enter OTP"
                          autoFocus
                        />
                      </div>
                    )}
                  </otpForm.Field>
                )}

                <otpForm.Subscribe selector={(s) => s.isSubmitting}>
                  {(isSubmitting) => (
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="mt-1"
                    >
                      {isSubmitting
                        ? "Please wait..."
                        : otpSent
                          ? "Verify OTP"
                          : "Send Code"}
                    </Button>
                  )}
                </otpForm.Subscribe>
              </form>
            </TabsContent>
          </Tabs>

          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link to="/signup" className="text-primary underline">
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
