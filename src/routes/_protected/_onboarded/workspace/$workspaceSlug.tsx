import { Link, Outlet, createFileRoute } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Settings,
  Boxes,
  ArrowLeftRight,
  PanelsTopLeft,
  Tags,
  Layers,
  ArrowLeft,
  FolderOpen,
} from "lucide-react";
import { NavUser } from "#/components/org/nav-user";
import { getWorkspaceBySlug } from "#/lib/workspace.functions";
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

export const Route = createFileRoute(
  "/_protected/_onboarded/workspace/$workspaceSlug",
)({
  beforeLoad: async ({ params }) => {
    const workspace = await getWorkspaceBySlug({
      data: { slug: params.workspaceSlug },
    });
    return { workspace };
  },
  component: WorkspaceLayout,
});

function WorkspaceLayout() {
  const { workspace, user } = Route.useRouteContext();

  const navItems = [
    { to: "/workspace/$workspaceSlug", icon: LayoutDashboard, label: () => m.workspace_nav_dashboard(), exact: true },
    { to: "/workspace/$workspaceSlug/diagrams", icon: PanelsTopLeft, label: () => m.diagram_nav_title() },
    { to: "/workspace/$workspaceSlug/elements", icon: Boxes, label: () => m.element_nav_title() },
    { to: "/workspace/$workspaceSlug/connections", icon: ArrowLeftRight, label: () => m.connection_nav_title() },
    { to: "/workspace/$workspaceSlug/tags", icon: Tags, label: () => m.tag_manager_title() },
    { to: "/workspace/$workspaceSlug/groups", icon: Layers, label: () => m.group_nav_title() },
    { to: "/workspace/$workspaceSlug/settings", icon: Settings, label: () => m.workspace_nav_settings() },
  ] as const;

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                tooltip={m.workspace_back_to_dashboard()}
                render={<Link to="/org" />}
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  {workspace.iconEmoji ? (
                    <span className="text-sm">{workspace.iconEmoji}</span>
                  ) : (
                    <FolderOpen className="size-4" />
                  )}
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    {workspace.name}
                  </span>
                  <span className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                    <ArrowLeft className="size-3" />
                    {m.workspace_back_to_dashboard()}
                  </span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>{workspace.name}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton
                      tooltip={item.label()}
                      render={
                        <Link
                          to={item.to}
                          params={{ workspaceSlug: workspace.slug }}
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
