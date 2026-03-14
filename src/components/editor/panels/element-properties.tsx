import { useCallback, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { useEditorStore } from "#/stores/editor-store";
import { getElementById, updateElement, addLink, removeLink } from "#/lib/element.functions";
import { getTechnologies, addElementTechnology, removeElementTechnology, setElementIconTechnology } from "#/lib/technology.functions";
import { getTags, addElementTag, removeElementTag } from "#/lib/tag.functions";
import { getGroups, addGroupMembership, removeGroupMembership } from "#/lib/group.functions";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Textarea } from "#/components/ui/textarea";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Switch } from "#/components/ui/switch";
import { Separator } from "#/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "#/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { ScrollArea } from "#/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "#/components/ui/collapsible";
import { TechIcon } from "#/components/technologies/tech-icon";
import { StatusDot } from "#/components/editor/nodes/status-dot";
import {
  X, Plus, ExternalLink, BookOpen, History, Tag, Layers, Check,
  Box, Package, Cpu, Database, User,
  MoreHorizontal, ImageIcon, Trash2, ChevronDown,
} from "lucide-react";
import { m } from "#/paraglide/messages";
import { ElementConnections } from "./element-connections";
import type { ElementStatus } from "#/lib/element.validators";
import type { AppNode } from "#/lib/types/diagram-nodes";

interface ElementDetails {
  id: string;
  parentElementId: string | null;
  description: string | null;
  iconTechnologyId: string | null;
  technologies: Array<{ technologyId: string; name: string; iconSlug: string | null }>;
  links: Array<{ id: string; url: string; label: string | null }>;
  tags?: Array<{ tagId: string }>;
  groupMemberships?: Array<{ groupId: string }>;
}

const STATUS_OPTIONS: { value: ElementStatus; label: () => string }[] = [
  { value: "planned", label: () => m.element_status_planned() },
  { value: "live", label: () => m.element_status_live() },
  { value: "deprecated", label: () => m.element_status_deprecated() },
];

function getNodeTypeIcon(type: string | undefined) {
  switch (type) {
    case "system": return <Box className="size-10 shrink-0 text-foreground" />;
    case "app": return <Package className="size-10 shrink-0 text-foreground" />;
    case "component": return <Cpu className="size-10 shrink-0 text-foreground" />;
    case "store": return <Database className="size-10 shrink-0 text-foreground" />;
    case "actor": return <User className="size-10 shrink-0 text-foreground" />;
    default: return <Box className="size-10 shrink-0 text-foreground" />;
  }
}

