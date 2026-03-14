import {betterAuth, APIError} from "better-auth";
import {drizzleAdapter} from "better-auth/adapters/drizzle";
import {tanstackStartCookies} from "better-auth/tanstack-start";
import {
    admin,
    organization,
    twoFactor,
    emailOTP,
    haveIBeenPwned,
    lastLoginMethod,
} from "better-auth/plugins";
import {sso} from "@better-auth/sso";
import {scim} from "@better-auth/scim";
import {createElement} from "react";
import {db} from "./database";
import * as schema from "./schema";
import {platformAc, platformRoles, orgAc, orgRoles} from "./permissions";
import {sendEmail} from "./email";
import {OtpEmail, InvitationEmail} from "@archvault/transactional";
import {socialProvidersConfig} from "./auth.providers";

const hasSocialProviders = Object.keys(socialProvidersConfig).length > 0;

export const auth = betterAuth({
    appName: "Archvault",
    baseURL: process.env.BETTER_AUTH_URL,
    database: drizzleAdapter(db, {provider: "pg", schema}),
    // Drizzle v1 relational filters currently conflict with Better Auth join mode.
    experimental: {joins: false},
    emailAndPassword: {
        enabled: true,
    },
    ...(hasSocialProviders ? {socialProviders: socialProvidersConfig} : {}),
    plugins: [
        tanstackStartCookies(),
        admin({ac: platformAc, roles: platformRoles}),
        organization({
            ac: orgAc,
            roles: orgRoles,
            teams: {enabled: true},
            async sendInvitationEmail(data) {
                const inviteUrl = `${process.env.BETTER_AUTH_URL}/accept-invitation/${data.id}`;
                await sendEmail({
                    to: data.email,
                    subject: `Archvault — You've been invited to ${data.organization.name}`,
                    react: createElement(InvitationEmail, {
                        organizationName: data.organization.name,
                        inviterName: data.inviter.user.name,
                        role: data.role,
                        inviteUrl,
                    }),
                });
            },
        }),
        twoFactor(),
        emailOTP({
            async sendVerificationOTP({email, otp, type}) {
                await sendEmail({
                    to: email,
                    subject: `Archvault — Your ${type === "sign-in" ? "sign-in" : type === "email-verification" ? "verification" : "password reset"} code`,
                    react: createElement(OtpEmail, {otp, type}),
                });
            },
        }),
        haveIBeenPwned(),
        lastLoginMethod(),
        sso({
            domainVerification: {enabled: true},
            organizationProvisioning: {
                disabled: false,
                defaultRole: "member",
            },
        }),
        scim({
            providerOwnership: {enabled: true},
            beforeSCIMTokenGenerated: ({user}) => {
                if (user.role !== "admin") {
                    throw new APIError("FORBIDDEN", {
                        message: "Only platform admins can generate SCIM tokens",
                    });
                }
            },
        }),
    ],
});
