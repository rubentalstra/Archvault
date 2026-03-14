import { getRequestHeaders } from "@tanstack/react-start/server";
import { auth } from "./auth";

export function assertRole(memberRole: string, allowed: string[]) {
  if (!allowed.includes(memberRole)) throw new Error("Forbidden");
}

export async function getSessionAndOrg() {
  const headers = getRequestHeaders();
  const session = await auth.api.getSession({ headers });
  if (!session) throw new Error("Unauthorized");

  const org = await auth.api.getFullOrganization({ headers });
  if (!org) throw new Error("No active organization");

  const currentMember = org.members.find(
    (m) => m.userId === session.user.id,
  );
  if (!currentMember) throw new Error("Not a member of this organization");

  return { session, org, memberRole: currentMember.role };
}