export function ElementProperties({ node }: { node: AppNode }) {
  const workspaceId = useEditorStore((s) => s.workspaceId);
  const updateNodeData = useEditorStore((s) => s.updateNodeData);
  const queryClient = useQueryClient();

  const getElementByIdFn = useServerFn(getElementById);
  const updateElementFn = useServerFn(updateElement);

  const { data: element } = useQuery<ElementDetails>({
    queryKey: ["element", node.data.elementId],
    queryFn: async () => (await getElementByIdFn({ data: { id: node.data.elementId } })) as ElementDetails,
  });

  const [name, setName] = useState(node.data.name);
  const [displayDescription, setDisplayDescription] = useState(
    node.data.displayDescription ?? "",
  );
  const [description, setDescription] = useState("");

  useEffect(() => {
    setName(node.data.name);
    setDisplayDescription(node.data.displayDescription ?? "");
  }, [node.data.name, node.data.displayDescription]);

  useEffect(() => {
    if (element) {
      setDescription(element.description ?? "");
    }
  }, [element]);

  const saveField = useCallback(
    async (field: string, value: unknown) => {
      try {
        await updateElementFn({
          data: { id: node.data.elementId, [field]: value },
        });
        queryClient.invalidateQueries({ queryKey: ["element", node.data.elementId] });
      } catch {
        toast.error(m.editor_panel_save_failed());
      }
    },
    [node.data.elementId, updateElementFn, queryClient],
  );

  const handleNameBlur = useCallback(async () => {
    if (name === node.data.name) return;
    await saveField("name", name);
    updateNodeData(node.id, { name });
  }, [name, node.data.name, node.id, saveField, updateNodeData]);

  const handleDisplayDescriptionBlur = useCallback(async () => {
    if (displayDescription === (node.data.displayDescription ?? "")) return;
    await saveField("displayDescription", displayDescription || null);
    updateNodeData(node.id, { displayDescription: displayDescription || null });
  }, [displayDescription, node.data.displayDescription, node.id, saveField, updateNodeData]);

  const handleDescriptionBlur = useCallback(async () => {
    if (!element || description === (element.description ?? "")) return;
    await saveField("description", description || null);
  }, [description, element, saveField]);

  const handleExternalChange = useCallback(
    async (external: boolean) => {
      await saveField("external", external);
      updateNodeData(node.id, { external });
    },
    [node.id, saveField, updateNodeData],
  );

  const handleStatusChange = useCallback(
    (status: string | null) => {
      if (!status) return;
      void saveField("status", status);
      updateNodeData(node.id, { status: status as ElementStatus });
    },
    [node.id, saveField, updateNodeData],
  );

  return (
    <div className="flex h-full flex-col">
      {/* Header: Icon + Name */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        {node.type !== "actor" && (
          <div className="shrink-0 rounded-lg border bg-muted/50 p-1.5">
            {node.data.iconTechSlug ? (
              <TechIcon
                slug={node.data.iconTechSlug}
                className="size-10"
                fallback={getNodeTypeIcon(node.type)}
              />
            ) : (
              getNodeTypeIcon(node.type)
            )}
          </div>
        )}
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={handleNameBlur}
          className="h-auto border-none bg-transparent p-0 text-sm font-medium shadow-none focus-visible:ring-0"
        />
      </div>

      {/* Display description */}
      <div className="px-4 pb-2">
        <Textarea
          value={displayDescription}
          onChange={(e) => setDisplayDescription(e.target.value)}
          onBlur={handleDisplayDescriptionBlur}
          maxLength={120}
          rows={2}
          placeholder={m.element_placeholder_display_description()}
          className="resize-none border-none bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="details" className="flex flex-1 flex-col">
        <TabsList className="mx-4 grid w-auto grid-cols-2">
          <TabsTrigger value="details">{m.editor_panel_element_details()}</TabsTrigger>
          <TabsTrigger value="connections">{m.editor_panel_element_connections()}</TabsTrigger>
        </TabsList>
        <TabsContent value="details" className="flex-1 overflow-y-auto">
          <div className="flex flex-col">
            {/* Property rows */}
            <PropertyRow label={m.element_label_type()}>
              <Badge variant="outline">{node.type}</Badge>
            </PropertyRow>

            <PropertyRow label={m.element_label_external()}>
              <Switch
                checked={node.data.external}
                onCheckedChange={handleExternalChange}
              />
            </PropertyRow>

            <PropertyRow label={m.element_label_status()}>
              <Select value={node.data.status} onValueChange={handleStatusChange}>
                <SelectTrigger className="h-7 w-auto border-none bg-transparent shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2">
                        <StatusDot status={opt.value} />
                        {opt.label()}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </PropertyRow>

            {element?.parentElementId && (
              <PropertyRow label={m.element_label_parent()}>
                <span className="text-sm">{element.parentElementId}</span>
              </PropertyRow>
            )}

            <Separator />

            {/* Technologies */}
            {element && (
              <>
                <TechnologiesSection
                  elementId={element.id}
                  workspaceId={workspaceId}
                  technologies={element.technologies}
                  iconTechnologyId={element.iconTechnologyId}
                  nodeId={node.id}
                  updateNodeData={updateNodeData}
                />
                <Separator />
                <TagsSection elementId={element.id} workspaceId={workspaceId} />
                <Separator />
                <GroupsSection elementId={element.id} workspaceId={workspaceId} />
                <Separator />
                <LinksSection elementId={element.id} links={element.links} />
                <Separator />
              </>
            )}

            {/* Full description */}
            <div className="space-y-2 p-4">
              <Label className="text-xs text-muted-foreground">
                {m.element_label_description()}
              </Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={handleDescriptionBlur}
                rows={4}
                placeholder={m.element_placeholder_description()}
              />
            </div>
          </div>
        </TabsContent>
        <TabsContent value="connections" className="flex-1 overflow-y-auto">
          <ElementConnections elementId={node.data.elementId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ── Property Row ─────────────────────────────────────────────────── */

function PropertyRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-10 items-center gap-2 px-4 py-1.5">
      <span className="w-24 shrink-0 text-sm text-muted-foreground">{label}</span>
      <div className="flex min-w-0 flex-1 items-center">{children}</div>
    </div>
  );
}

/* ── Technologies Section ─────────────────────────────────────────── */

function TechnologiesSection({
  elementId,
  workspaceId,
  technologies,
  iconTechnologyId,
  nodeId,
  updateNodeData,
}: {
  elementId: string;
  workspaceId: string | null;
  technologies: Array<{ technologyId: string; name: string; iconSlug: string | null }>;
  iconTechnologyId: string | null;
  nodeId: string;
  updateNodeData: (nodeId: string, data: Record<string, unknown>) => void;
}) {
  const queryClient = useQueryClient();
  const getTechnologiesFn = useServerFn(getTechnologies);
  const addElementTechnologyFn = useServerFn(addElementTechnology);
  const removeElementTechnologyFn = useServerFn(removeElementTechnology);
  const setElementIconTechnologyFn = useServerFn(setElementIconTechnology);

  const { data: allTechs } = useQuery({
    queryKey: ["technologies", workspaceId],
    queryFn: () => getTechnologiesFn({ data: { workspaceId: workspaceId! } }),
    enabled: !!workspaceId,
  });

  const assignedIds = new Set(technologies.map((t) => t.technologyId));

  const handleToggle = useCallback(
    async (technologyId: string) => {
      try {
        if (assignedIds.has(technologyId)) {
          // Clear icon first if removing the icon technology
          if (iconTechnologyId === technologyId) {
            await setElementIconTechnologyFn({ data: { elementId, technologyId: null } });
            updateNodeData(nodeId, { iconTechSlug: null });
          }
          await removeElementTechnologyFn({ data: { elementId, technologyId } });
          const updatedTechs = technologies.filter((t) => t.technologyId !== technologyId).map((t) => t.name);
          updateNodeData(nodeId, { technologies: updatedTechs });
        } else {
          await addElementTechnologyFn({ data: { elementId, technologyId } });
          const addedTech = allTechs?.find((t) => t.id === technologyId);
          if (addedTech) {
            const updatedTechs = [...technologies.map((t) => t.name), addedTech.name];
            updateNodeData(nodeId, { technologies: updatedTechs });
          }
        }
        queryClient.invalidateQueries({ queryKey: ["element", elementId] });
      } catch {
        toast.error(m.editor_panel_save_failed());
      }
    },
    [elementId, assignedIds, addElementTechnologyFn, removeElementTechnologyFn, setElementIconTechnologyFn, queryClient, technologies, nodeId, updateNodeData, allTechs, iconTechnologyId],
  );

  const handleSetIcon = useCallback(
    async (technologyId: string | null) => {
      try {
        await setElementIconTechnologyFn({ data: { elementId, technologyId } });
        // Update canvas node icon
        const tech = technologyId ? technologies.find((t) => t.technologyId === technologyId) : null;
        updateNodeData(nodeId, { iconTechSlug: tech?.iconSlug ?? null });
        queryClient.invalidateQueries({ queryKey: ["element", elementId] });
      } catch {
        toast.error(m.editor_panel_save_failed());
      }
    },
    [elementId, setElementIconTechnologyFn, queryClient, technologies, nodeId, updateNodeData],
  );

  return (
    <div className="py-2">
      <div className="flex items-center justify-between px-4 py-1.5">
        <span className="text-xs text-muted-foreground">
          {m.element_label_technologies()}
        </span>
      </div>

      <div className="space-y-2 px-4">
        {technologies.map((tech) => {
          const full = allTechs?.find((t) => t.id === tech.technologyId);
          return (
            <TechnologyCard
              key={tech.technologyId}
              tech={tech}
              isIcon={iconTechnologyId === tech.technologyId}
              onRemove={() => handleToggle(tech.technologyId)}
              onSetIcon={() =>
                handleSetIcon(
                  iconTechnologyId === tech.technologyId ? null : tech.technologyId,
                )
              }
              details={full ? {
                description: full.description,
                website: full.website,
                docsUrl: full.docsUrl,
                updatesUrl: full.updatesUrl,
              } : undefined}
            />
          );
        })}

        <Popover>
          <PopoverTrigger render={
            <Button variant="outline" size="sm" className="w-full justify-start gap-2">
              <Plus className="size-3.5" />
              {m.technology_picker_title()}
            </Button>
          } />
          <PopoverContent className="w-56 p-0" align="start">
            <ScrollArea className="max-h-48">
              <div className="p-1">
                {allTechs?.map((tech) => (
                  <button
                    key={tech.id}
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                    onClick={() => handleToggle(tech.id)}
                  >
                    {tech.iconSlug && (
                      <TechIcon slug={tech.iconSlug} className="size-4 shrink-0" />
                    )}
                    <span
                      className={`flex size-4 items-center justify-center rounded-sm border ${assignedIds.has(tech.id) ? "border-primary bg-primary text-primary-foreground" : ""}`}
                    >
                      {assignedIds.has(tech.id) && <Check className="size-3" />}
                    </span>
                    <span className="flex-1 text-left">{tech.name}</span>
                  </button>
                ))}
                {(!allTechs || allTechs.length === 0) && (
                  <p className="px-2 py-3 text-center text-sm text-muted-foreground">
                    {m.technology_picker_empty()}
                  </p>
                )}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

/* ── Technology Card ──────────────────────────────────────────────── */

function TechnologyCard({
  tech,
  isIcon,
  onRemove,
  onSetIcon,
  details,
}: {
  tech: { technologyId: string; name: string; iconSlug: string | null };
  isIcon: boolean;
  onRemove: () => void;
  onSetIcon: () => void;
  details?: { description: string | null; website: string | null; docsUrl: string | null; updatesUrl: string | null };
}) {
  return (
    <Collapsible>
      <div className="relative overflow-hidden rounded-lg border bg-muted/20">
        {/* Header row */}
        <div className="flex items-center gap-2 p-2">
          {tech.iconSlug && (
            <TechIcon slug={tech.iconSlug} className="size-4 shrink-0" />
          )}
          <span className="min-w-0 flex-1 truncate text-sm">{tech.name}</span>
          {isIcon && (
            <Badge variant="secondary" className="shrink-0 text-[10px]">
              {m.technology_icon_label()}
            </Badge>
          )}
          <CollapsibleTrigger render={
            <button type="button" className="shrink-0 rounded-sm p-0.5 hover:bg-muted">
              <ChevronDown className="size-3.5 transition-transform group-data-panel-open/button:rotate-180" />
            </button>
          } />
          <DropdownMenu>
            <DropdownMenuTrigger render={
              <button
                type="button"
                className="shrink-0 rounded-sm p-0.5 hover:bg-muted"
              >
                <MoreHorizontal className="size-3.5" />
              </button>
            } />
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onSetIcon}>
                <ImageIcon className="mr-2 size-4" />
                {isIcon ? m.technology_clear_icon() : m.technology_set_as_icon()}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onRemove}>
                <Trash2 className="mr-2 size-4" />
                {m.common_remove()}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Expanded content */}
        <CollapsibleContent className="px-2 pb-2">
          <div className="flex flex-col gap-1.5">
            {(details?.website || details?.docsUrl || details?.updatesUrl) && (
              <div className="-ml-1 flex flex-wrap items-center gap-1">
                {details.website && (
                  <a href={details.website} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="sm" className="h-6 gap-1 px-2 text-xs">
                      <ExternalLink className="size-3" /> {m.technology_label_website()}
                    </Button>
                  </a>
                )}
                {details.docsUrl && (
                  <a href={details.docsUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="sm" className="h-6 gap-1 px-2 text-xs">
                      <BookOpen className="size-3" /> {m.technology_label_docs_url()}
                    </Button>
                  </a>
                )}
                {details.updatesUrl && (
                  <a href={details.updatesUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="sm" className="h-6 gap-1 px-2 text-xs">
                      <History className="size-3" /> {m.technology_label_updates_url()}
                    </Button>
                  </a>
                )}
              </div>
            )}
            {details?.description && (
              <p className="text-xs leading-snug text-muted-foreground">{details.description}</p>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

/* ── Tags Section ─────────────────────────────────────────────────── */

function TagsSection({
  elementId,
  workspaceId,
}: {
  elementId: string;
  workspaceId: string | null;
}) {
  const queryClient = useQueryClient();
  const getTagsFn = useServerFn(getTags);
  const addElementTagFn = useServerFn(addElementTag);
  const removeElementTagFn = useServerFn(removeElementTag);
  const getElementByIdFn = useServerFn(getElementById);

  const { data: allTags } = useQuery({
    queryKey: ["tags", workspaceId],
    queryFn: () => getTagsFn({ data: { workspaceId: workspaceId! } }),
    enabled: !!workspaceId,
  });

  const { data: element } = useQuery({
    queryKey: ["element", elementId],
    queryFn: () => getElementByIdFn({ data: { id: elementId } }),
  });

  const elementTagIds = new Set(
    (element as { tags?: Array<{ tagId: string }> })?.tags?.map((t) => t.tagId) ?? [],
  );

  const handleToggleTag = useCallback(
    async (tagId: string) => {
      try {
        if (elementTagIds.has(tagId)) {
          await removeElementTagFn({ data: { elementId, tagId } });
        } else {
          await addElementTagFn({ data: { elementId, tagId } });
        }
        queryClient.invalidateQueries({ queryKey: ["element", elementId] });
      } catch {
        toast.error(m.editor_panel_save_failed());
      }
    },
    [elementId, elementTagIds, addElementTagFn, removeElementTagFn, queryClient],
  );

  if (!allTags?.length) return null;

  return (
    <div className="py-2">
      <div className="px-4 py-1.5">
        <span className="text-xs text-muted-foreground">{m.tag_picker_title()}</span>
      </div>
      <div className="px-4">
        <Popover>
          <PopoverTrigger render={
            <Button variant="outline" size="sm" className="w-full justify-start gap-2">
              <Tag className="size-3.5" />
              {m.tag_picker_title()}
            </Button>
          } />
          <PopoverContent className="w-56 p-0" align="start">
            <ScrollArea className="max-h-48">
              <div className="p-1">
                {allTags.map((tag) => (
                  <button
                    key={tag.id}
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                    onClick={() => handleToggleTag(tag.id)}
                  >
                    <div
                      className="size-3 rounded-full"
                      style={{ backgroundColor: tag.color ?? undefined }}
                    />
                    <span className="flex-1 text-left">{tag.name}</span>
                    {elementTagIds.has(tag.id) && (
                      <span className="text-xs text-primary">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

/* ── Groups Section ───────────────────────────────────────────────── */

function GroupsSection({
  elementId,
  workspaceId,
}: {
  elementId: string;
  workspaceId: string | null;
}) {
  const queryClient = useQueryClient();
  const getGroupsFn = useServerFn(getGroups);
  const addGroupMembershipFn = useServerFn(addGroupMembership);
  const removeGroupMembershipFn = useServerFn(removeGroupMembership);
  const getElementByIdFn = useServerFn(getElementById);

  const { data: allGroups } = useQuery({
    queryKey: ["groups", workspaceId],
    queryFn: () => getGroupsFn({ data: { workspaceId: workspaceId! } }),
    enabled: !!workspaceId,
  });

  const { data: element } = useQuery({
    queryKey: ["element", elementId],
    queryFn: () => getElementByIdFn({ data: { id: elementId } }),
  });

  const elementGroupIds = new Set(
    (element as { groupMemberships?: Array<{ groupId: string }> })?.groupMemberships?.map((g) => g.groupId) ?? [],
  );

  const handleToggleGroup = useCallback(
    async (groupId: string) => {
      try {
        if (elementGroupIds.has(groupId)) {
          await removeGroupMembershipFn({ data: { elementId, groupId } });
        } else {
          await addGroupMembershipFn({ data: { elementId, groupId } });
        }
        queryClient.invalidateQueries({ queryKey: ["element", elementId] });
      } catch {
        toast.error(m.editor_panel_save_failed());
      }
    },
    [elementId, elementGroupIds, addGroupMembershipFn, removeGroupMembershipFn, queryClient],
  );

  if (!allGroups?.length) return null;

  return (
    <div className="py-2">
      <div className="px-4 py-1.5">
        <span className="text-xs text-muted-foreground">{m.group_picker_title()}</span>
      </div>
      <div className="px-4">
        <Popover>
          <PopoverTrigger render={
            <Button variant="outline" size="sm" className="w-full justify-start gap-2">
              <Layers className="size-3.5" />
              {m.group_picker_title()}
            </Button>
          } />
          <PopoverContent className="w-56 p-0" align="start">
            <ScrollArea className="max-h-48">
              <div className="p-1">
                {allGroups.map((g) => (
                  <button
                    key={g.id}
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                    onClick={() => handleToggleGroup(g.id)}
                  >
                    <div
                      className="size-3 rounded-full"
                      style={{ backgroundColor: g.color ?? undefined }}
                    />
                    <span className="flex-1 text-left">{g.name}</span>
                    {elementGroupIds.has(g.id) && (
                      <span className="text-xs text-primary">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

/* ── Links Section ────────────────────────────────────────────────── */

function LinksSection({
  elementId,
  links,
}: {
  elementId: string;
  links: Array<{ id: string; url: string; label: string | null }>;
}) {
  const [newUrl, setNewUrl] = useState("");
  const queryClient = useQueryClient();
  const addLinkFn = useServerFn(addLink);
  const removeLinkFn = useServerFn(removeLink);

  const handleAdd = useCallback(async () => {
    if (!newUrl.trim()) return;
    try {
      await addLinkFn({ data: { elementId, url: newUrl.trim() } });
      queryClient.invalidateQueries({ queryKey: ["element", elementId] });
      setNewUrl("");
    } catch {
      toast.error(m.editor_panel_save_failed());
    }
  }, [newUrl, elementId, addLinkFn, queryClient]);

  const handleRemove = useCallback(
    async (id: string) => {
      try {
        await removeLinkFn({ data: { id } });
        queryClient.invalidateQueries({ queryKey: ["element", elementId] });
      } catch {
        toast.error(m.editor_panel_save_failed());
      }
    },
    [elementId, removeLinkFn, queryClient],
  );

  return (
    <div className="py-2">
      <div className="px-4 py-1.5">
        <span className="text-xs text-muted-foreground">{m.element_label_links()}</span>
      </div>
      <div className="space-y-1 px-4">
        {links.map((link) => (
          <div key={link.id} className="flex items-center gap-1 text-sm">
            <ExternalLink className="size-3 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1 truncate">{link.label || link.url}</span>
            <button
              onClick={() => handleRemove(link.id)}
              className="shrink-0 rounded-sm p-0.5 hover:bg-muted"
            >
              <X className="size-3" />
            </button>
          </div>
        ))}
        <div className="flex gap-1">
          <Input
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder={m.element_link_placeholder_url()}
            className="h-8 text-sm"
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <Button size="sm" variant="outline" onClick={handleAdd} className="h-8 shrink-0">
            <Plus className="size-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
