import { useCallback, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { useEditorStore } from "#/stores/editor-store";
import { getElementById, updateElement, addTechnology, removeTechnology, addLink, removeLink } from "#/lib/element.functions";
import { getTags, addElementTag, removeElementTag } from "#/lib/tag.functions";
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
import { ScrollArea } from "#/components/ui/scroll-area";
import { StatusDot } from "#/components/editor/nodes/status-dot";
import { X, Plus, ExternalLink, Tag } from "lucide-react";
import { m } from "#/paraglide/messages";
import { ElementConnections } from "./element-connections";
import type { ElementStatus } from "#/lib/element.validators";
import type { AppNode } from "#/lib/types/diagram-nodes";

interface ElementDetails {
  id: string;
  parentElementId: string | null;
  description: string | null;
  technologies: Array<{ id: string; name: string; iconSlug: string | null }>;
  links: Array<{ id: string; url: string; label: string | null }>;
  tags?: Array<{ tagId: string }>;
}

const STATUS_OPTIONS: { value: ElementStatus; label: () => string }[] = [
  { value: "planned", label: () => m.element_status_planned() },
  { value: "live", label: () => m.element_status_live() },
  { value: "deprecated", label: () => m.element_status_deprecated() },
];

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
    <Tabs defaultValue="details" className="flex h-full flex-col">
      <TabsList className="mx-4 mt-3 grid w-auto grid-cols-2">
        <TabsTrigger value="details">{m.editor_panel_element_details()}</TabsTrigger>
        <TabsTrigger value="connections">{m.editor_panel_element_connections()}</TabsTrigger>
      </TabsList>
      <TabsContent value="details" className="flex-1 overflow-y-auto">
        <div className="space-y-4 p-4">
          <div className="space-y-2">
            <Label>{m.element_label_name()}</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={handleNameBlur}
            />
          </div>

          <div className="space-y-2">
            <Label>{m.element_label_display_description()}</Label>
            <Textarea
              value={displayDescription}
              onChange={(e) => setDisplayDescription(e.target.value)}
              onBlur={handleDisplayDescriptionBlur}
              maxLength={120}
              rows={2}
              placeholder={m.element_placeholder_display_description()}
            />
            <p className="text-xs text-muted-foreground">
              {m.element_hint_display_description_count({
                count: displayDescription.length,
              })}
            </p>
          </div>

          <div className="space-y-2">
            <Label>{m.element_label_type()}</Label>
            <div>
              <Badge variant="outline">{node.type}</Badge>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label>{m.element_label_external()}</Label>
            <Switch
              checked={node.data.external}
              onCheckedChange={handleExternalChange}
            />
          </div>

          {element?.parentElementId && (
            <div className="space-y-2">
              <Label>{m.element_label_parent()}</Label>
              <p className="text-sm text-muted-foreground">{element.parentElementId}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label>{m.element_label_status()}</Label>
            <Select value={node.data.status} onValueChange={handleStatusChange}>
              <SelectTrigger>
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
          </div>

          <Separator />

          {element && (
            <>
              <TechnologiesSection elementId={element.id} technologies={element.technologies} />
              <Separator />
              <TagsSection elementId={element.id} workspaceId={workspaceId} />
              <Separator />
              <LinksSection elementId={element.id} links={element.links} />
              <Separator />
            </>
          )}

          <div className="space-y-2">
            <Label>{m.element_label_description()}</Label>
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
  );
}

function TechnologiesSection({
  elementId,
  technologies,
}: {
  elementId: string;
  technologies: Array<{ id: string; name: string; iconSlug: string | null }>;
}) {
  const [newTech, setNewTech] = useState("");
  const queryClient = useQueryClient();
  const addTechnologyFn = useServerFn(addTechnology);
  const removeTechnologyFn = useServerFn(removeTechnology);

  const handleAdd = useCallback(async () => {
    if (!newTech.trim()) return;
    try {
      await addTechnologyFn({ data: { elementId, name: newTech.trim() } });
      queryClient.invalidateQueries({ queryKey: ["element", elementId] });
      setNewTech("");
    } catch {
      toast.error(m.editor_panel_save_failed());
    }
  }, [newTech, elementId, addTechnologyFn, queryClient]);

  const handleRemove = useCallback(
    async (id: string) => {
      try {
        await removeTechnologyFn({ data: { id } });
        queryClient.invalidateQueries({ queryKey: ["element", elementId] });
      } catch {
        toast.error(m.editor_panel_save_failed());
      }
    },
    [elementId, removeTechnologyFn, queryClient],
  );

  return (
    <div className="space-y-2">
      <Label>{m.element_label_technologies()}</Label>
      <div className="flex flex-wrap gap-1">
        {technologies.map((tech) => (
          <Badge key={tech.id} variant="secondary" className="gap-1">
            {tech.name}
            <button
              onClick={() => handleRemove(tech.id)}
              className="ml-0.5 rounded-sm hover:bg-muted"
            >
              <X className="size-3" />
            </button>
          </Badge>
        ))}
      </div>
      <div className="flex gap-1">
        <Input
          value={newTech}
          onChange={(e) => setNewTech(e.target.value)}
          placeholder={m.element_tech_placeholder_name()}
          className="h-8 text-sm"
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <Button size="sm" variant="outline" onClick={handleAdd} className="h-8 shrink-0">
          <Plus className="size-3" />
        </Button>
      </div>
    </div>
  );
}

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
    <div className="space-y-2">
      <Label className="flex items-center gap-1">
        <Tag className="size-3.5" /> {m.tag_picker_title()}
      </Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="w-full justify-start">
            {m.tag_picker_title()}
          </Button>
        </PopoverTrigger>
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
  );
}

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
    <div className="space-y-2">
      <Label>{m.element_label_links()}</Label>
      <div className="space-y-1">
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
      </div>
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
  );
}
