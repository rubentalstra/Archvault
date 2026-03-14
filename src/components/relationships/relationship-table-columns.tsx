import { createColumnHelper } from "@tanstack/react-table";
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
  MoreHorizontal,
  Pencil,
  Trash2,
  ArrowRight,
  ArrowLeft,
  ArrowLeftRight,
  Minus,
  User,
  Layers,
  Server,
  Package,
  Database,
  Cpu,
} from "lucide-react";
import { formatRelativeDate } from "#/lib/admin.utils";
import { m } from "#/paraglide/messages";
import type { RelationshipDirection } from "#/lib/relationship.validators";
import type { ElementType } from "#/lib/element.validators";
import { TagBadge } from "#/components/tags/tag-badge";

export interface RelationshipRow {
  id: string;
  sourceElementId: string;
  targetElementId: string;
  direction: RelationshipDirection;
  description: string | null;
  technology: string | null;
  tags: { id: string; name: string; color: string; icon: string | null }[];
  updatedAt: string | Date;
}

export interface RelationshipTableActions {
  onEdit: (rel: RelationshipRow) => void;
  onDelete: (rel: RelationshipRow) => void;
  canEdit: boolean;
  canDelete: boolean;
  elementNameMap: Map<string, string>;
  elementTypeMap: Map<string, ElementType>;
}

const TYPE_ICONS: Record<ElementType, typeof User> = {
  actor: User,
  group: Layers,
  system: Server,
  app: Package,
  store: Database,
  component: Cpu,
};

const DIRECTION_ICONS: Record<RelationshipDirection, typeof ArrowRight> = {
  outgoing: ArrowRight,
  incoming: ArrowLeft,
  bidirectional: ArrowLeftRight,
  none: Minus,
};

const DIRECTION_LABELS: Record<RelationshipDirection, () => string> = {
  outgoing: () => m.relationship_direction_outgoing(),
  incoming: () => m.relationship_direction_incoming(),
  bidirectional: () => m.relationship_direction_bidirectional(),
  none: () => m.relationship_direction_none(),
};

const columnHelper = createColumnHelper<RelationshipRow>();

export function getRelationshipColumns(actions: RelationshipTableActions) {
  return [
    columnHelper.accessor("sourceElementId", {
      header: m.relationship_column_source(),
      enableSorting: true,
      cell: (info) => {
        const id = info.getValue();
        const name = actions.elementNameMap.get(id) ?? "—";
        const type = actions.elementTypeMap.get(id);
        const Icon = type ? TYPE_ICONS[type] : null;
        return (
          <div className="flex items-center gap-2">
            {Icon && <Icon className="size-4 shrink-0 text-muted-foreground" />}
            <span className="text-sm font-medium">{name}</span>
          </div>
        );
      },
    }),
    columnHelper.accessor("targetElementId", {
      header: m.relationship_column_target(),
      enableSorting: true,
      cell: (info) => {
        const id = info.getValue();
        const name = actions.elementNameMap.get(id) ?? "—";
        const type = actions.elementTypeMap.get(id);
        const Icon = type ? TYPE_ICONS[type] : null;
        return (
          <div className="flex items-center gap-2">
            {Icon && <Icon className="size-4 shrink-0 text-muted-foreground" />}
            <span className="text-sm font-medium">{name}</span>
          </div>
        );
      },
    }),
    columnHelper.accessor("direction", {
      header: m.relationship_column_direction(),
      enableSorting: true,
      cell: (info) => {
        const dir = info.getValue();
        const Icon = DIRECTION_ICONS[dir];
        return (
          <div className="flex items-center gap-1.5">
            <Icon className="size-4 text-muted-foreground" />
            <span className="text-sm">{DIRECTION_LABELS[dir]()}</span>
          </div>
        );
      },
    }),
    columnHelper.accessor("description", {
      header: m.relationship_column_description(),
      enableSorting: false,
      cell: (info) => {
        const desc = info.getValue();
        if (!desc) return <span className="text-muted-foreground">—</span>;
        return <span className="text-sm">{desc}</span>;
      },
    }),
    columnHelper.accessor("technology", {
      header: m.relationship_column_technology(),
      enableSorting: false,
      cell: (info) => {
        const tech = info.getValue();
        if (!tech) return <span className="text-muted-foreground">—</span>;
        return <Badge variant="secondary">{tech}</Badge>;
      },
    }),
    columnHelper.accessor("tags", {
      header: m.relationship_column_tags(),
      enableSorting: false,
      cell: (info) => {
        const tags = info.getValue();
        if (!tags || tags.length === 0) return <span className="text-muted-foreground">—</span>;
        const visible = tags.slice(0, 3);
        const remaining = tags.length - visible.length;
        return (
          <div className="flex flex-wrap gap-1">
            {visible.map((t) => (
              <TagBadge key={t.id} name={t.name} color={t.color} icon={t.icon} />
            ))}
            {remaining > 0 && (
              <Badge variant="secondary" className="text-xs">
                +{remaining}
              </Badge>
            )}
          </div>
        );
      },
    }),
    columnHelper.accessor("updatedAt", {
      header: m.relationship_column_updated(),
      enableSorting: true,
      cell: (info) => {
        const date = info.getValue();
        return (
          <Tooltip>
            <TooltipTrigger>
              <span className="text-sm text-muted-foreground">
                {formatRelativeDate(date)}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              {new Date(date).toLocaleString()}
            </TooltipContent>
          </Tooltip>
        );
      },
    }),
    columnHelper.display({
      id: "actions",
      header: "",
      cell: (info) => {
        const rel = info.row.original;
        if (!actions.canEdit && !actions.canDelete) return null;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon-sm" />}
            >
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {actions.canEdit && (
                <DropdownMenuItem onClick={() => actions.onEdit(rel)}>
                  <Pencil className="size-4" />
                  {m.relationship_edit_title()}
                </DropdownMenuItem>
              )}
              {actions.canEdit && actions.canDelete && <DropdownMenuSeparator />}
              {actions.canDelete && (
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => actions.onDelete(rel)}
                >
                  <Trash2 className="size-4" />
                  {m.relationship_delete_title()}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    }),
  ];
}
