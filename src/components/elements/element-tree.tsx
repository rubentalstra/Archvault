import { useState, useMemo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Button } from "#/components/ui/button";
import { ChevronRight, ChevronDown, Plus, User, Server, Package, Cpu } from "lucide-react";
import { m } from "#/paraglide/messages";
import type { ElementType, ElementStatus } from "#/lib/element.validators";

interface TreeElement {
  id: string;
  name: string;
  elementType: ElementType;
  status: ElementStatus;
  parentElementId: string | null;
}

interface TreeNode {
  element: TreeElement;
  children: TreeNode[];
}

interface FlatNode {
  element: TreeElement;
  depth: number;
  hasChildren: boolean;
  isExpanded: boolean;
}

const TYPE_ICONS: Record<ElementType, typeof User> = {
  person: User,
  system: Server,
  container: Package,
  component: Cpu,
};

const STATUS_DOT_COLORS: Record<ElementStatus, string> = {
  planned: "bg-blue-500",
  live: "bg-green-500",
  deprecated: "bg-red-500",
};

function buildTree(elements: TreeElement[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];

  for (const el of elements) {
    map.set(el.id, { element: el, children: [] });
  }

  for (const el of elements) {
    const node = map.get(el.id)!;
    if (el.parentElementId && map.has(el.parentElementId)) {
      map.get(el.parentElementId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

function flattenTree(
  nodes: TreeNode[],
  expandedIds: Set<string>,
  depth = 0,
): FlatNode[] {
  const result: FlatNode[] = [];
  for (const node of nodes) {
    const hasChildren = node.children.length > 0;
    const isExpanded = expandedIds.has(node.element.id);
    result.push({ element: node.element, depth, hasChildren, isExpanded });
    if (hasChildren && isExpanded) {
      result.push(...flattenTree(node.children, expandedIds, depth + 1));
    }
  }
  return result;
}

// Valid child types for "Add Child" button
const VALID_CHILDREN: Record<ElementType, ElementType[]> = {
  person: [],
  system: ["system", "container"],
  container: ["component"],
  component: [],
};

interface ElementTreeProps {
  elements: TreeElement[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreateRoot: () => void;
  onCreateChild: (parentId: string, childType: ElementType) => void;
}

export function ElementTree({
  elements,
  selectedId,
  onSelect,
  onCreateRoot,
  onCreateChild,
}: ElementTreeProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    // Expand all by default
    return new Set(elements.map((e) => e.id));
  });

  const roots = useMemo(() => buildTree(elements), [elements]);
  const flatNodes = useMemo(
    () => flattenTree(roots, expandedIds),
    [roots, expandedIds],
  );

  const parentRef = { current: null as HTMLDivElement | null };

  const virtualizer = useVirtualizer({
    count: flatNodes.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 36,
    overscan: 10,
  });

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b p-3">
        <h3 className="text-sm font-semibold">{m.element_tree_title()}</h3>
        <Button variant="ghost" size="icon-sm" onClick={onCreateRoot}>
          <Plus className="size-4" />
        </Button>
      </div>

      <div ref={(el) => { parentRef.current = el; }} className="flex-1 overflow-auto">
        {flatNodes.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">
            {m.element_empty()}
          </p>
        ) : (
          <div
            style={{ height: `${virtualizer.getTotalSize()}px`, position: "relative" }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const node = flatNodes[virtualRow.index];
              const Icon = TYPE_ICONS[node.element.elementType];
              const validChildren = VALID_CHILDREN[node.element.elementType];
              const isSelected = node.element.id === selectedId;

              return (
                <div
                  key={node.element.id}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <div
                    className={`flex items-center gap-1 px-2 py-1 text-sm cursor-pointer hover:bg-accent/50 rounded-md ${
                      isSelected ? "bg-accent text-accent-foreground" : ""
                    }`}
                    style={{ paddingLeft: `${node.depth * 20 + 8}px` }}
                    onClick={() => onSelect(node.element.id)}
                  >
                    {node.hasChildren ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpand(node.element.id);
                        }}
                        className="shrink-0"
                      >
                        {node.isExpanded ? (
                          <ChevronDown className="size-3.5" />
                        ) : (
                          <ChevronRight className="size-3.5" />
                        )}
                      </button>
                    ) : (
                      <span className="w-3.5 shrink-0" />
                    )}

                    <Icon className="size-3.5 shrink-0 text-muted-foreground" />

                    <span
                      className={`mr-1 inline-block size-2 shrink-0 rounded-full ${STATUS_DOT_COLORS[node.element.status]}`}
                    />

                    <span className="truncate">{node.element.name}</span>

                    {validChildren.length > 0 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCreateChild(node.element.id, validChildren[0]);
                        }}
                        className="ml-auto shrink-0 opacity-0 group-hover:opacity-100 hover:text-primary"
                        title={m.element_add_child()}
                      >
                        <Plus className="size-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
