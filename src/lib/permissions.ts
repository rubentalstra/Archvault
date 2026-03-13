import { createAccessControl } from "better-auth/plugins/access";
import {
  defaultStatements as adminStatements,
  adminAc as adminDefaultAc,
  userAc,
} from "better-auth/plugins/admin/access";
import {
  defaultStatements as orgStatements,
  ownerAc,
  adminAc as orgAdminAc,
  memberAc,
} from "better-auth/plugins/organization/access";

// ─── Platform AC (admin plugin) ────────────────────────────────────────────
// Uses default admin statements. Two roles: admin and user.
export const platformAc = createAccessControl(adminStatements);
export const platformRoles = {
  admin: adminDefaultAc,
  user: userAc,
};

// ─── Organization AC ───────────────────────────────────────────────────────
// Uses default org statements. Four roles: owner, admin, editor, viewer.
// Resource-specific statements (workspace, element, diagram, block) will be
// added in the phases that introduce those resources.
export const orgAc = createAccessControl(orgStatements);
export const orgRoles = {
  owner: ownerAc,
  admin: orgAdminAc,
  editor: memberAc,
  viewer: memberAc,
};
