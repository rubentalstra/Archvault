import { useState } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { Button } from "#/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "#/components/ui/card";
import { Users, Trash2 } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "#/components/ui/breadcrumb";
import { Separator } from "#/components/ui/separator";
import { SidebarTrigger } from "#/components/ui/sidebar";
import { CreateTeamDialog } from "#/components/org/create-team-dialog";
import { TeamMembersDialog } from "#/components/org/team-members-dialog";
import { RemoveTeamDialog } from "#/components/org/remove-team-dialog";
import type { OrgMember } from "#/components/org/member-table-columns";
import { m } from "#/paraglide/messages";

interface Team {
  id: string;
  name: string;
  createdAt: string;
  members?: { userId: string }[];
}

export const Route = createFileRoute("/_protected/_onboarded/org/teams")({
  component: TeamsPage,
});

function TeamsPage() {
  const { activeOrg } = Route.useRouteContext();
  const router = useRouter();

  const [createOpen, setCreateOpen] = useState(false);
  const [membersTeam, setMembersTeam] = useState<Team | null>(null);
  const [removeTeam, setRemoveTeam] = useState<Team | null>(null);

  const teams = (activeOrg?.teams ?? []) as Team[];
  const orgMembers = (activeOrg?.members ?? []) as OrgMember[];
  const refresh = () => router.invalidate();

  if (!activeOrg) return null;

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
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink render={<Link to="/org" />}>
                  {m.org_nav_dashboard()}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>{m.org_teams_title()}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="mx-auto w-full max-w-4xl">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold">{m.org_teams_title()}</h2>
            <Button onClick={() => setCreateOpen(true)}>
              {m.org_create_team_title()}
            </Button>
          </div>

          {teams.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {teams.map((team) => (
                <Card key={team.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{team.name}</CardTitle>
                    <CardDescription>
                      {m.org_members_count({
                        count: team.members?.length ?? 0,
                      })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMembersTeam(team)}
                    >
                      <Users className="size-4" />
                      {m.org_members_title()}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setRemoveTeam(team)}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                {m.org_teams_empty()}
              </CardContent>
            </Card>
          )}

          <CreateTeamDialog
            organizationId={activeOrg.id}
            open={createOpen}
            onOpenChange={setCreateOpen}
            onSuccess={refresh}
          />
          <TeamMembersDialog
            team={membersTeam}
            orgMembers={orgMembers}
            open={membersTeam !== null}
            onOpenChange={(open) => {
              if (!open) setMembersTeam(null);
            }}
            onSuccess={refresh}
          />
          <RemoveTeamDialog
            team={removeTeam}
            organizationId={activeOrg.id}
            open={removeTeam !== null}
            onOpenChange={(open) => {
              if (!open) setRemoveTeam(null);
            }}
            onSuccess={refresh}
          />
        </div>
      </div>
    </>
  );
}
