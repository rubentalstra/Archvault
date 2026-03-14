import {useState, type ReactNode} from "react";
import {useQuery} from "@tanstack/react-query";
import {createFileRoute, Link, useNavigate} from "@tanstack/react-router";
import {useForm} from "@tanstack/react-form";
import {useServerFn} from "@tanstack/react-start";
import {z} from "zod/v4";
import {m} from "#/paraglide/messages";
import {authClient} from "#/lib/auth-client";
import {getEnabledSocialProviders} from "#/lib/auth.functions";
import type {SocialProviderId} from "#/lib/auth.social";
import {Button} from "#/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "#/components/ui/card";
import {Input} from "#/components/ui/input";
import {Label} from "#/components/ui/label";
import {Separator} from "#/components/ui/separator";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "#/components/ui/tabs";
import {Badge} from "#/components/ui/badge";
import {toast} from "sonner";
import {SiGithub, SiGoogle, SiOpenid} from '@icons-pack/react-simple-icons';

const searchSchema = z.object({
    redirect: z.string().optional(),
});

export const Route = createFileRoute("/login")({
    validateSearch: (search) => searchSchema.parse(search),
    component: LoginPage,
});

function LoginPage() {
    const navigate = useNavigate();
    const {redirect: redirectTo} = Route.useSearch();
    const [error, setError] = useState<string | null>(null);
    const [otpSent, setOtpSent] = useState(false);
    const [otpEmail, setOtpEmail] = useState("");
    const getEnabledSocialProvidersFn = useServerFn(getEnabledSocialProviders);
    const {data: enabledSocialProviders = []} = useQuery({
        queryKey: ["auth-social-providers"],
        queryFn: () => getEnabledSocialProvidersFn(),
    });

    const {data: lastMethod} = authClient.useLastLoginMethod();

    const onSuccess = () => {
        if (redirectTo) {
            window.location.href = redirectTo;
        } else {
            void navigate({to: "/dashboard"});
        }
    };

    const passwordForm = useForm({
        defaultValues: {email: "", password: ""},
        onSubmit: async ({value}) => {
            setError(null);
            const {data, error: signInError} = await authClient.signIn.email({
                email: value.email,
                password: value.password,
            });

            if (signInError) {
                setError(signInError.message ?? m.auth_sign_in_failed());
                return;
            }

            if (data && "twoFactorRedirect" in data && data.twoFactorRedirect) {
                void navigate({to: "/two-factor", search: {redirect: redirectTo}});
                return;
            }

            toast.success(m.auth_signed_in());
            onSuccess();
        },
    });

    const otpForm = useForm({
        defaultValues: {email: "", otp: ""},
        onSubmit: async ({value}) => {
            setError(null);

            if (!otpSent) {
                const {error: otpError} =
                    await authClient.emailOtp.sendVerificationOtp({
                        email: value.email,
                        type: "sign-in",
                    });
                if (otpError) {
                    setError(otpError.message ?? m.auth_otp_failed());
                    return;
                }
                setOtpEmail(value.email);
                setOtpSent(true);
                toast.success(m.auth_otp_sent());
                return;
            }

            const {error: verifyError} = await authClient.signIn.emailOtp({
                email: otpEmail,
                otp: value.otp,
            });
            if (verifyError) {
                setError(verifyError.message ?? m.auth_otp_invalid());
                return;
            }

            toast.success(m.auth_signed_in());
            onSuccess();
        },
    });

    const handleSocial = (provider: SocialProviderId) => {
        void authClient.signIn.social({
            provider,
            callbackURL: redirectTo ?? "/dashboard",
        });
    };

    const socialProviderMap: Record<SocialProviderId, { label: string; icon: ReactNode }> = {
        github: {label: m.auth_social_github(), icon: <SiGithub className="size-4"/>},
        google: {label: m.auth_social_google(), icon: <SiGoogle className="size-4"/>},
        microsoft: {label: m.auth_social_microsoft(), icon: <SiOpenid className="size-4"/>},
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
                    <CardTitle className="text-2xl font-bold">{m.auth_sign_in()}</CardTitle>
                    <CardDescription>{m.auth_sign_in_description()}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    {hasSocialProviders && (
                        <>
                            <div className="flex flex-col gap-2">
                                {socialProviders.map(({id, label, icon}) => (
                                    <Button
                                        key={id}
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => handleSocial(id)}
                                    >
                                        {icon}
                                        {m.auth_continue_with({provider: label})}
                                        {lastMethod === id && (
                                            <Badge variant="secondary" className="ml-2">
                                                {m.auth_last_used()}
                                            </Badge>
                                        )}
                                    </Button>
                                ))}
                            </div>

                            <div className="flex items-center gap-3">
                                <Separator className="flex-1"/>
                                <span className="text-xs text-muted-foreground">
                  {m.auth_or_continue_with()}
                </span>
                                <Separator className="flex-1"/>
                            </div>
                        </>
                    )}

                    {error && (
                        <p className="text-sm text-destructive text-center">{error}</p>
                    )}

                    <Tabs defaultValue="password">
                        <TabsList className="w-full">
                            <TabsTrigger value="password">{m.auth_tab_password()}</TabsTrigger>
                            <TabsTrigger value="email-otp">{m.auth_tab_email_otp()}</TabsTrigger>
                        </TabsList>

                        <TabsContent value="password">
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    void passwordForm.handleSubmit();
                                }}
                                className="flex flex-col gap-3 pt-3"
                            >
                                <passwordForm.Field name="email">
                                    {(field) => (
                                        <div className="flex flex-col gap-1.5">
                                            <Label htmlFor="pw-email">{m.common_label_email()}</Label>
                                            <Input
                                                id="pw-email"
                                                type="email"
                                                value={field.state.value}
                                                onChange={(e) => field.handleChange(e.target.value)}
                                                onBlur={field.handleBlur}
                                                placeholder={m.common_placeholder_email()}
                                            />
                                        </div>
                                    )}
                                </passwordForm.Field>

                                <passwordForm.Field name="password">
                                    {(field) => (
                                        <div className="flex flex-col gap-1.5">
                                            <div className="flex items-center justify-between">
                                                <Label htmlFor="pw-password">{m.common_label_password()}</Label>
                                                <Link
                                                    to="/reset-password"
                                                    className="text-xs text-muted-foreground hover:text-primary"
                                                >
                                                    {m.auth_forgot_password()}
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
                                            {isSubmitting ? m.auth_signing_in() : m.auth_sign_in()}
                                        </Button>
                                    )}
                                </passwordForm.Subscribe>
                            </form>
                        </TabsContent>

                        <TabsContent value="email-otp">
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    void otpForm.handleSubmit();
                                }}
                                className="flex flex-col gap-3 pt-3"
                            >
                                {!otpSent ? (
                                    <otpForm.Field name="email">
                                        {(field) => (
                                            <div className="flex flex-col gap-1.5">
                                                <Label htmlFor="otp-email">{m.common_label_email()}</Label>
                                                <Input
                                                    id="otp-email"
                                                    type="email"
                                                    value={field.state.value}
                                                    onChange={(e) => field.handleChange(e.target.value)}
                                                    onBlur={field.handleBlur}
                                                    placeholder={m.common_placeholder_email()}
                                                />
                                            </div>
                                        )}
                                    </otpForm.Field>
                                ) : (
                                    <otpForm.Field name="otp">
                                        {(field) => (
                                            <div className="flex flex-col gap-1.5">
                                                <Label htmlFor="otp-code">
                                                    {m.auth_otp_code_label({email: otpEmail})}
                                                </Label>
                                                <Input
                                                    id="otp-code"
                                                    value={field.state.value}
                                                    onChange={(e) => field.handleChange(e.target.value)}
                                                    onBlur={field.handleBlur}
                                                    placeholder={m.auth_otp_enter()}
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
                                                ? m.auth_otp_please_wait()
                                                : otpSent
                                                    ? m.auth_otp_verify()
                                                    : m.auth_otp_send_code()}
                                        </Button>
                                    )}
                                </otpForm.Subscribe>
                            </form>
                        </TabsContent>
                    </Tabs>

                    <p className="text-center text-sm text-muted-foreground">
                        {m.auth_dont_have_account()}{" "}
                        <Link to="/signup" className="text-primary underline">
                            {m.auth_sign_up()}
                        </Link>
                    </p>
                </CardContent>
            </Card>
        </main>
    );
}
