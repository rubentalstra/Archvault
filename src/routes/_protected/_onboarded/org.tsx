import { Link, Outlet, createFileRoute } from "@tanstack/react-router";
import {
  Users,
  Settings,
  Layers,
  FolderOpen,
  LayoutDashboard,
} from "lucide-react";
import { OrgSidebarSwitcher } from "#/components/org/org-sidebar-switcher";
import { NavUser } from "#/components/org/nav-user";
import { getActiveOrganization } from "#/lib/org.functions";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
} from "#/components/ui/sidebar";
import { m } from "#/paraglide/messages";

export const Route = createFileRoute("/_protected/_onboarded/org")({
  beforeLoad: async () => {
    const activeOrg = await getActiveOrganization();
    return { activeOrg };
  },
  component: OrgLayout,
});

const NAV_ITEMS = [
  { to: "/org", icon: LayoutDashboard, label: () => m.org_nav_dashboard(), exact: true },
  { to: "/org/workspaces", icon: FolderOpen, label: () => m.org_nav_workspaces() },
  { to: "/org/members", icon: Users, label: () => m.org_nav_members() },
  { to: "/org/teams", icon: Layers, label: () => m.org_nav_teams() },
  { to: "/org/settings", icon: Settings, label: () => m.org_nav_settings() },
] as const;

function OrgLayout() {
  const { user } = Route.useRouteContext();

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <OrgSidebarSwitcher />
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>{m.common_app_name()}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {NAV_ITEMS.map((item) => (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton
                      tooltip={item.label()}
                      render={
                        <Link
                          to={item.to}
                          activeOptions={
                            item.exact ? { exact: true } : undefined
                          }
                        />
                      }
                    >
                      <item.icon />
                      <span>{item.label()}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <NavUser user={user} />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
