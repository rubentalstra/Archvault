import { createAuthClient } from "better-auth/react";
import {
  adminClient,
  organizationClient,
  twoFactorClient,
  emailOTPClient,
  lastLoginMethodClient,
} from "better-auth/client/plugins";
import { platformAc, platformRoles, orgAc, orgRoles } from "./permissions";

export const authClient = createAuthClient({
  plugins: [
    adminClient({ ac: platformAc, roles: platformRoles }),
    organizationClient({ ac: orgAc, roles: orgRoles }),
    twoFactorClient(),
    emailOTPClient(),
    lastLoginMethodClient(),
  ],
});
