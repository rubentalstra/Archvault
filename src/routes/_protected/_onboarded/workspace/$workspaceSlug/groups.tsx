import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type { ColumnDef } from "@tanstack/react-table";
import { authClient } from "#/lib/auth-client";
import { getGroups } from "#/lib/group.functions";
import { GroupBadge } from "#/components/groups/group-badge";
import { GroupFormDialog } from "#/components/groups/group-form-dialog";
import { DeleteGroupDialog } from "#/components/groups/delete-group-dialog";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "#/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
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
import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { m } from "#/paraglide/messages";

export const Route = createFileRoute(
  "/_protected/_onboarded/workspace/$workspaceSlug/groups",
)({
  component: GroupsPage,
});

interface GroupData {
  id: string;
  name: string;
  color: string;
  parentGroupId: string | null;
  description: string | null;
  updatedAt: Date;
}

function getGroupColumns({
  onEdit,
  onDelete,
  canEdit,
  canDelete,
  allGroups,
}: {
  onEdit: (group: GroupData) => void;
  onDelete: (group: GroupData) => void;
  canEdit: boolean;
  canDelete: boolean;
  allGroups: GroupData[];
}): ColumnDef<GroupData>[] {
  const columns: ColumnDef<GroupData>[] = [
    {
      accessorKey: "name",
      header: () => m.group_column_name(),
      cell: ({ row }) => (
        <GroupBadge
          name={row.original.name}
          color={row.original.color}
        />
      ),
    },
    {
      accessorKey: "parentGroupId",
      header: () => m.group_column_parent(),
      cell: ({ row }) => {
        const parent = allGroups.find(
          (g) => g.id === row.original.parentGroupId,
        );
        return parent ? (
          <GroupBadge name={parent.name} color={parent.color} />
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        );
      },
    },
    {
      accessorKey: "description",
      header: () => m.group_column_description(),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.description || "—"}
        </span>
      ),
    },
    {
      accessorKey: "updatedAt",
      header: () => m.group_column_updated(),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {new Date(row.original.updatedAt).toLocaleDateString()}
        </span>
      ),
    },
  ];

  if (canEdit || canDelete) {
    columns.push({
      id: "actions",
      header: () => m.common_label_actions(),
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {canEdit && (
              <DropdownMenuItem onClick={() => onEdit(row.original)}>
                <Pencil className="mr-2 size-4" />
                {m.group_edit_title()}
              </DropdownMenuItem>
            )}
            {canDelete && (
              <DropdownMenuItem onClick={() => onDelete(row.original)}>
                <Trash2 className="mr-2 size-4" />
                {m.group_delete_title()}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    });
  }

  return columns;
}

function GroupsPage() {
  const { workspace } = Route.useRouteContext();
  const { data: activeMember } = authClient.useActiveMember();
  const queryClient = useQueryClient();

  const memberRole = activeMember?.role;
  const canEdit = ["owner", "admin", "editor"].includes(memberRole ?? "");
  const canDelete = ["owner", "admin"].includes(memberRole ?? "");

  const getGroupsFn = useServerFn(getGroups);
  const { data: groups = [], isLoading } = useQuery({
    queryKey: ["groups", workspace.id],
    queryFn: () => getGroupsFn({ data: { workspaceId: workspace.id } }),
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editGroup, setEditGroup] = useState<GroupData | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GroupData | null>(null);
  const [globalFilter, setGlobalFilter] = useState("");

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["groups", workspace.id] });
  };

  const openCreate = () => {
    setEditGroup(null);
    setFormOpen(true);
  };

  const openEdit = (g: GroupData) => {
    setEditGroup(g);
    setFormOpen(true);
  };

  const columns = getGroupColumns({
    onEdit: openEdit,
    onDelete: (g) => setDeleteTarget(g),
    canEdit,
    canDelete,
    allGroups: groups as GroupData[],
  });

  const table = useReactTable({
    data: groups as GroupData[],
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (row, _columnId, filterValue: string) => {
      const search = filterValue.toLowerCase();
      return row.original.name.toLowerCase().includes(search);
    },
  });

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
                <BreadcrumbLink
                  render={
                    <Link
                      to="/workspace/$workspaceSlug"
                      params={{ workspaceSlug: workspace.slug }}
                    />
                  }
                >
                  {workspace.name}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>{m.group_manager_title()}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col overflow-auto p-4 pt-0">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">{m.group_manager_title()}</h2>
          {canEdit && (
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              {m.group_create_title()}
            </Button>
          )}
        </div>

        <div className="mb-4 flex items-center gap-2">
          <Input
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder={m.group_placeholder_search()}
            className="max-w-sm"
          />
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">
            {m.common_loading()}
          </p>
        ) : groups.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {m.group_manager_empty()}
          </p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Create / Edit Dialog */}
        <GroupFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          workspaceId={workspace.id}
          group={editGroup ?? undefined}
          allGroups={(groups as GroupData[]).map((g) => ({
            id: g.id,
            name: g.name,
            color: g.color,
            parentGroupId: g.parentGroupId,
          }))}
          onSuccess={invalidate}
        />

        {/* Delete Confirmation */}
        <DeleteGroupDialog
          open={!!deleteTarget}
          onOpenChange={(open) => {
            if (!open) setDeleteTarget(null);
          }}
          group={deleteTarget}
          onSuccess={invalidate}
        />
      </div>
    </>
  );
}
