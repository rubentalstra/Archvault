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
import { getDiagrams } from "#/lib/diagram.functions";
import { getElements } from "#/lib/element.functions";
import {
  getDiagramColumns,
  type DiagramRow,
} from "#/components/diagrams/diagram-table-columns";
import { DiagramFormDialog } from "#/components/diagrams/diagram-form-dialog";
import { DeleteDiagramDialog } from "#/components/diagrams/delete-diagram-dialog";
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

type WorkspaceElement = { id: string; name: string; elementType: ElementType };
type WorkspaceDiagram = {
  id: string;
  name: string;
  diagramType: DiagramRow["diagramType"];
  scopeElementName: string | null;
  scopeElementId: string | null;
  elementCount: number | string;
  description: string | null;
  gridSize: number;
  snapToGrid: boolean;
  updatedAt: string | Date;
};

export const Route = createFileRoute(
  "/_protected/_onboarded/workspace/$workspaceSlug/diagrams",
)({
  component: DiagramsPage,
});

function DiagramsPage() {
  const { workspace } = Route.useRouteContext();
  const { data: activeMember } = authClient.useActiveMember();
  const queryClient = useQueryClient();

  const memberRole = activeMember?.role;
  const canEdit = ["owner", "admin", "editor"].includes(memberRole ?? "");
  const canDelete = ["owner", "admin"].includes(memberRole ?? "");

  const getDiagramsFn = useServerFn(getDiagrams);
  const { data: diagrams = [], isLoading } = useQuery<WorkspaceDiagram[]>({
    queryKey: ["diagrams", workspace.id],
    queryFn: async () =>
      (await getDiagramsFn({ data: { workspaceId: workspace.id } })) as WorkspaceDiagram[],
  });

  const getElementsFn = useServerFn(getElements);
  const { data: elements = [] } = useQuery<WorkspaceElement[]>({
    queryKey: ["elements", workspace.id],
    queryFn: async () =>
      (await getElementsFn({ data: { workspaceId: workspace.id } })) as WorkspaceElement[],
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [editDiagram, setEditDiagram] = useState<DiagramRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DiagramRow | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const scopeElementOptions = useMemo(
    () =>
      elements.map((el) => ({
        id: el.id,
        name: el.name,
        elementType: el.elementType,
      })),
    [elements],
  );

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["diagrams", workspace.id] });
  };

  const columns = useMemo(
    () =>
      getDiagramColumns({
        onEdit: (d) => setEditDiagram(d),
        onDelete: (d) => setDeleteTarget(d),
        canEdit,
        canDelete,
        workspaceSlug: workspace.slug,
      }),
    [canEdit, canDelete, workspace.slug],
  );

  const tableData = useMemo(
    () =>
      diagrams.map((d) => ({
        id: d.id,
        name: d.name,
        diagramType: d.diagramType,
        scopeElementName: d.scopeElementName,
        elementCount: Number(d.elementCount),
        updatedAt: d.updatedAt,
        description: d.description,
        scopeElementId: d.scopeElementId,
        gridSize: d.gridSize,
        snapToGrid: d.snapToGrid,
      })),
    [diagrams],
  );

  const table = useReactTable({
    data: tableData,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (row, _columnId, filterValue: string) => {
      const search = filterValue.toLowerCase();
      const d = row.original;
      const name = d.name.toLowerCase();
      const scope = d.scopeElementName?.toLowerCase() ?? "";
      return name.includes(search) || scope.includes(search);
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
                <BreadcrumbPage>{m.diagram_nav_title()}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col overflow-auto p-4 pt-0">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">{m.diagram_page_title()}</h2>
          {canEdit && (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              {m.diagram_create_title()}
            </Button>
          )}
        </div>

        <div className="mb-4 flex items-center gap-2">
          <Input
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder={m.diagram_search_placeholder()}
            className="max-w-sm"
          />
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">
            {m.common_loading()}
          </p>
        ) : diagrams.length === 0 ? (
          <p className="text-sm text-muted-foreground">{m.diagram_empty()}</p>
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
        {(createOpen || editDiagram) && (
          <DiagramFormDialog
            open={createOpen || !!editDiagram}
            onOpenChange={(open) => {
              if (!open) {
                setCreateOpen(false);
                setEditDiagram(null);
              }
            }}
            workspaceId={workspace.id}
            diagram={
              editDiagram
                ? {
                    id: editDiagram.id,
                    name: editDiagram.name,
                    description:
                      (
                        editDiagram as unknown as {
                          description: string | null;
                        }
                      ).description ?? null,
                    diagramType: editDiagram.diagramType,
                    scopeElementId:
                      (
                        editDiagram as unknown as {
                          scopeElementId: string | null;
                        }
                      ).scopeElementId ?? null,
                    gridSize:
                      (editDiagram as unknown as { gridSize: number })
                        .gridSize ?? 20,
                    snapToGrid:
                      (editDiagram as unknown as { snapToGrid: boolean })
                        .snapToGrid ?? true,
                  }
                : undefined
            }
            scopeElementOptions={scopeElementOptions}
            onSuccess={invalidate}
          />
        )}

        {/* Delete Dialog */}
        <DeleteDiagramDialog
          open={!!deleteTarget}
          onOpenChange={(open) => {
            if (!open) setDeleteTarget(null);
          }}
          diagram={
            deleteTarget
              ? { id: deleteTarget.id, name: deleteTarget.name }
              : null
          }
          onSuccess={invalidate}
        />
      </div>
    </>
  );
}
