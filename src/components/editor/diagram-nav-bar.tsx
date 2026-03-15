import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "#/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "#/components/ui/command";
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

            {/* Ancestor segments with searchable popover */}
            {ancestry.map((segment) => (
              <AncestorSegment
                key={segment.diagramId}
                segment={segment}
                workspaceSlug={workspaceSlug}
                currentDiagramId={currentDiagramId}
              />
            ))}

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

function AncestorSegment({
  segment,
  workspaceSlug,
  currentDiagramId,
}: {
  segment: AncestrySegment;
  workspaceSlug: string;
  currentDiagramId: string;
}) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const DiagramIcon =
    DIAGRAM_TYPE_ICONS[segment.diagramType as DiagramType] ?? Box;

  const drillableSiblings = segment.siblings.filter((s) => s.deeperDiagramId);
  const grouped = drillableSiblings.reduce<
    Record<string, (typeof segment.siblings)[number][]>
  >((groups, sibling) => {
    const key = sibling.deeperDiagramName ?? "";
    (groups[key] ??= []).push(sibling);
    return groups;
  }, {});

  return (
    <BreadcrumbItem className="hidden md:flex">
      <BreadcrumbSeparator />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <DiagramIcon className="size-3.5" />
          {segment.diagramName}
          <ChevronDown className="size-3" />
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="start" sideOffset={8}>
          <Command>
            <CommandInput placeholder={m.diagram_search_placeholder()} />
            <CommandList>
              <CommandEmpty>{m.diagram_empty()}</CommandEmpty>
              {Object.entries(grouped).map(([diagramName, items]) => (
                <CommandGroup key={diagramName} heading={diagramName}>
                  {items.map((sibling) => {
                    const SibIcon =
                      ELEMENT_TYPE_ICONS[sibling.elementType] ?? Box;
                    const isCurrent =
                      sibling.deeperDiagramId === currentDiagramId;
                    return (
                      <CommandItem
                        key={sibling.elementId}
                        value={`${sibling.elementName} ${sibling.deeperDiagramName}`}
                        data-checked={isCurrent || undefined}
                        onSelect={() => {
                          setOpen(false);
                          void navigate({
                            to: "/workspace/$workspaceSlug/diagram/$diagramId",
                            params: {
                              workspaceSlug,
                              diagramId: sibling.deeperDiagramId!,
                            },
                          });
                        }}
                      >
                        <SibIcon className="size-4 shrink-0" />
                        <span className="truncate">{sibling.elementName}</span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </BreadcrumbItem>
  );
}
