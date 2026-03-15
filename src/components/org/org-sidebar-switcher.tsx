import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { ChevronsUpDown, Plus } from "lucide-react";
import { authClient } from "#/lib/auth-client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "#/components/ui/sidebar";
import { CreateOrgDialog } from "./create-org-dialog";
import { m } from "#/paraglide/messages";
import { ArchVaultLogo } from "#/components/archvault-logo";

export function OrgSidebarSwitcher() {
  const router = useRouter();
  const { isMobile } = useSidebar();
  const { data: activeOrg } = authClient.useActiveOrganization();
  const { data: orgs } = authClient.useListOrganizations();
  const [createOpen, setCreateOpen] = useState(false);

  const handleSwitch = async (orgId: string) => {
    if (orgId === activeOrg?.id) return;
    await authClient.organization.setActive({ organizationId: orgId });
    router.invalidate();
  };

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <SidebarMenuButton
                  size="lg"
                  className="data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground"
                />
              }
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <span className="text-xs font-bold">
                  {activeOrg?.name?.charAt(0).toUpperCase() ?? "?"}
                </span>
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {activeOrg?.name ?? m.org_switcher_placeholder()}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              align="start"
              side={isMobile ? "bottom" : "right"}
              sideOffset={4}
            >
              <DropdownMenuGroup>
                <DropdownMenuLabel className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ArchVaultLogo className="size-4" />
                  {m.common_app_name()}
                </DropdownMenuLabel>
                {orgs?.map((org) => (
                  <DropdownMenuItem
                    key={org.id}
                    onClick={() => handleSwitch(org.id)}
                    className="gap-2 p-2"
                  >
                    <div className="flex size-6 items-center justify-center rounded-md border">
                      <span className="text-xs font-bold">
                        {org.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    {org.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="gap-2 p-2"
                onClick={() => setCreateOpen(true)}
              >
                <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                  <Plus className="size-4" />
                </div>
                <span className="font-medium text-muted-foreground">
                  {m.org_create_title()}
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <CreateOrgDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={() => router.invalidate()}
      />
    </>
  );
}
