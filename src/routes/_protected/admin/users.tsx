import { useState, useCallback, useRef } from "react";
import {
  createFileRoute,
  useNavigate,
} from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod/v4";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { authClient } from "#/lib/auth-client";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "#/components/ui/table";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import {
  getUserColumns,
  type AdminUser,
} from "#/components/admin/user-table-columns";
import { CreateUserDialog } from "#/components/admin/create-user-dialog";
import { BanUserDialog } from "#/components/admin/ban-user-dialog";
import { RoleChangeDialog } from "#/components/admin/role-change-dialog";
import { RemoveUserDialog } from "#/components/admin/remove-user-dialog";
import { RevokeSessionsDialog } from "#/components/admin/revoke-sessions-dialog";
import { toast } from "sonner";

const searchSchema = z.object({
  search: z.string().optional().default(""),
  searchField: z
    .enum(["email", "name"])
    .optional()
    .default("email"),
  role: z.enum(["all", "admin", "user"]).optional().default("all"),
  status: z.enum(["all", "active", "banned"]).optional().default("all"),
  sortBy: z.string().optional().default("createdAt"),
  sortDirection: z.enum(["asc", "desc"]).optional().default("desc"),
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(25),
});

export const adminUsersDefaultSearch = {
  search: "",
  searchField: "email" as const,
  role: "all" as const,
  status: "all" as const,
  sortBy: "createdAt",
  sortDirection: "desc" as const,
  page: 1,
  limit: 25,
};

type SearchParams = z.infer<typeof searchSchema>;

export const Route = createFileRoute("/_protected/admin/users")({
  validateSearch: (search) => searchSchema.parse(search),
  component: UsersPage,
});

