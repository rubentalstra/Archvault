import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
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
import { m } from "#/paraglide/messages";
import type { ElementType } from "#/lib/element.validators";

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
  const { data: elements = [], isLoading } = useQuery({
    queryKey: ["elements", workspace.id],
    queryFn: () => getElementsFn({ data: { workspaceId: workspace.id } }),
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editElement, setEditElement] = useState<ElementRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ElementRow | null>(null);
  const [defaultParentId, setDefaultParentId] = useState<string | undefined>();
  const [defaultType, setDefaultType] = useState<ElementType | undefined>();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

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
    queryClient.invalidateQueries({ queryKey: ["elements", workspace.id] });
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

  const table = useReactTable({
    data: elements as ElementRow[],
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="flex h-full">
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
          <h1 className="text-2xl font-bold">{m.element_page_title()}</h1>
        </div>

        <div className="mb-4">
          <Input
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder={m.element_search_placeholder()}
            className="max-w-sm"
          />
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">{m.common_loading()}</p>
        ) : elements.length === 0 ? (
          <p className="text-sm text-muted-foreground">{m.element_empty()}</p>
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
                }
              : undefined
          }
          parentOptions={parentOptions}
          defaultParentId={defaultParentId}
          defaultType={defaultType}
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
  );
}
