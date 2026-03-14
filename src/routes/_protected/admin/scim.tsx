import { useState, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import { authClient } from "#/lib/auth-client";
import { Button } from "#/components/ui/button";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "#/components/ui/alert-dialog";
import { Plus, MoreHorizontal, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { GenerateScimTokenDialog } from "#/components/admin/generate-scim-token-dialog";

export const Route = createFileRoute("/_protected/admin/scim")({
  component: SCIMPage,
});

interface SCIMConnectionRow {
  id: string;
  providerId: string;
  organizationId: string | null;
  userId: string | null;
}

const columnHelper = createColumnHelper<SCIMConnectionRow>();

function SCIMPage() {
  const queryClient = useQueryClient();
  const [generateOpen, setGenerateOpen] = useState(false);
  const [deleteConnection, setDeleteConnection] = useState<SCIMConnectionRow | null>(null);

  const { data: connections = [], isLoading: loading } = useQuery({
    queryKey: ["admin", "scim-connections"],
    queryFn: async () => {
      const { data, error } = await authClient.scim.listProviderConnections();
      if (error) throw new Error("Failed to load SCIM connections");
      return (data ?? []) as unknown as SCIMConnectionRow[];
    },
  });

  const refetchConnections = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ["admin", "scim-connections"] }),
    [queryClient],
  );

  const handleDelete = async () => {
    if (!deleteConnection) return;
    const { error } = await authClient.scim.deleteProviderConnection({
      providerId: deleteConnection.providerId,
    });
    if (error) {
      toast.error((error as { message?: string }).message ?? "Failed to delete connection");
    } else {
      toast.success("SCIM connection deleted");
      refetchConnections();
    }
    setDeleteConnection(null);
  };

  const columns = [
    columnHelper.accessor("providerId", {
      header: "Provider ID",
      cell: (info) => (
        <span className="font-mono text-sm">{info.getValue()}</span>
      ),
    }),
    columnHelper.accessor("organizationId", {
      header: "Organization",
      cell: (info) => {
        const val = info.getValue();
        return val ? (
          <span className="font-mono text-xs">{val}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    }),
    columnHelper.accessor("userId", {
      header: "Owner",
      cell: (info) => {
        const val = info.getValue();
        return val ? (
          <span className="font-mono text-xs">{val}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    }),
    columnHelper.display({
      id: "actions",
      header: "",
      cell: (info) => {
        const row = info.row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon-sm" />}
            >
              <MoreHorizontal className="size-4" />
              <span className="sr-only">Actions</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setDeleteConnection(row)}
              >
                <Trash2 className="size-4" />
                Delete Connection
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    }),
  ];

  const table = useReactTable({
    data: connections,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const rows = table.getRowModel().rows;

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">SCIM Provisioning</h1>
          <p className="text-sm text-muted-foreground">
            Manage SCIM connections for automated user provisioning from identity providers.
          </p>
        </div>
        <Button onClick={() => setGenerateOpen(true)}>
          <Plus className="size-4" />
          Generate Token
        </Button>
      </div>

      <div className="rounded-lg border bg-muted/30 p-3">
        <p className="text-sm">
          <span className="font-medium">SCIM Base URL: </span>
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
            {typeof window !== "undefined" ? window.location.origin : ""}/api/auth/scim/v2
          </code>
        </p>
      </div>

      <div className="rounded-lg border overflow-auto">
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
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  Loading...
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No SCIM connections configured.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
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
            )}
          </TableBody>
        </Table>
      </div>

      <GenerateScimTokenDialog
        open={generateOpen}
        onOpenChange={setGenerateOpen}
        onSuccess={refetchConnections}
      />

      <AlertDialog
        open={!!deleteConnection}
        onOpenChange={(open) => !open && setDeleteConnection(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete SCIM Connection</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the SCIM connection for provider
              &quot;{deleteConnection?.providerId}&quot;? This will immediately
              invalidate the associated token and stop all provisioning.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
