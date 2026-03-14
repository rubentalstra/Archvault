import { useState, useCallback } from "react";
import {
  createFileRoute,
  Link,
  useNavigate,
} from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { authClient } from "#/lib/auth-client";
import { Button } from "#/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "#/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "#/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { Badge } from "#/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "#/components/ui/tooltip";
import {
  ArrowLeft,
  UserCog,
  Ban,
  UserCheck,
  LogOut,
  UserX,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import { formatRelativeDate } from "#/lib/admin.utils";
import { adminUsersDefaultSearch } from "./users";
import { BanUserDialog } from "#/components/admin/ban-user-dialog";
import { RoleChangeDialog } from "#/components/admin/role-change-dialog";
import { RemoveUserDialog } from "#/components/admin/remove-user-dialog";
import { RevokeSessionsDialog } from "#/components/admin/revoke-sessions-dialog";
import type { AdminUser } from "#/components/admin/user-table-columns";

export const Route = createFileRoute("/_protected/admin/user/$userId")({
  component: UserDetailPage,
});

interface UserSession {
  id: string;
  userId: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  expiresAt: string;
}

function UserDetailPage() {
  const { userId } = Route.useParams();
  const { user: currentUser } = Route.useRouteContext();
  const navigate = useNavigate();

  const queryClient = useQueryClient();

  // Dialog state
  const [banOpen, setBanOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [revokeOpen, setRevokeOpen] = useState(false);

  const isSelf = userId === currentUser.id;

  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ["admin", "user", userId],
    queryFn: async () => {
      const { data, error } = await authClient.admin.listUsers({
        query: {
          limit: 1000,
          offset: 0,
        },
      } as Parameters<typeof authClient.admin.listUsers>[0]);

      if (error) throw new Error("Failed to load user");

      const found = (data?.users as unknown as AdminUser[])?.find(
        (u) => u.id === userId,
      );
      if (!found) throw new Error("User not found");
      return found;
    },
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ["admin", "user", userId, "sessions"],
    queryFn: async () => {
      const { data: sessionData } = await authClient.admin.listUserSessions({
        userId,
      });
      return (sessionData?.sessions ?? []) as unknown as UserSession[];
    },
    enabled: !!userData,
  });

  const refetchUser = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ["admin", "user", userId] }),
    [queryClient, userId],
  );

  const user = userData ?? null;

  if (userLoading || !user) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const initials = (user.name ?? user.email)
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleImpersonate = async () => {
    const { error } = await authClient.admin.impersonateUser({
      userId: user.id,
    });
    if (error) {
      toast.error(error.message ?? "Failed to impersonate");
      return;
    }
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <Link
        to="/admin/users"
        search={adminUsersDefaultSearch}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground w-fit"
      >
        <ArrowLeft className="size-4" />
        Back to Users
      </Link>

      {/* Header Card */}
      <Card>
        <CardContent className="flex items-start gap-6 pt-6">
          <Avatar size="lg">
            {user.image && <AvatarImage src={user.image} alt={user.name} />}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>

          <div className="flex flex-1 flex-col gap-2">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold">{user.name}</h2>
              <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                {user.role}
              </Badge>
              <Badge variant={user.banned ? "destructive" : "secondary"}>
                {user.banned ? "Banned" : "Active"}
              </Badge>
              <Tooltip>
                <TooltipTrigger>
                  <Shield
                    className={`size-4 ${user.twoFactorEnabled ? "text-green-600" : "text-muted-foreground/40"}`}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  {user.twoFactorEnabled
                    ? "2FA enabled"
                    : "2FA not enabled"}
                </TooltipContent>
              </Tooltip>
            </div>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            {user.banned && user.banReason && (
              <p className="text-sm text-destructive">
                Ban reason: {user.banReason}
              </p>
            )}
            {user.banned && user.banExpires && (
              <p className="text-xs text-muted-foreground">
                Ban expires: {new Date(user.banExpires).toLocaleString()}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Created {formatRelativeDate(user.createdAt)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="outline"
                onClick={() => setRoleOpen(true)}
                disabled={isSelf}
              />
            }
          >
            <UserCog className="size-4" />
            Change Role
          </TooltipTrigger>
          {isSelf && (
            <TooltipContent>Cannot change your own role</TooltipContent>
          )}
        </Tooltip>

        {user.banned ? (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="outline"
                  onClick={async () => {
                    const { error } = await authClient.admin.unbanUser({
                      userId: user.id,
                    });
                    if (error) {
                      toast.error(error.message ?? "Failed to unban");
                      return;
                    }
                    toast.success(`${user.name} unbanned`);
                    refetchUser();
                  }}
                  disabled={isSelf}
                />
              }
            >
              <UserCheck className="size-4" />
              Unban
            </TooltipTrigger>
            {isSelf && (
              <TooltipContent>Cannot unban yourself</TooltipContent>
            )}
          </Tooltip>
        ) : (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="outline"
                  onClick={() => setBanOpen(true)}
                  disabled={isSelf}
                />
              }
            >
              <Ban className="size-4" />
              Ban
            </TooltipTrigger>
            {isSelf && (
              <TooltipContent>Cannot ban yourself</TooltipContent>
            )}
          </Tooltip>
        )}

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="outline"
                onClick={handleImpersonate}
                disabled={isSelf}
              />
            }
          >
            <UserCog className="size-4" />
            Impersonate
          </TooltipTrigger>
          {isSelf && (
            <TooltipContent>Cannot impersonate yourself</TooltipContent>
          )}
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="outline"
                onClick={() => setRevokeOpen(true)}
                disabled={isSelf}
              />
            }
          >
            <LogOut className="size-4" />
            Revoke Sessions
          </TooltipTrigger>
          {isSelf && (
            <TooltipContent>Cannot revoke your own sessions</TooltipContent>
          )}
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="destructive"
                onClick={() => setRemoveOpen(true)}
                disabled={isSelf}
              />
            }
          >
            <UserX className="size-4" />
            Remove
          </TooltipTrigger>
          {isSelf && (
            <TooltipContent>Cannot remove yourself</TooltipContent>
          )}
        </Tooltip>
      </div>

      {/* Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active sessions.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>IP Address</TableHead>
                  <TableHead>User Agent</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Expires</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell>{session.ipAddress ?? "—"}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {session.userAgent ?? "—"}
                    </TableCell>
                    <TableCell>
                      {formatRelativeDate(session.createdAt)}
                    </TableCell>
                    <TableCell>
                      {new Date(session.expiresAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <BanUserDialog
        user={user}
        open={banOpen}
        onOpenChange={setBanOpen}
        onSuccess={refetchUser}
      />
      <RoleChangeDialog
        user={user}
        open={roleOpen}
        onOpenChange={setRoleOpen}
        onSuccess={refetchUser}
      />
      <RemoveUserDialog
        user={user}
        open={removeOpen}
        onOpenChange={(open) => {
          setRemoveOpen(open);
        }}
        onSuccess={() => navigate({ to: "/admin/users", search: adminUsersDefaultSearch })}
      />
      <RevokeSessionsDialog
        user={user}
        open={revokeOpen}
        onOpenChange={setRevokeOpen}
        onSuccess={refetchUser}
      />
    </div>
  );
}
