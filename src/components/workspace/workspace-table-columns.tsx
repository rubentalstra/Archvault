import { createColumnHelper } from "@tanstack/react-table";
import { Link } from "@tanstack/react-router";
import { Badge } from "#/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "#/components/ui/tooltip";
import { Button } from "#/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import {
  ExternalLink,
  FolderOpen,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { formatRelativeDate } from "#/lib/admin.utils";
import { m } from "#/paraglide/messages";
import type { getWorkspaces } from "#/lib/workspace.functions";

export type Workspace = Awaited<ReturnType<typeof getWorkspaces>>[number];

export interface WorkspaceTableActions {
  onOpen: (workspace: Workspace) => void;
  onEdit: (workspace: Workspace) => void;
  onDelete: (workspace: Workspace) => void;
}

const columnHelper = createColumnHelper<Workspace>();

export function getWorkspaceColumns(actions: WorkspaceTableActions) {
  return [
    columnHelper.display({
      id: "workspace",
      header: m.workspace_column_workspace(),
      cell: (info) => {
        const ws = info.row.original;
        return (
          <Link
            to="/workspace/$workspaceSlug"
            params={{ workspaceSlug: ws.slug }}
            className="flex items-center gap-3"
          >
            <span className="text-lg">
              {ws.iconEmoji || (
                <FolderOpen className="size-5 text-muted-foreground" />
              )}
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{ws.name}</span>
              {ws.description && (
                <span className="text-xs text-muted-foreground line-clamp-1">
                  {ws.description}
                </span>
              )}
            </div>
          </Link>
        );
      },
    }),
    columnHelper.accessor("status", {
      header: m.workspace_column_status(),
      cell: (info) => {
        const status = info.getValue();
        return <Badge variant="default">{status ?? m.common_status_active()}</Badge>;
      },
    }),
    columnHelper.accessor("createdAt", {
      header: m.workspace_column_created(),
      cell: (info) => {
        const date = info.getValue();
        if (!date) return null;
        return (
          <Tooltip>
            <TooltipTrigger>
              <span className="text-sm text-muted-foreground">
                {formatRelativeDate(date)}
              </span>
            </TooltipTrigger>
            <TooltipContent>{new Date(date).toLocaleString()}</TooltipContent>
          </Tooltip>
        );
      },
    }),
    columnHelper.display({
      id: "actions",
      header: "",
      cell: (info) => {
        const ws = info.row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon-sm" />}
            >
              <MoreHorizontal className="size-4" />
              <span className="sr-only">{m.common_label_actions()}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => actions.onOpen(ws)}>
                <ExternalLink className="size-4" />
                {m.workspace_action_open()}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => actions.onEdit(ws)}>
                <Pencil className="size-4" />
                {m.workspace_action_edit()}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => actions.onDelete(ws)}
              >
                <Trash2 className="size-4" />
                {m.workspace_action_delete()}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    }),
  ];
}
