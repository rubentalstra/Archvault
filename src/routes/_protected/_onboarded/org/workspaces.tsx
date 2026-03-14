import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "#/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "#/components/ui/card";
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
import { getWorkspaces } from "#/lib/workspace.functions";
import {
  getWorkspaceColumns,
  type Workspace,
} from "#/components/workspace/workspace-table-columns";
import { CreateWorkspaceDialog } from "#/components/workspace/create-workspace-dialog";
import { EditWorkspaceDialog } from "#/components/workspace/edit-workspace-dialog";
import { DeleteWorkspaceDialog } from "#/components/workspace/delete-workspace-dialog";
import { m } from "#/paraglide/messages";

export const Route = createFileRoute(
  "/_protected/_onboarded/org/workspaces",
)({
  component: WorkspacesPage,
});

function WorkspacesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const getWorkspacesFn = useServerFn(getWorkspaces);

  const [createOpen, setCreateOpen] = useState(false);
  const [editWorkspace, setEditWorkspace] = useState<Workspace | null>(null);
  const [deleteWorkspace, setDeleteWorkspace] = useState<Workspace | null>(
    null,
  );

  const { data: workspaces = [] } = useQuery({
    queryKey: ["workspaces"],
    queryFn: () => getWorkspacesFn(),
  });

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["workspaces"] });

  const columns = getWorkspaceColumns({
    onOpen: (ws) =>
      navigate({
        to: "/workspace/$workspaceSlug",
        params: { workspaceSlug: ws.slug },
      }),
    onEdit: (ws) => setEditWorkspace(ws),
    onDelete: (ws) => setDeleteWorkspace(ws),
  });

  const table = useReactTable({
    data: workspaces,
    columns,
    getCoreRowModel: getCoreRowModel(),
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
                <BreadcrumbLink render={<Link to="/org" />}>
                  {m.org_nav_dashboard()}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>{m.workspace_page_title()}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="mx-auto w-full max-w-4xl">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold">
              {m.workspace_page_title()}
            </h2>
            <Button onClick={() => setCreateOpen(true)}>
              {m.workspace_new_workspace()}
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{m.workspace_list_title()}</CardTitle>
              <CardDescription>
                {m.workspace_count({ count: workspaces.length })}
              </CardDescription>
            </CardHeader>
            <CardContent>
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
                  {table.getRowModel().rows.length ? (
                    table.getRowModel().rows.map((row) => (
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
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="text-center text-muted-foreground"
                      >
                        {m.workspace_table_empty()}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <CreateWorkspaceDialog
            open={createOpen}
            onOpenChange={setCreateOpen}
            onSuccess={refresh}
          />
          <EditWorkspaceDialog
            workspace={editWorkspace}
            open={editWorkspace !== null}
            onOpenChange={(open) => {
              if (!open) setEditWorkspace(null);
            }}
            onSuccess={refresh}
          />
          <DeleteWorkspaceDialog
            workspace={deleteWorkspace}
            open={deleteWorkspace !== null}
            onOpenChange={(open) => {
              if (!open) setDeleteWorkspace(null);
            }}
            onSuccess={refresh}
          />
        </div>
      </div>
    </>
  );
}
