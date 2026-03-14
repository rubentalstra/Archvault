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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "#/components/ui/tooltip";
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
import { Plus, MoreHorizontal, ShieldCheck, ShieldX, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { RegisterSSODialog } from "#/components/admin/register-sso-dialog";

export const Route = createFileRoute("/_protected/admin/sso")({
  component: SSOProvidersPage,
});

interface SSOProviderRow {
  id: string;
  providerId: string;
  issuer: string;
  domain: string;
  oidcConfig: string | null;
  samlConfig: string | null;
  organizationId: string | null;
  domainVerified: boolean;
  domainVerificationToken?: string;
}

const columnHelper = createColumnHelper<SSOProviderRow>();

function SSOProvidersPage() {
  const queryClient = useQueryClient();
  const [registerOpen, setRegisterOpen] = useState(false);
  const [deleteProvider, setDeleteProvider] = useState<SSOProviderRow | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const { data: providers = [], isLoading: loading } = useQuery({
    queryKey: ["admin", "sso-providers"],
    queryFn: async () => {
      const { data, error } = await authClient.sso.providers();
      if (error) throw new Error("Failed to load SSO providers");
      return (data ?? []) as unknown as SSOProviderRow[];
    },
  });

  const refetchProviders = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ["admin", "sso-providers"] }),
    [queryClient],
  );

  const handleVerifyDomain = async (providerId: string) => {
    setVerifyingId(providerId);
    const { error } = await authClient.sso.verifyDomain({ providerId });
    if (error) {
      toast.error((error as { message?: string }).message ?? "Domain verification failed. Ensure the DNS TXT record is set correctly.");
    } else {
      toast.success("Domain verified successfully");
      refetchProviders();
    }
    setVerifyingId(null);
  };

  const handleDelete = async () => {
    if (!deleteProvider) return;
    const { error } = await authClient.sso.deleteProvider({
      providerId: deleteProvider.providerId,
    });
    if (error) {
      toast.error((error as { message?: string }).message ?? "Failed to delete provider");
    } else {
      toast.success("SSO provider deleted");
      refetchProviders();
    }
    setDeleteProvider(null);
  };

  const columns = [
    columnHelper.accessor("providerId", {
      header: "Provider ID",
      cell: (info) => (
        <span className="font-mono text-sm">{info.getValue()}</span>
      ),
    }),
    columnHelper.accessor("issuer", {
      header: "Issuer",
      cell: (info) => (
        <Tooltip>
          <TooltipTrigger>
            <span className="max-w-48 truncate text-sm">{info.getValue()}</span>
          </TooltipTrigger>
          <TooltipContent>{info.getValue()}</TooltipContent>
        </Tooltip>
      ),
    }),
    columnHelper.accessor("domain", {
      header: "Domain",
      cell: (info) => <span className="text-sm">{info.getValue()}</span>,
    }),
    columnHelper.display({
      id: "type",
      header: "Type",
      cell: (info) => {
        const row = info.row.original;
        const type = row.samlConfig ? "SAML" : "OIDC";
        return (
          <Badge variant="secondary">{type}</Badge>
        );
      },
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
    columnHelper.accessor("domainVerified", {
      header: "Domain Verified",
      cell: (info) => {
        const verified = info.getValue();
        const row = info.row.original;
        return (
          <div className="flex items-center gap-2">
            {verified ? (
              <Badge variant="default" className="gap-1">
                <ShieldCheck className="size-3" />
                Verified
              </Badge>
            ) : (
              <div className="flex items-center gap-2">
                <Badge variant="destructive" className="gap-1">
                  <ShieldX className="size-3" />
                  Unverified
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={verifyingId === row.providerId}
                  onClick={() => handleVerifyDomain(row.providerId)}
                >
                  {verifyingId === row.providerId ? "Verifying..." : "Verify"}
                </Button>
              </div>
            )}
          </div>
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
              {!row.domainVerified && (
                <DropdownMenuItem onClick={() => handleVerifyDomain(row.providerId)}>
                  <ShieldCheck className="size-4" />
                  Verify Domain
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setDeleteProvider(row)}
              >
                <Trash2 className="size-4" />
                Delete Provider
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    }),
  ];

  const table = useReactTable({
    data: providers,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const rows = table.getRowModel().rows;

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">SSO Providers</h1>
        <Button onClick={() => setRegisterOpen(true)}>
          <Plus className="size-4" />
          Register Provider
        </Button>
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
                  No SSO providers registered.
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

      {/* Domain verification instructions for unverified providers */}
      {providers.some((p) => !p.domainVerified) && (
        <div className="rounded-lg border bg-muted/30 p-4">
          <h3 className="mb-2 text-sm font-semibold">Domain Verification Instructions</h3>
          <p className="mb-2 text-sm text-muted-foreground">
            To verify domain ownership, add a DNS TXT record for each unverified provider:
          </p>
          <ul className="space-y-2">
            {providers
              .filter((p) => !p.domainVerified)
              .map((p) => (
                <li key={p.providerId} className="text-sm">
                  <span className="font-medium">{p.domain}:</span>{" "}
                  Add a TXT record at{" "}
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                    _better-auth-token-{p.providerId}.{p.domain}
                  </code>
                  {p.domainVerificationToken && (
                    <>
                      {" "}with value{" "}
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                        {p.domainVerificationToken}
                      </code>
                    </>
                  )}
                </li>
              ))}
          </ul>
        </div>
      )}

      <RegisterSSODialog
        open={registerOpen}
        onOpenChange={setRegisterOpen}
        onSuccess={refetchProviders}
      />

      <AlertDialog open={!!deleteProvider} onOpenChange={(open) => !open && setDeleteProvider(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete SSO Provider</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the provider &quot;{deleteProvider?.providerId}&quot;?
              This action cannot be undone. Users will no longer be able to sign in via this provider.
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
