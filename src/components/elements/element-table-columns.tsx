import {createColumnHelper} from "@tanstack/react-table";
import {Badge} from "#/components/ui/badge";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "#/components/ui/tooltip";
import {Button} from "#/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import {MoreHorizontal, Pencil, Trash2, User, Layers, Server, Package, Database, Cpu} from "lucide-react";
import {formatRelativeDate} from "#/lib/admin.utils";
import {m} from "#/paraglide/messages";
import type {ElementType, ElementStatus} from "#/lib/element.validators";
import {TagBadge} from "#/components/tags/tag-badge";

export interface ElementRow {
    id: string;
    name: string;
    elementType: ElementType;
    status: ElementStatus;
    displayDescription: string | null;
    external: boolean;
    parentElementId: string | null;
    updatedAt: string | Date;
    technologies: { id: string; name: string; iconSlug: string | null }[];
    links: { id: string; url: string; label: string | null }[];
    tags: { id: string; name: string; color: string; icon: string | null }[];
      groups?: { id: string; name: string }[];
}

export interface ElementTableActions {
    onEdit: (element: ElementRow) => void;
    onDelete: (element: ElementRow) => void;
    canEdit: boolean;
    canDelete: boolean;
    parentNameMap: Map<string, string>;
}

const TYPE_ICONS: Record<ElementType, typeof User> = {
    actor: User,
    group: Layers,
    system: Server,
    app: Package,
    store: Database,
    component: Cpu,
};

const TYPE_LABELS: Record<ElementType, () => string> = {
    actor: () => m.element_type_person(),
  group: () => m.element_type_system(),
    system: () => m.element_type_system(),
    app: () => m.element_type_container(),
    store: () => m.element_type_container(),
    component: () => m.element_type_component(),
};

const STATUS_COLORS: Record<ElementStatus, string> = {
    planned: "text-blue-600 bg-blue-100 dark:bg-blue-900/30",
    live: "text-green-600 bg-green-100 dark:bg-green-900/30",
    deprecated: "text-red-600 bg-red-100 dark:bg-red-900/30",
};

const STATUS_LABELS: Record<ElementStatus, () => string> = {
    planned: () => m.element_status_planned(),
    live: () => m.element_status_live(),
    deprecated: () => m.element_status_deprecated(),
};

const columnHelper = createColumnHelper<ElementRow>();

export function getElementColumns(actions: ElementTableActions) {
    return [
        columnHelper.accessor("name", {
            header: m.element_column_name(),
            enableSorting: true,
            cell: (info) => {
                const el = info.row.original;
                const Icon = TYPE_ICONS[el.elementType];
                return (
                    <div className="flex items-center gap-2">
                        <Icon className="size-4 shrink-0 text-muted-foreground"/>
                        <span className="text-sm font-medium">{el.name}</span>
                    </div>
                );
            },
        }),
        columnHelper.accessor("elementType", {
            header: m.element_column_type(),
            enableSorting: true,
            cell: (info) => {
                const type = info.getValue();
                return <Badge variant="secondary">{TYPE_LABELS[type]()}</Badge>;
            },
        }),
        columnHelper.accessor("status", {
            header: m.element_column_status(),
            enableSorting: true,
            cell: (info) => {
                const status = info.getValue();
                return (
                    <Badge variant="outline" className={STATUS_COLORS[status]}>
                        {STATUS_LABELS[status]()}
                    </Badge>
                );
            },
        }),
        columnHelper.accessor("technologies", {
            header: m.element_column_technologies(),
            enableSorting: false,
            cell: (info) => {
                const techs = info.getValue();
                if (techs.length === 0) return <span className="text-muted-foreground">—</span>;
                const visible = techs.slice(0, 3);
                const remaining = techs.length - visible.length;
                return (
                    <div className="flex flex-wrap gap-1">
                        {visible.map((t) => (
                            <Badge key={t.id} variant="secondary" className="text-xs">
                                {t.name}
                            </Badge>
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
        columnHelper.accessor("tags", {
            header: m.element_column_tags(),
            enableSorting: false,
            cell: (info) => {
                const tags = info.getValue();
                if (!tags || tags.length === 0) return <span className="text-muted-foreground">—</span>;
                const visible = tags.slice(0, 3);
                const remaining = tags.length - visible.length;
                return (
                    <div className="flex flex-wrap gap-1">
                        {visible.map((t) => (
                            <TagBadge key={t.id} name={t.name} color={t.color} icon={t.icon}/>
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
        columnHelper.accessor("parentElementId", {
            header: m.element_column_parent(),
            enableSorting: false,
            cell: (info) => {
                const parentId = info.getValue();
                if (!parentId) return <span className="text-muted-foreground">—</span>;
                const parentName = actions.parentNameMap.get(parentId);
                return <span className="text-sm">{parentName ?? "—"}</span>;
            },
        }),
        columnHelper.accessor("external", {
            header: m.element_column_external(),
            enableSorting: true,
            cell: (info) => {
                const ext = info.getValue();
                if (!ext) return null;
                return <Badge variant="outline">{m.element_label_external()}</Badge>;
            },
        }),
        columnHelper.accessor("updatedAt", {
            header: m.element_column_updated(),
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
                const el = info.row.original;
                if (!actions.canEdit && !actions.canDelete) return null;

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger
                            render={<Button variant="ghost" size="icon-sm"/>}
                        >
                            <MoreHorizontal className="size-4"/>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {actions.canEdit && (
                                <DropdownMenuItem onClick={() => actions.onEdit(el)}>
                                    <Pencil className="size-4"/>
                                    {m.element_edit_title()}
                                </DropdownMenuItem>
                            )}
                            {actions.canEdit && actions.canDelete && <DropdownMenuSeparator/>}
                            {actions.canDelete && (
                                <DropdownMenuItem
                                    variant="destructive"
                                    onClick={() => actions.onDelete(el)}
                                >
                                    <Trash2 className="size-4"/>
                                    {m.element_delete_title()}
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        }),
    ];
}
