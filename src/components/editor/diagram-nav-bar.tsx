import { Link } from "@tanstack/react-router";
import { Panel } from "@xyflow/react";
import {
  FolderOpen,
  ChevronDown,
  User,
  Box,
  Package,
  Database,
  Cpu,
} from "lucide-react";
import { Badge } from "#/components/ui/badge";
import { Separator } from "#/components/ui/separator";
import { SidebarTrigger } from "#/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "#/components/ui/tooltip";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "#/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { m } from "#/paraglide/messages";
import type { AncestrySegment } from "#/lib/diagram.validators";
import type { DiagramType } from "#/lib/diagram.validators";

const ELEMENT_TYPE_ICONS: Record<string, typeof User> = {
  actor: User,
  system: Box,
  app: Package,
  store: Database,
  component: Cpu,
};

const DIAGRAM_TYPE_ICONS: Record<DiagramType, typeof Box> = {
  system_context: Box,
  container: Package,
  component: Cpu,
};

export interface DiagramNavBarProps {
  workspaceSlug: string;
  workspaceName: string;
  currentDiagramId: string;
  currentDiagramName: string;
  currentDiagramType: DiagramType;
  ancestry: AncestrySegment[];
  readOnly: boolean;
}

export function DiagramNavBar({
  workspaceSlug,
  workspaceName,
  currentDiagramId,
  currentDiagramName,
  currentDiagramType,
  ancestry,
  readOnly,
}: DiagramNavBarProps) {
  const CurrentDiagramIcon = DIAGRAM_TYPE_ICONS[currentDiagramType] ?? Box;

  return (
    <Panel position="top-left">
      <div className="flex items-center gap-1 rounded-xl border bg-card/80 px-1.5 py-1 shadow-sm backdrop-blur-sm">
        <Tooltip>
          <TooltipTrigger render={<SidebarTrigger className="size-7" />} />
          <TooltipContent side="bottom" className="text-xs">
            {m.editor_nav_toggle_sidebar()}
          </TooltipContent>
        </Tooltip>

        <Separator
          orientation="vertical"
          className="mx-0.5 data-[orientation=vertical]:h-4"
        />

        <Breadcrumb>
          <BreadcrumbList>
            {/* Workspace link */}
            <BreadcrumbItem className="hidden md:flex">
              <BreadcrumbLink
                render={
                  <Link
                    to="/workspace/$workspaceSlug"
                    params={{ workspaceSlug }}
                  />
                }
              >
                <FolderOpen className="mr-1 inline size-3.5" />
                {workspaceName}
              </BreadcrumbLink>
            </BreadcrumbItem>

            {/* Ancestor segments with dropdown */}
            {ancestry.map((segment) => {
              const DiagramIcon =
                DIAGRAM_TYPE_ICONS[segment.diagramType as DiagramType] ?? Box;
              return (
                <BreadcrumbItem
                  key={segment.diagramId}
                  className="hidden md:flex"
                >
                  <BreadcrumbSeparator />
                  <DropdownMenu>
                    <DropdownMenuTrigger className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                      <DiagramIcon className="size-3.5" />
                      {segment.diagramName}
                      <ChevronDown className="size-3" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="min-w-56">
                      {Object.entries(
                        segment.siblings
                          .filter((s) => s.deeperDiagramId)
                          .reduce<
                            Record<
                              string,
                              (typeof segment.siblings)[number][]
                            >
                          >((groups, sibling) => {
                            const key = sibling.deeperDiagramName ?? "";
                            ;(groups[key] ??= []).push(sibling);
                            return groups;
                          }, {}),
                      ).map(([diagramName, items]) => (
                        <DropdownMenuGroup key={diagramName}>
                          <DropdownMenuLabel>
                            {diagramName}
                          </DropdownMenuLabel>
                          {items.map((sibling) => {
                            const SibIcon =
                              ELEMENT_TYPE_ICONS[sibling.elementType] ?? Box;
                            const isCurrent =
                              sibling.deeperDiagramId === currentDiagramId;
                            return (
                              <DropdownMenuItem
                                key={sibling.elementId}
                                className={isCurrent ? "bg-accent" : ""}
                                render={
                                  <Link
                                    to="/workspace/$workspaceSlug/diagram/$diagramId"
                                    params={{
                                      workspaceSlug,
                                      diagramId: sibling.deeperDiagramId!,
                                    }}
                                  />
                                }
                              >
                                <SibIcon className="mr-2 size-4 shrink-0" />
                                <span className="truncate">
                                  {sibling.elementName}
                                </span>
                              </DropdownMenuItem>
                            );
                          })}
                        </DropdownMenuGroup>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </BreadcrumbItem>
              );
            })}

            {/* Current diagram */}
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage className="flex items-center gap-1">
                <CurrentDiagramIcon className="size-3.5" />
                {currentDiagramName}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {readOnly && (
          <>
            <Separator
              orientation="vertical"
              className="mx-0.5 data-[orientation=vertical]:h-4"
            />
            <Badge variant="secondary" className="text-xs">
              {m.canvas_readonly()}
            </Badge>
          </>
        )}
      </div>
    </Panel>
  );
}
