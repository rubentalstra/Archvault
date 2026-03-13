import { betterAuth } from "better-auth";
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
import { createElement } from "react";
import { db } from "./database";
import { platformAc, platformRoles, orgAc, orgRoles } from "./permissions";
import { sendEmail } from "./email";
import { OtpEmail } from "@archvault/transactional";

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
    organization({ ac: orgAc, roles: orgRoles }),
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
  ],
});
