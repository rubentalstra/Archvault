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
import { getRelationships } from "#/lib/relationship.functions";
import { getElements } from "#/lib/element.functions";
import { getTags } from "#/lib/tag.functions";
import { TagFilter } from "#/components/tags/tag-filter";
import {
  getRelationshipColumns,
  type RelationshipRow,
} from "#/components/relationships/relationship-table-columns";
import { RelationshipFormDialog } from "#/components/relationships/relationship-form-dialog";
import { DeleteRelationshipDialog } from "#/components/relationships/delete-relationship-dialog";
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
type WorkspaceRelationship = RelationshipRow & { tags?: WorkspaceTag[] };

export const Route = createFileRoute(
  "/_protected/_onboarded/workspace/$workspaceSlug/relationships",
)({
  component: RelationshipsPage,
});

function RelationshipsPage() {
  const { workspace } = Route.useRouteContext();
  const { data: activeMember } = authClient.useActiveMember();
  const queryClient = useQueryClient();

  const memberRole = activeMember?.role;
  const canEdit = ["owner", "admin", "editor"].includes(memberRole ?? "");
  const canDelete = ["owner", "admin"].includes(memberRole ?? "");

  const getRelationshipsFn = useServerFn(getRelationships);
  const { data: relationships = [], isLoading } = useQuery<WorkspaceRelationship[]>({
    queryKey: ["relationships", workspace.id],
    queryFn: async () =>
      (await getRelationshipsFn({ data: { workspaceId: workspace.id } })) as WorkspaceRelationship[],
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

  const [createOpen, setCreateOpen] = useState(false);
  const [editRelationship, setEditRelationship] =
    useState<RelationshipRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RelationshipRow | null>(
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
      queryKey: ["relationships", workspace.id],
    });
  };

  const columns = useMemo(
    () =>
      getRelationshipColumns({
        onEdit: (rel) => setEditRelationship(rel),
        onDelete: (rel) => setDeleteTarget(rel),
        canEdit,
        canDelete,
        elementNameMap,
        elementTypeMap,
      }),
    [canEdit, canDelete, elementNameMap, elementTypeMap],
  );

  const filteredRelationships = useMemo(() => {
    if (selectedTagIds.length === 0) return relationships;
    return relationships.filter((rel) =>
      rel.tags?.some((t) =>
        selectedTagIds.includes(t.id),
      ),
    );
  }, [relationships, selectedTagIds]);

  const table = useReactTable({
    data: filteredRelationships,
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
      const tech = rel.technology?.toLowerCase() ?? "";
      return (
        sourceName.includes(search) ||
        targetName.includes(search) ||
        desc.includes(search) ||
        tech.includes(search)
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
                  {m.relationship_nav_title()}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col overflow-auto p-4 pt-0">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {m.relationship_page_title()}
          </h2>
          {canEdit && (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              {m.relationship_create_title()}
            </Button>
          )}
        </div>

        <div className="mb-4 flex items-center gap-2">
          <Input
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder={m.relationship_search_placeholder()}
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
        ) : relationships.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {m.relationship_empty()}
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
        {(createOpen || editRelationship) && (
          <RelationshipFormDialog
            open={createOpen || !!editRelationship}
            onOpenChange={(open) => {
              if (!open) {
                setCreateOpen(false);
                setEditRelationship(null);
              }
            }}
            workspaceId={workspace.id}
            relationship={
              editRelationship
                ? {
                    id: editRelationship.id,
                    sourceElementId: editRelationship.sourceElementId,
                    targetElementId: editRelationship.targetElementId,
                    direction: editRelationship.direction,
                    description: editRelationship.description,
                    technology: editRelationship.technology,
                    tags: editRelationship.tags ?? [],
                  }
                : undefined
            }
            elementOptions={elementOptions}
            workspaceTags={workspaceTags}
            onSuccess={invalidate}
          />
        )}

        {/* Delete Dialog */}
        <DeleteRelationshipDialog
          open={!!deleteTarget}
          onOpenChange={(open) => {
            if (!open) setDeleteTarget(null);
          }}
          relationship={
            deleteTarget
              ? {
                  id: deleteTarget.id,
                  sourceName:
                    elementNameMap.get(deleteTarget.sourceElementId) ?? "—",
                  targetName:
                    elementNameMap.get(deleteTarget.targetElementId) ?? "—",
                }
              : null
          }
          onSuccess={invalidate}
        />
      </div>
    </>
  );
}
