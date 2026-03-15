import {type ReactNode} from "react";
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
import {toast} from "sonner";
import {SiGithub, SiGoogle, SiOpenid} from "@icons-pack/react-simple-icons";
import {ArchVaultLogo} from "#/components/archvault-logo";


export const Route = createFileRoute("/signup")({
    component: SignUpPage,
});

function SignUpPage() {
    const navigate = useNavigate();
    const getEnabledSocialProvidersFn = useServerFn(getEnabledSocialProviders);
    const {data: enabledSocialProviders = []} = useQuery({
        queryKey: ["auth-social-providers"],
        queryFn: () => getEnabledSocialProvidersFn(),
    });

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

    const form = useForm({
        defaultValues: {
            name: "",
            email: "",
            password: "",
            confirmPassword: "",
        },
        validators: {
            onSubmit: signupSchema,
            onBlur: signupSchema,
        },
        onSubmit: async ({value}) => {
            const {error: signUpError} = await authClient.signUp.email({
                name: value.name,
                email: value.email,
                password: value.password,
            });

            if (signUpError) {
                if (signUpError.message?.includes("compromised")) {
                    toast.error(m.auth_password_compromised());
                } else {
                    toast.error(signUpError.message ?? m.auth_sign_up_failed());
                }
                return;
            }

            toast.success(m.auth_account_created());
            void navigate({to: "/dashboard"});
        },
    });

    const handleSocial = (provider: SocialProviderId) => {
        void authClient.signIn.social({
            provider,
            callbackURL: "/dashboard",
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
                    <div className="flex justify-center">
                        <ArchVaultLogo className="size-10" />
                    </div>
                    <CardTitle className="text-2xl font-bold">{m.auth_sign_up_title()}</CardTitle>
                    <CardDescription>
                        {m.auth_sign_up_description()}
                    </CardDescription>
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
                                    </Button>
                                ))}
                            </div>

                            <div className="flex items-center gap-3">
                                <Separator className="flex-1"/>
                                <span className="text-xs text-muted-foreground">
                  {m.auth_or_continue_with_email()}
                </span>
                                <Separator className="flex-1"/>
                            </div>
                        </>
                    )}

                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            void form.handleSubmit();
                        }}
                        className="flex flex-col gap-3"
                    >
                        <form.Field name="name">
                            {(field) => {
                                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                                return (
                                    <Field data-invalid={isInvalid}>
                                        <FieldLabel htmlFor="name">{m.common_label_name()}</FieldLabel>
                                        <Input
                                            id="name"
                                            value={field.state.value}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            onBlur={field.handleBlur}
                                            placeholder={m.auth_placeholder_name()}
                                            aria-invalid={isInvalid}
                                        />
                                        {isInvalid && <FieldError errors={field.state.meta.errors}/>}
                                    </Field>
                                );
                            }}
                        </form.Field>

                        <form.Field name="email">
                            {(field) => {
                                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                                return (
                                    <Field data-invalid={isInvalid}>
                                        <FieldLabel htmlFor="email">{m.common_label_email()}</FieldLabel>
                                        <Input
                                            id="email"
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
                        </form.Field>

                        <form.Field name="password">
                            {(field) => {
                                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                                return (
                                    <Field data-invalid={isInvalid}>
                                        <FieldLabel htmlFor="password">{m.common_label_password()}</FieldLabel>
                                        <Input
                                            id="password"
                                            type="password"
                                            value={field.state.value}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            onBlur={field.handleBlur}
                                            placeholder={m.auth_placeholder_password_min()}
                                            aria-invalid={isInvalid}
                                        />
                                        {isInvalid && <FieldError errors={field.state.meta.errors}/>}
                                    </Field>
                                );
                            }}
                        </form.Field>

                        <form.Field name="confirmPassword">
                            {(field) => {
                                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                                return (
                                    <Field data-invalid={isInvalid}>
                                        <FieldLabel
                                            htmlFor="confirmPassword">{m.auth_label_confirm_password()}</FieldLabel>
                                        <Input
                                            id="confirmPassword"
                                            type="password"
                                            value={field.state.value}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            onBlur={field.handleBlur}
                                            placeholder={m.auth_placeholder_confirm_password()}
                                            aria-invalid={isInvalid}
                                        />
                                        {isInvalid && <FieldError errors={field.state.meta.errors}/>}
                                    </Field>
                                );
                            }}
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
