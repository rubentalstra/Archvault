import { Link, Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { Users, ArrowLeft, KeyRound, RefreshCw } from "lucide-react";
import { cn } from "#/lib/utils";
import { adminUsersDefaultSearch } from "./admin/users";

export const Route = createFileRoute("/_protected/admin")({
  beforeLoad: ({ context }) => {
    if (context.user.role !== "admin") {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <div className="flex min-h-screen">
      <aside className="flex w-56 shrink-0 flex-col border-r bg-muted/30 p-4">
        <Link
          to="/dashboard"
          className="mb-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to Dashboard
        </Link>

        <nav className="flex flex-col gap-1">
          <Link
            to="/admin/users"
            search={adminUsersDefaultSearch}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
            )}
            activeProps={{
              className: "bg-accent text-accent-foreground",
            }}
          >
            <Users className="size-4" />
            Users
          </Link>
          <Link
            to="/admin/sso"
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
            )}
            activeProps={{
              className: "bg-accent text-accent-foreground",
            }}
          >
            <KeyRound className="size-4" />
            SSO Providers
          </Link>
          <Link
            to="/admin/scim"
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
            )}
            activeProps={{
              className: "bg-accent text-accent-foreground",
            }}
          >
            <RefreshCw className="size-4" />
            SCIM
          </Link>
        </nav>
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
