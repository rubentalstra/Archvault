import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type { SortingState } from "@tanstack/react-table";
import { authClient } from "#/lib/auth-client";
import { getConnections } from "#/lib/connection.functions";
import { getElements } from "#/lib/element.functions";
import { getTags } from "#/lib/tag.functions";
import { getTechnologies } from "#/lib/technology.functions";
import { TagFilter } from "#/components/tags/tag-filter";
import {
  getConnectionColumns,
  type ConnectionRow,
} from "#/components/connections/connection-table-columns";
import { ConnectionFormDialog } from "#/components/connections/connection-form-dialog";
import { DeleteConnectionDialog } from "#/components/connections/delete-connection-dialog";
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
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "#/components/ui/breadcrumb";
import { Separator } from "#/components/ui/separator";
import { SidebarTrigger } from "#/components/ui/sidebar";
import { Plus } from "lucide-react";
import { m } from "#/paraglide/messages";
import type { ElementType } from "#/lib/element.validators";

type WorkspaceTag = { id: string; name: string; color: string; icon: string | null };
type WorkspaceElement = { id: string; name: string; elementType: ElementType };
type WorkspaceConnection = ConnectionRow & { tags?: WorkspaceTag[] };

export const Route = createFileRoute(
  "/_protected/_onboarded/workspace/$workspaceSlug/connections",
)({
  component: ConnectionsPage,
});

function ConnectionsPage() {
  const { workspace } = Route.useRouteContext();
  const { data: activeMember } = authClient.useActiveMember();
  const queryClient = useQueryClient();

  const memberRole = activeMember?.role;
  const canEdit = ["owner", "admin", "editor"].includes(memberRole ?? "");
  const canDelete = ["owner", "admin"].includes(memberRole ?? "");

  const getConnectionsFn = useServerFn(getConnections);
  const { data: connections = [], isLoading } = useQuery<WorkspaceConnection[]>({
    queryKey: ["connections", workspace.id],
    queryFn: async () =>
      (await getConnectionsFn({ data: { workspaceId: workspace.id } })) as WorkspaceConnection[],
  });

  const getElementsFn = useServerFn(getElements);
  const { data: elements = [] } = useQuery<WorkspaceElement[]>({
    queryKey: ["elements", workspace.id],
    queryFn: async () =>
      (await getElementsFn({ data: { workspaceId: workspace.id } })) as WorkspaceElement[],
  });

  const getTagsFn = useServerFn(getTags);
  const { data: workspaceTags = [] } = useQuery<WorkspaceTag[]>({
    queryKey: ["tags", workspace.id],
    queryFn: async () =>
      (await getTagsFn({ data: { workspaceId: workspace.id } })) as WorkspaceTag[],
  });

  const getTechnologiesFn = useServerFn(getTechnologies);
  const { data: workspaceTechnologies = [] } = useQuery({
    queryKey: ["technologies", workspace.id],
    queryFn: () => getTechnologiesFn({ data: { workspaceId: workspace.id } }),
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [editConnection, setEditConnection] =
    useState<ConnectionRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ConnectionRow | null>(
    null,
  );
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  const elementNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const el of elements) {
      map.set(el.id, el.name);
    }
    return map;
  }, [elements]);

  const elementTypeMap = useMemo(() => {
    const map = new Map<string, ElementType>();
    for (const el of elements) {
      map.set(el.id, el.elementType);
    }
    return map;
  }, [elements]);

  const elementOptions = useMemo(
    () =>
      elements.map((el) => ({
        id: el.id,
        name: el.name,
      })),
    [elements],
  );

  const invalidate = () => {
    void queryClient.invalidateQueries({
      queryKey: ["connections", workspace.id],
    });
  };

  const columns = useMemo(
    () =>
      getConnectionColumns({
        onEdit: (rel) => setEditConnection(rel),
        onDelete: (rel) => setDeleteTarget(rel),
        canEdit,
        canDelete,
        elementNameMap,
        elementTypeMap,
      }),
    [canEdit, canDelete, elementNameMap, elementTypeMap],
  );

  const filteredConnections = useMemo(() => {
    if (selectedTagIds.length === 0) return connections;
    return connections.filter((rel) =>
      rel.tags?.some((t) =>
        selectedTagIds.includes(t.id),
      ),
    );
  }, [connections, selectedTagIds]);

  const table = useReactTable({
    data: filteredConnections,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (row, _columnId, filterValue: string) => {
      const search = filterValue.toLowerCase();
      const rel = row.original;
      const sourceName =
        elementNameMap.get(rel.sourceElementId)?.toLowerCase() ?? "";
      const targetName =
        elementNameMap.get(rel.targetElementId)?.toLowerCase() ?? "";
      const desc = rel.description?.toLowerCase() ?? "";
      return (
        sourceName.includes(search) ||
        targetName.includes(search) ||
        desc.includes(search)
      );
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
                <BreadcrumbPage>
                  {m.connection_nav_title()}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col overflow-auto p-4 pt-0">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {m.connection_page_title()}
          </h2>
          {canEdit && (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              {m.connection_create_title()}
            </Button>
          )}
        </div>

        <div className="mb-4 flex items-center gap-2">
          <Input
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder={m.connection_search_placeholder()}
            className="max-w-sm"
          />
          {workspaceTags.length > 0 && (
            <TagFilter
              workspaceTags={workspaceTags}
              selectedTagIds={selectedTagIds}
              onChange={setSelectedTagIds}
            />
          )}
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">
            {m.common_loading()}
          </p>
        ) : connections.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {m.connection_empty()}
          </p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        className={
                          header.column.getCanSort()
                            ? "cursor-pointer select-none"
                            : ""
                        }
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                        {header.column.getIsSorted() === "asc" && " \u2191"}
                        {header.column.getIsSorted() === "desc" && " \u2193"}
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
        {(createOpen || editConnection) && (
          <ConnectionFormDialog
            open={createOpen || !!editConnection}
            onOpenChange={(open) => {
              if (!open) {
                setCreateOpen(false);
                setEditConnection(null);
              }
            }}
            workspaceId={workspace.id}
            connection={
              editConnection
                ? {
                    id: editConnection.id,
                    sourceElementId: editConnection.sourceElementId,
                    targetElementId: editConnection.targetElementId,
                    direction: editConnection.direction,
                    description: editConnection.description,
                    technologies: (editConnection as unknown as { technologies?: { technologyId: string; name: string; iconSlug: string | null }[] }).technologies ?? [],
                    tags: editConnection.tags ?? [],
                  }
                : undefined
            }
            elementOptions={elementOptions}
            workspaceTags={workspaceTags}
            workspaceTechnologies={workspaceTechnologies as { id: string; name: string; iconSlug: string | null }[]}
            onSuccess={invalidate}
          />
        )}

        {/* Delete Dialog */}
        <DeleteConnectionDialog
          open={!!deleteTarget}
          onOpenChange={(open) => {
            if (!open) setDeleteTarget(null);
          }}
          connection={
            deleteTarget
              ? {
                  id: deleteTarget.id,
                  sourceName:
                    elementNameMap.get(deleteTarget.sourceElementId) ?? "\u2014",
                  targetName:
                    elementNameMap.get(deleteTarget.targetElementId) ?? "\u2014",
                }
              : null
          }
          onSuccess={invalidate}
        />
      </div>
    </>
  );
}
