import { createAuthClient } from "better-auth/react";
import {
  adminClient,
  organizationClient,
  twoFactorClient,
  emailOTPClient,
  lastLoginMethodClient,
} from "better-auth/client/plugins";
import { ssoClient } from "@better-auth/sso/client";
import { scimClient } from "@better-auth/scim/client";
import { platformAc, platformRoles, orgAc, orgRoles } from "./permissions";

export const authClient = createAuthClient({
  plugins: [
    adminClient({ ac: platformAc, roles: platformRoles }),
    organizationClient({ ac: orgAc, roles: orgRoles, teams: { enabled: true } }),
    twoFactorClient(),
    emailOTPClient(),
    lastLoginMethodClient(),
    ssoClient({ domainVerification: { enabled: true } }),
    scimClient(),
  ],
});
