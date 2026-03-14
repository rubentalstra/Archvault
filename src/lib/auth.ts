import { betterAuth, APIError } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import {
  admin,
  organization,
  twoFactor,
  emailOTP,
  haveIBeenPwned,
  lastLoginMethod,
} from "better-auth/plugins";
import { sso } from "@better-auth/sso";
import { scim } from "@better-auth/scim";
import { createElement } from "react";
import { db } from "./database";
import { platformAc, platformRoles, orgAc, orgRoles } from "./permissions";
import { sendEmail } from "./email";
import { OtpEmail, InvitationEmail } from "@archvault/transactional";

export const auth = betterAuth({
  appName: "Archvault",
  baseURL: process.env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, { provider: "pg" }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID!,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
      tenantId: process.env.MICROSOFT_TENANT_ID ?? "common",
    },
  },
  plugins: [
    tanstackStartCookies(),
    admin({ ac: platformAc, roles: platformRoles }),
    organization({
      ac: orgAc,
      roles: orgRoles,
      teams: { enabled: true },
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
      async sendVerificationOTP({ email, otp, type }) {
        await sendEmail({
          to: email,
          subject: `Archvault — Your ${type === "sign-in" ? "sign-in" : type === "email-verification" ? "verification" : "password reset"} code`,
          react: createElement(OtpEmail, { otp, type }),
        });
      },
    }),
    haveIBeenPwned(),
    lastLoginMethod(),
    sso({
      domainVerification: { enabled: true },
      organizationProvisioning: {
        disabled: false,
        defaultRole: "member",
      },
    }),
    scim({
      providerOwnership: { enabled: true },
      beforeSCIMTokenGenerated: async ({ user }) => {
        if (user.role !== "admin") {
          throw new APIError("FORBIDDEN", {
            message: "Only platform admins can generate SCIM tokens",
          });
        }
      },
    }),
  ],
});
