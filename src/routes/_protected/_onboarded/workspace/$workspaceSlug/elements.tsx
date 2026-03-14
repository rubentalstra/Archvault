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
import { getElements } from "#/lib/element.functions";
import { getTags } from "#/lib/tag.functions";
import { TagFilter } from "#/components/tags/tag-filter";
import {
  getElementColumns,
  type ElementRow,
} from "#/components/elements/element-table-columns";
import { ElementTree } from "#/components/elements/element-tree";
import { ElementFormDialog } from "#/components/elements/element-form-dialog";
import { DeleteElementDialog } from "#/components/elements/delete-element-dialog";
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
import { m } from "#/paraglide/messages";
import type { ElementType } from "#/lib/element.validators";

type WorkspaceTag = { id: string; name: string; color: string; icon: string | null };
type WorkspaceElement = ElementRow & { tags?: WorkspaceTag[] };

export const Route = createFileRoute(
  "/_protected/_onboarded/workspace/$workspaceSlug/elements",
)({
  component: ElementsPage,
});

function ElementsPage() {
  const { workspace } = Route.useRouteContext();
  const { data: activeMember } = authClient.useActiveMember();
  const queryClient = useQueryClient();

  const memberRole = activeMember?.role;
  const canEdit = ["owner", "admin", "editor"].includes(memberRole ?? "");
  const canDelete = ["owner", "admin"].includes(memberRole ?? "");

  const getElementsFn = useServerFn(getElements);
  const { data: elements = [], isLoading } = useQuery<WorkspaceElement[]>({
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

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editElement, setEditElement] = useState<ElementRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ElementRow | null>(null);
  const [defaultParentId, setDefaultParentId] = useState<string | undefined>();
  const [defaultType, setDefaultType] = useState<ElementType | undefined>();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  const parentNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const el of elements) {
      map.set(el.id, el.name);
    }
    return map;
  }, [elements]);

  const parentOptions = useMemo(
    () =>
      elements.map((el) => ({
        id: el.id,
        name: el.name,
        elementType: el.elementType,
      })),
    [elements],
  );

  const hasChildren = (id: string) =>
    elements.some((el) => el.parentElementId === id);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["elements", workspace.id] });
  };

  const columns = useMemo(
    () =>
      getElementColumns({
        onEdit: (el) => setEditElement(el),
        onDelete: (el) => setDeleteTarget(el),
        canEdit,
        canDelete,
        parentNameMap,
      }),
    [canEdit, canDelete, parentNameMap],
  );

  const filteredElements = useMemo(() => {
    if (selectedTagIds.length === 0) return elements;
    return elements.filter((el) =>
      el.tags?.some((t) => selectedTagIds.includes(t.id)),
    );
  }, [elements, selectedTagIds]);

  const table = useReactTable({
    data: filteredElements,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
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
                <BreadcrumbPage>{m.element_nav_title()}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Tree Sidebar */}
        <aside className="w-[280px] shrink-0 border-r">
          <ElementTree
            elements={elements}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onCreateRoot={() => {
              setDefaultParentId(undefined);
              setDefaultType(undefined);
              setCreateOpen(true);
            }}
            onCreateChild={(parentId, childType) => {
              setDefaultParentId(parentId);
              setDefaultType(childType);
              setCreateOpen(true);
            }}
          />
        </aside>

        {/* Table View */}
        <div className="flex flex-1 flex-col overflow-auto p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold">{m.element_page_title()}</h2>
          </div>

          <div className="mb-4 flex items-center gap-2">
            <Input
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder={m.element_search_placeholder()}
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
          ) : elements.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {m.element_empty()}
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
                    <TableRow
                      key={row.id}
                      className={
                        row.original.id === selectedId ? "bg-accent/50" : ""
                      }
                      onClick={() => setSelectedId(row.original.id)}
                    >
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
        </div>

        {/* Create / Edit Dialog */}
        {(createOpen || editElement) && (
          <ElementFormDialog
            open={createOpen || !!editElement}
            onOpenChange={(open) => {
              if (!open) {
                setCreateOpen(false);
                setEditElement(null);
                setDefaultParentId(undefined);
                setDefaultType(undefined);
              }
            }}
            workspaceId={workspace.id}
            element={
              editElement
                ? {
                    id: editElement.id,
                    elementType: editElement.elementType,
                    name: editElement.name,
                    displayDescription: editElement.displayDescription,
                    description: null,
                    status: editElement.status,
                    external: editElement.external,
                    parentElementId: editElement.parentElementId,
                    technologies: editElement.technologies,
                    links: editElement.links,
                    tags: editElement.tags ?? [],
                    groups: editElement.groups ?? [],
                  }
                : undefined
            }
            parentOptions={parentOptions}
            defaultParentId={defaultParentId}
            defaultType={defaultType}
            workspaceTags={workspaceTags}
            onSuccess={invalidate}
          />
        )}

        {/* Delete Dialog */}
        <DeleteElementDialog
          open={!!deleteTarget}
          onOpenChange={(open) => {
            if (!open) setDeleteTarget(null);
          }}
          element={deleteTarget}
          hasChildren={deleteTarget ? hasChildren(deleteTarget.id) : false}
          onSuccess={invalidate}
        />
      </div>
    </>
  );
}
