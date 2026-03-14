import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { authClient } from "#/lib/auth-client";
import { Button, buttonVariants } from "#/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "#/components/ui/card";
import { toast } from "sonner";
import { WorkspaceList } from "#/components/workspace/workspace-list";
import { m } from "#/paraglide/messages";

export const Route = createFileRoute("/_protected/_onboarded/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const { data: activeOrg } = authClient.useActiveOrganization();

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          toast.success(m.auth_signed_out());
          navigate({ to: "/login" });
        },
      },
    });
  };

  return (
    <main className="mx-auto max-w-2xl p-6">
      <Card>
        <CardHeader>
          <CardTitle>{m.dashboard_title()}</CardTitle>
          <CardDescription>
            {m.dashboard_welcome({ name: user.name })}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">{user.email}</p>
          {activeOrg && (
            <p className="text-sm">
              {m.dashboard_active_org()} <strong>{activeOrg.name}</strong>
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Link className={buttonVariants({ variant: "outline" })} to="/org/members">
              {m.dashboard_manage_org()}
            </Link>
            <Button
              variant="outline"
              onClick={() => navigate({ to: "/settings" })}
            >
              {m.dashboard_settings()}
            </Button>
            {user.role === "admin" && (
              <Link className={buttonVariants({ variant: "outline" })} to="/admin/users">
                {m.dashboard_admin()}
              </Link>
            )}
            <Button variant="ghost" onClick={handleSignOut}>
              {m.auth_sign_out()}
            </Button>
          </div>
        </CardContent>
      </Card>
      {activeOrg && <WorkspaceList />}
    </main>
  );
}
