import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { FolderOpen, Layers, Plus, Users } from "lucide-react";
import { authClient } from "#/lib/auth-client";
import { Button, buttonVariants } from "#/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "#/components/ui/card";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "#/components/ui/breadcrumb";
import { Separator } from "#/components/ui/separator";
import { SidebarTrigger } from "#/components/ui/sidebar";
import { getWorkspaces } from "#/lib/workspace.functions";
import { CreateWorkspaceDialog } from "#/components/workspace/create-workspace-dialog";
import { m } from "#/paraglide/messages";

export const Route = createFileRoute("/_protected/_onboarded/org/")({
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = Route.useRouteContext();
  const { data: activeOrg } = authClient.useActiveOrganization();
  const queryClient = useQueryClient();
  const getWorkspacesFn = useServerFn(getWorkspaces);
  const [createOpen, setCreateOpen] = useState(false);

  const { data: workspaces = [] } = useQuery({
    queryKey: ["workspaces"],
    queryFn: () => getWorkspacesFn(),
  });

  const memberCount = activeOrg?.members?.length ?? 0;
  const teamCount = activeOrg?.teams?.length ?? 0;
  const recentWorkspaces = workspaces.slice(0, 5);

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["workspaces"] });

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>{m.org_nav_dashboard()}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="mx-auto w-full max-w-4xl">
          <div className="mb-6">
            <h2 className="text-2xl font-bold">
              {m.dashboard_welcome({ name: user.name })}
            </h2>
            {activeOrg && (
              <p className="text-muted-foreground">{activeOrg.name}</p>
            )}
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <FolderOpen className="size-8 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{workspaces.length}</p>
                  <p className="text-sm text-muted-foreground">
                    {m.dashboard_stat_workspaces()}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <Users className="size-8 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{memberCount}</p>
                  <p className="text-sm text-muted-foreground">
                    {m.dashboard_stat_members()}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <Layers className="size-8 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{teamCount}</p>
                  <p className="text-sm text-muted-foreground">
                    {m.dashboard_stat_teams()}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{m.dashboard_recent_workspaces()}</CardTitle>
                <CardDescription>
                  {m.dashboard_recent_workspaces_description()}
                </CardDescription>
              </div>
              <Link
                className={buttonVariants({ variant: "outline" })}
                to="/org/workspaces"
              >
                {m.dashboard_view_all()}
              </Link>
            </CardHeader>
            <CardContent>
              {recentWorkspaces.length > 0 ? (
                <ul className="flex flex-col gap-2">
                  {recentWorkspaces.map((ws) => (
                    <li key={ws.id}>
                      <Link
                        to="/workspace/$workspaceSlug"
                        params={{ workspaceSlug: ws.slug }}
                        className="flex items-center gap-3 rounded-md border px-4 py-3 transition-colors hover:bg-accent"
                      >
                        <span className="text-lg">
                          {ws.iconEmoji || (
                            <FolderOpen className="size-5 text-muted-foreground" />
                          )}
                        </span>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {ws.name}
                          </span>
                          {ws.description && (
                            <span className="text-xs text-muted-foreground line-clamp-1">
                              {ws.description}
                            </span>
                          )}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <FolderOpen className="size-10 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {m.dashboard_no_workspaces()}
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setCreateOpen(true)}
                  >
                    <Plus className="mr-1 size-4" />
                    {m.workspace_create_workspace()}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <CreateWorkspaceDialog
            open={createOpen}
            onOpenChange={setCreateOpen}
            onSuccess={refresh}
          />
        </div>
      </div>
    </>
  );
}
