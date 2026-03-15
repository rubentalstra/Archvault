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
import {Field, FieldError, FieldLabel} from "#/components/ui/field";
import {Separator} from "#/components/ui/separator";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "#/components/ui/tabs";
import {Badge} from "#/components/ui/badge";
import {toast} from "sonner";
import {SiGithub, SiGoogle, SiOpenid} from "@icons-pack/react-simple-icons";

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
    const [otpSent, setOtpSent] = useState(false);
    const [otpEmail, setOtpEmail] = useState("");
    const getEnabledSocialProvidersFn = useServerFn(getEnabledSocialProviders);
    const {data: enabledSocialProviders = []} = useQuery({
        queryKey: ["auth-social-providers"],
        queryFn: () => getEnabledSocialProvidersFn(),
    });

    const {data: lastMethod} = authClient.isLastUsedLoginMethod();

    const onSuccess = () => {
        if (redirectTo) {
            window.location.href = redirectTo;
        } else {
            void navigate({to: "/dashboard"});
        }
    };

    const passwordSchema = z.object({
        email: z.email(m.validation_email_invalid()),
        password: z.string().min(1, m.validation_field_required()),
    });

    const otpSchema = z.object({
        email: z.email(m.validation_email_invalid()),
        otp: z.string().min(1, m.validation_otp_required()),
    });

    const passwordForm = useForm({
        defaultValues: {email: "", password: ""},
        validators: {
            onSubmit: passwordSchema,
            onBlur: passwordSchema,
        },
        onSubmit: async ({value}) => {
            const {data, error: signInError} = await authClient.signIn.email({
                email: value.email,
                password: value.password,
            });

            if (signInError) {
                toast.error(signInError.message ?? m.auth_sign_in_failed());
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
        validators: {
            onSubmit: otpSchema,
            onBlur: otpSchema,
        },
        onSubmit: async ({value}) => {
            if (!otpSent) {
                const {error: otpError} =
                    await authClient.emailOtp.sendVerificationOtp({
                        email: value.email,
                        type: "sign-in",
                    });
                if (otpError) {
                    toast.error(otpError.message ?? m.auth_otp_failed());
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
                toast.error(verifyError.message ?? m.auth_otp_invalid());
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
                                    {(field) => {
                                        const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                                        return (
                                            <Field data-invalid={isInvalid}>
                                                <FieldLabel htmlFor="pw-email">{m.common_label_email()}</FieldLabel>
                                                <Input
                                                    id="pw-email"
                                                    type="email"
                                                    value={field.state.value}
                                                    onChange={(e) => field.handleChange(e.target.value)}
                                                    onBlur={field.handleBlur}
                                                    placeholder={m.common_placeholder_email()}
                                                    aria-invalid={isInvalid}
                                                />
                                                {isInvalid && <FieldError errors={field.state.meta.errors}/>}
                                            </Field>
                                        );
                                    }}
                                </passwordForm.Field>

                                <passwordForm.Field name="password">
                                    {(field) => {
                                        const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                                        return (
                                            <Field data-invalid={isInvalid}>
                                                <div className="flex items-center justify-between">
                                                    <FieldLabel
                                                        htmlFor="pw-password">{m.common_label_password()}</FieldLabel>
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
                                                    aria-invalid={isInvalid}
                                                />
                                                {isInvalid && <FieldError errors={field.state.meta.errors}/>}
                                            </Field>
                                        );
                                    }}
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
                                        {(field) => {
                                            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                                            return (
                                                <Field data-invalid={isInvalid}>
                                                    <FieldLabel
                                                        htmlFor="otp-email">{m.common_label_email()}</FieldLabel>
                                                    <Input
                                                        id="otp-email"
                                                        type="email"
                                                        value={field.state.value}
                                                        onChange={(e) => field.handleChange(e.target.value)}
                                                        onBlur={field.handleBlur}
                                                        placeholder={m.common_placeholder_email()}
                                                        aria-invalid={isInvalid}
                                                    />
                                                    {isInvalid && <FieldError errors={field.state.meta.errors}/>}
                                                </Field>
                                            );
                                        }}
                                    </otpForm.Field>
                                ) : (
                                    <otpForm.Field name="otp">
                                        {(field) => {
                                            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                                            return (
                                                <Field data-invalid={isInvalid}>
                                                    <FieldLabel htmlFor="otp-code">
                                                        {m.auth_otp_code_label({email: otpEmail})}
                                                    </FieldLabel>
                                                    <Input
                                                        id="otp-code"
                                                        value={field.state.value}
                                                        onChange={(e) => field.handleChange(e.target.value)}
                                                        onBlur={field.handleBlur}
                                                        placeholder={m.auth_otp_enter()}
                                                        autoFocus
                                                        aria-invalid={isInvalid}
                                                    />
                                                    {isInvalid && <FieldError errors={field.state.meta.errors}/>}
                                                </Field>
                                            );
                                        }}
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