function UsersPage() {
  const { user: currentUser } = Route.useRouteContext();
  const search = Route.useSearch();
  const navigate = useNavigate();

  const queryClient = useQueryClient();

  // Dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [banUser, setBanUser] = useState<AdminUser | null>(null);
  const [roleUser, setRoleUser] = useState<AdminUser | null>(null);
  const [removeUser, setRemoveUser] = useState<AdminUser | null>(null);
  const [revokeUser, setRevokeUser] = useState<AdminUser | null>(null);

  // Debounced search
  const [searchInput, setSearchInput] = useState(search.search ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const updateSearch = useCallback(
    (updates: Partial<SearchParams>) => {
      navigate({
        to: "/admin/users",
        search: { ...search, ...updates } as never,
        replace: true,
      });
    },
    [navigate, search],
  );

  const { data: usersData, isLoading: loading } = useQuery({
    queryKey: ["admin", "users", search],
    queryFn: async () => {
      const queryParams: Record<string, string | number | undefined> = {
        limit: search.limit,
        offset: (search.page - 1) * search.limit,
        sortBy: search.sortBy,
        sortDirection: search.sortDirection,
      };

      if (search.search) {
        queryParams.searchField = search.searchField;
        queryParams.searchValue = search.search;
      }
      if (search.role !== "all") {
        queryParams.filterField = "role";
        queryParams.filterValue = search.role;
      }

      const { data, error } = await authClient.admin.listUsers({
        query: queryParams,
      } as Parameters<typeof authClient.admin.listUsers>[0]);

      if (error) throw new Error("Failed to load users");

      const userList = (data?.users ?? []) as unknown as AdminUser[];
      return { users: userList, total: data?.total ?? userList.length };
    },
  });

  const users = usersData?.users ?? [];
  const total = usersData?.total ?? 0;

  const refetchUsers = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
    [queryClient],
  );

  const totalPages = Math.max(1, Math.ceil(total / search.limit));

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateSearch({ search: value, page: 1 });
    }, 300);
  };

  // Filter banned status client-side since the API may not support it directly
  const filteredUsers =
    search.status === "all"
      ? users
      : users.filter((u) =>
          search.status === "banned" ? u.banned : !u.banned,
        );

  const columns = getUserColumns({
    currentUserId: currentUser.id,
    onViewDetails: (user) =>
      navigate({
        to: "/admin/user/$userId",
        params: { userId: user.id },
      }),
    onChangeRole: (user) => setRoleUser(user),
    onBan: (user) => setBanUser(user),
    onUnban: async (user) => {
      const { error } = await authClient.admin.unbanUser({ userId: user.id });
      if (error) {
        toast.error(error.message ?? "Failed to unban user");
        return;
      }
      toast.success(`${user.name} has been unbanned`);
      refetchUsers();
    },
    onImpersonate: async (user) => {
      const { error } = await authClient.admin.impersonateUser({
        userId: user.id,
      });
      if (error) {
        toast.error(error.message ?? "Failed to impersonate user");
        return;
      }
      navigate({ to: "/dashboard" });
    },
    onRevokeSessions: (user) => setRevokeUser(user),
    onRemove: (user) => setRemoveUser(user),
  });

  const table = useReactTable({
    data: filteredUsers,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    pageCount: totalPages,
    state: {
      pagination: { pageIndex: search.page - 1, pageSize: search.limit },
      sorting: [
        { id: search.sortBy, desc: search.sortDirection === "desc" },
      ],
    },
    onSortingChange: (updater) => {
      const newSorting =
        typeof updater === "function"
          ? updater([
              { id: search.sortBy, desc: search.sortDirection === "desc" },
            ])
          : updater;
      if (newSorting.length > 0) {
        updateSearch({
          sortBy: newSorting[0].id,
          sortDirection: newSorting[0].desc ? "desc" : "asc",
          page: 1,
        });
      }
    },
  });

  const parentRef = useRef<HTMLDivElement>(null);
  const rows = table.getRowModel().rows;

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 52,
    overscan: 10,
  });

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Users</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          Create User
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search users..."
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-64"
        />

        <Select
          value={search.searchField}
          onValueChange={(val: string | null) => {
            if (val) updateSearch({ searchField: val as "email" | "name", page: 1 });
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="name">Name</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={search.role}
          onValueChange={(val: string | null) => {
            if (val) updateSearch({ role: val as "all" | "admin" | "user", page: 1 });
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="user">User</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={search.status}
          onValueChange={(val: string | null) => {
            if (val) updateSearch({ status: val as "all" | "active" | "banned", page: 1 });
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="banned">Banned</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div ref={parentRef} className="rounded-lg border overflow-auto">
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
                    {header.column.getIsSorted() === "asc"
                      ? " \u2191"
                      : header.column.getIsSorted() === "desc"
                        ? " \u2193"
                        : null}
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
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              virtualizer.getVirtualItems().map((virtualRow) => {
                const row = rows[virtualRow.index];
                return (
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
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {total} total user{total !== 1 ? "s" : ""}
        </p>
        <div className="flex items-center gap-2">
          <Select
            value={String(search.limit)}
            onValueChange={(val: string | null) => {
              if (val) updateSearch({ limit: Number(val), page: 1 });
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 / page</SelectItem>
              <SelectItem value="25">25 / page</SelectItem>
              <SelectItem value="50">50 / page</SelectItem>
              <SelectItem value="100">100 / page</SelectItem>
            </SelectContent>
          </Select>

          <span className="text-sm text-muted-foreground">
            Page {search.page} of {totalPages}
          </span>

          <Button
            variant="outline"
            size="icon-sm"
            disabled={search.page <= 1}
            onClick={() => updateSearch({ page: search.page - 1 })}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            disabled={search.page >= totalPages}
            onClick={() => updateSearch({ page: search.page + 1 })}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {/* Dialogs */}
      <CreateUserDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={refetchUsers}
      />
      <BanUserDialog
        user={banUser}
        open={!!banUser}
        onOpenChange={(open) => !open && setBanUser(null)}
        onSuccess={refetchUsers}
      />
      <RoleChangeDialog
        user={roleUser}
        open={!!roleUser}
        onOpenChange={(open) => !open && setRoleUser(null)}
        onSuccess={refetchUsers}
      />
      <RemoveUserDialog
        user={removeUser}
        open={!!removeUser}
        onOpenChange={(open) => !open && setRemoveUser(null)}
        onSuccess={refetchUsers}
      />
      <RevokeSessionsDialog
        user={revokeUser}
        open={!!revokeUser}
        onOpenChange={(open) => !open && setRevokeUser(null)}
        onSuccess={refetchUsers}
      />
    </div>
  );
}
