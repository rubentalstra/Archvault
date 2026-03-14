import { Link, Outlet, createFileRoute } from "@tanstack/react-router";
import { LayoutDashboard, Settings, ArrowLeft, Boxes } from "lucide-react";
import { cn } from "#/lib/utils";
import { getWorkspaceBySlug } from "#/lib/workspace.functions";
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
  const { workspace } = Route.useRouteContext();

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-56 shrink-0 flex-col border-r bg-muted/30 p-4">
        <Link
          to="/dashboard"
          className="mb-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {m.workspace_back_to_dashboard()}
        </Link>

        <div className="mb-4 flex items-center gap-2">
          {workspace.iconEmoji && (
            <span className="text-lg">{workspace.iconEmoji}</span>
          )}
          <span className="text-sm font-semibold truncate">
            {workspace.name}
          </span>
        </div>

        <nav className="flex flex-col gap-1">
          <Link
            to="/workspace/$workspaceSlug"
            params={{ workspaceSlug: workspace.slug }}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
            )}
            activeOptions={{ exact: true }}
            activeProps={{
              className: "bg-accent text-accent-foreground",
            }}
          >
            <LayoutDashboard className="size-4" />
            {m.workspace_nav_dashboard()}
          </Link>
          <Link
            to="/workspace/$workspaceSlug/elements"
            params={{ workspaceSlug: workspace.slug }}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
            )}
            activeProps={{
              className: "bg-accent text-accent-foreground",
            }}
          >
            <Boxes className="size-4" />
            {m.element_nav_title()}
          </Link>
          <Link
            to="/workspace/$workspaceSlug/settings"
            params={{ workspaceSlug: workspace.slug }}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
            )}
            activeProps={{
              className: "bg-accent text-accent-foreground",
            }}
          >
            <Settings className="size-4" />
            {m.workspace_nav_settings()}
          </Link>
        </nav>
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
