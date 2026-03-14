import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { authClient } from "#/lib/auth-client";
import { getTechnologies } from "#/lib/technology.functions";
import { TechnologyFormDialog } from "#/components/technologies/technology-form-dialog";
import { DeleteTechnologyDialog } from "#/components/technologies/delete-technology-dialog";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Badge } from "#/components/ui/badge";
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
import { ArrowDown, ArrowUp, ArrowUpDown, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { TechIcon } from "#/components/technologies/tech-icon";
import { m } from "#/paraglide/messages";

export const Route = createFileRoute(
  "/_protected/_onboarded/workspace/$workspaceSlug/technologies",
)({
  component: TechnologiesPage,
});

interface TechData {
  id: string;
  name: string;
  description: string | null;
  website: string | null;
  iconSlug: string | null;
  docsUrl: string | null;
  updatesUrl: string | null;
  assignedCount: number;
  updatedAt: Date;
}

function getTechColumns({
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}: {
  onEdit: (tech: TechData) => void;
  onDelete: (tech: TechData) => void;
  canEdit: boolean;
  canDelete: boolean;
}): ColumnDef<TechData>[] {
  const columns: ColumnDef<TechData>[] = [
    {
      accessorKey: "name",
      header: m.technology_label_name,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.iconSlug && (
            <TechIcon slug={row.original.iconSlug} className="size-5 shrink-0" />
          )}
          <span className="font-medium">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: "description",
      header: () => m.technology_label_description(),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.description ?? "-"}
        </span>
      ),
    },
    {
      accessorKey: "website",
      header: () => m.technology_label_website(),
      cell: ({ row }) =>
        row.original.website ? (
          <a
            href={row.original.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 underline"
          >
            {new URL(row.original.website).hostname}
          </a>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        ),
    },
    {
      accessorKey: "assignedCount",
      header: m.technology_column_assigned,
      cell: ({ row }) => (
        <Badge variant="secondary">{row.original.assignedCount}</Badge>
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
                {m.technology_edit_title()}
              </DropdownMenuItem>
            )}
            {canDelete && (
              <DropdownMenuItem onClick={() => onDelete(row.original)}>
                <Trash2 className="mr-2 size-4" />
                {m.technology_delete_title()}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    });
  }

  return columns;
}

function TechnologiesPage() {
  const { workspace } = Route.useRouteContext();
  const { data: activeMember } = authClient.useActiveMember();
  const queryClient = useQueryClient();

  const memberRole = activeMember?.role;
  const canEdit = ["owner", "admin", "editor"].includes(memberRole ?? "");
  const canDelete = ["owner", "admin"].includes(memberRole ?? "");

  const getTechnologiesFn = useServerFn(getTechnologies);
  const { data: technologies = [], isLoading } = useQuery({
    queryKey: ["technologies", workspace.id],
    queryFn: () => getTechnologiesFn({ data: { workspaceId: workspace.id } }),
  });

  const [sorting, setSorting] = useState<SortingState>([
    { id: "name", desc: false },
  ]);
  const [formOpen, setFormOpen] = useState(false);
  const [editTech, setEditTech] = useState<TechData | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TechData | null>(null);
  const [globalFilter, setGlobalFilter] = useState("");

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["technologies", workspace.id] });
  };

  const openCreate = () => {
    setEditTech(null);
    setFormOpen(true);
  };

  const openEdit = (tech: TechData) => {
    setEditTech(tech);
    setFormOpen(true);
  };

  const columns = getTechColumns({
    onEdit: openEdit,
    onDelete: (tech) => setDeleteTarget(tech),
    canEdit,
    canDelete,
  });

  const table = useReactTable({
    data: technologies as TechData[],
    columns,
    state: { globalFilter, sorting },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
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
                <BreadcrumbPage>{m.technology_manager_title()}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col overflow-auto p-4 pt-0">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">{m.technology_manager_title()}</h2>
          {canEdit && (
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              {m.technology_create_title()}
            </Button>
          )}
        </div>

        <div className="mb-4 flex items-center gap-2">
          <Input
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder={m.technology_placeholder_search()}
            className="max-w-sm"
          />
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">
            {m.common_loading()}
          </p>
        ) : technologies.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {m.technology_manager_empty()}
          </p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder ? null : header.column.getCanSort() ? (
                          <button
                            type="button"
                            className="flex cursor-pointer items-center gap-1 select-none"
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                            {{
                              asc: <ArrowUp className="size-3.5" />,
                              desc: <ArrowDown className="size-3.5" />,
                            }[header.column.getIsSorted() as string] ?? (
                              <ArrowUpDown className="size-3.5 text-muted-foreground" />
                            )}
                          </button>
                        ) : (
                          flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )
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

        {formOpen && (
          <TechnologyFormDialog
            open={formOpen}
            onOpenChange={setFormOpen}
            workspaceId={workspace.id}
            technology={editTech ?? undefined}
            onSuccess={invalidate}
          />
        )}

        <DeleteTechnologyDialog
          open={!!deleteTarget}
          onOpenChange={(open) => {
            if (!open) setDeleteTarget(null);
          }}
          technology={deleteTarget}
          onSuccess={invalidate}
        />
      </div>
    </>
  );
}
