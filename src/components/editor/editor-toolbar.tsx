import { Panel, useReactFlow } from "@xyflow/react";
import { useEditorStore } from "#/stores/editor-store";
import { validateElementForDiagram } from "#/lib/diagram.validators";
import { useDnD, useCreateElementAtPosition } from "#/components/editor/dnd-context";
import { Button } from "#/components/ui/button";
import { Toggle } from "#/components/ui/toggle";
import { Separator } from "#/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "#/components/ui/tooltip";
import {
  MousePointer2,
  Hand,
  Plus,
  Cable,
  ZoomIn,
  ZoomOut,
  Maximize,
  Grid3x3,
  Map,
  PanelRight,
  LayoutList,
  User,
  Box,
  Package,
  Database,
  Cpu,
} from "lucide-react";
import { m } from "#/paraglide/messages";
import type { ElementType } from "#/lib/element.validators";

const ADD_ELEMENT_OPTIONS: {
  type: ElementType;
  label: () => string;
  icon: React.ReactNode;
}[] = [
  { type: "actor", label: () => m.editor_toolbar_add_actor(), icon: <User className="mr-2 size-4" /> },
  { type: "system", label: () => m.editor_toolbar_add_system(), icon: <Box className="mr-2 size-4" /> },
  { type: "app", label: () => m.editor_toolbar_add_app(), icon: <Package className="mr-2 size-4" /> },
  { type: "store", label: () => m.editor_toolbar_add_store(), icon: <Database className="mr-2 size-4" /> },
  { type: "component", label: () => m.editor_toolbar_add_component(), icon: <Cpu className="mr-2 size-4" /> },
];

export function EditorToolbar() {
  const mode = useEditorStore((s) => s.mode);
  const setMode = useEditorStore((s) => s.setMode);
  const diagramType = useEditorStore((s) => s.diagramType);
  const showGrid = useEditorStore((s) => s.showGrid);
  const setShowGrid = useEditorStore((s) => s.setShowGrid);
  const showMinimap = useEditorStore((s) => s.showMinimap);
  const setShowMinimap = useEditorStore((s) => s.setShowMinimap);
  const propertiesPanelOpen = useEditorStore((s) => s.propertiesPanelOpen);
  const setPropertiesPanelOpen = useEditorStore((s) => s.setPropertiesPanelOpen);
  const elementPickerOpen = useEditorStore((s) => s.elementPickerOpen);
  const toggleElementPicker = useEditorStore((s) => s.toggleElementPicker);
  const reactFlow = useReactFlow();

  const { startDrag } = useDnD();
  const createElementAtPosition = useCreateElementAtPosition();

  return (
    <Panel position="top-center">
      <div className="flex items-center gap-1 rounded-lg border bg-card p-1 shadow-sm">
        <ToolbarTooltip label={m.editor_toolbar_select()}>
          <Toggle
            size="sm"
            pressed={mode === "select"}
            onPressedChange={() => setMode("select")}
            aria-label={m.editor_toolbar_select()}
          >
            <MousePointer2 className="size-4" />
          </Toggle>
        </ToolbarTooltip>

        <ToolbarTooltip label={m.editor_toolbar_pan()}>
          <Toggle
            size="sm"
            pressed={mode === "pan"}
            onPressedChange={() => setMode("pan")}
            aria-label={m.editor_toolbar_pan()}
          >
            <Hand className="size-4" />
          </Toggle>
        </ToolbarTooltip>

        <DropdownMenu>
          <ToolbarTooltip label={m.editor_toolbar_add_element()}>
            <DropdownMenuTrigger
              render={
                <Toggle
                  size="sm"
                  pressed={false}
                  aria-label={m.editor_toolbar_add_element()}
                >
                  <Plus className="size-4" />
                </Toggle>
              }
            >
              <Plus className="size-4" />
            </DropdownMenuTrigger>
          </ToolbarTooltip>
          <DropdownMenuContent align="center">
            {ADD_ELEMENT_OPTIONS.map(({ type, label, icon }) => {
              const valid = diagramType
                ? validateElementForDiagram(diagramType, type).valid
                : true;
              return (
                <DropdownMenuItem
                  key={type}
                  disabled={!valid}
                  className={valid ? "cursor-grab active:cursor-grabbing" : ""}
                  onPointerDown={(e) => {
                    if (!valid) return;
                    const elementLabel = label();
                    startDrag(e, elementLabel, async (flowPos) => {
                      await createElementAtPosition(type, flowPos);
                    });
                  }}
                  // Block the dropdown's built-in click/select so it doesn't
                  // interfere with the pointer-event drag gesture
                  onClick={(e) => e.preventDefault()}
                >
                  {icon}
                  {label()}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        <ToolbarTooltip label={m.editor_toolbar_add_connection()}>
          <Toggle
            size="sm"
            pressed={mode === "add_connection"}
            onPressedChange={() => setMode(mode === "add_connection" ? "select" : "add_connection")}
            aria-label={m.editor_toolbar_add_connection()}
          >
            <Cable className="size-4" />
          </Toggle>
        </ToolbarTooltip>

        <Separator orientation="vertical" className="mx-1 data-[orientation=vertical]:h-5" />

        <ToolbarTooltip label={m.editor_toolbar_zoom_in()}>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => reactFlow.zoomIn()}
          >
            <ZoomIn className="size-4" />
          </Button>
        </ToolbarTooltip>

        <ToolbarTooltip label={m.editor_toolbar_zoom_out()}>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => reactFlow.zoomOut()}
          >
            <ZoomOut className="size-4" />
          </Button>
        </ToolbarTooltip>

        <ToolbarTooltip label={m.editor_toolbar_fit_view()}>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => reactFlow.fitView()}
          >
            <Maximize className="size-4" />
          </Button>
        </ToolbarTooltip>

        <Separator orientation="vertical" className="mx-1 data-[orientation=vertical]:h-5" />

        <ToolbarTooltip label={m.editor_toolbar_toggle_grid()}>
          <Toggle
            size="sm"
            pressed={showGrid}
            onPressedChange={setShowGrid}
            aria-label={m.editor_toolbar_toggle_grid()}
          >
            <Grid3x3 className="size-4" />
          </Toggle>
        </ToolbarTooltip>

        <ToolbarTooltip label={m.editor_toolbar_toggle_minimap()}>
          <Toggle
            size="sm"
            pressed={showMinimap}
            onPressedChange={setShowMinimap}
            aria-label={m.editor_toolbar_toggle_minimap()}
          >
            <Map className="size-4" />
          </Toggle>
        </ToolbarTooltip>

        <Separator orientation="vertical" className="mx-1 data-[orientation=vertical]:h-5" />

        <ToolbarTooltip label={m.editor_picker_toggle()}>
          <Toggle
            size="sm"
            pressed={elementPickerOpen}
            onPressedChange={toggleElementPicker}
            aria-label={m.editor_picker_toggle()}
          >
            <LayoutList className="size-4" />
          </Toggle>
        </ToolbarTooltip>

        <ToolbarTooltip label={propertiesPanelOpen ? m.editor_panel_close() : m.editor_panel_open()}>
          <Toggle
            size="sm"
            pressed={propertiesPanelOpen}
            onPressedChange={setPropertiesPanelOpen}
            aria-label={propertiesPanelOpen ? m.editor_panel_close() : m.editor_panel_open()}
          >
            <PanelRight className="size-4" />
          </Toggle>
        </ToolbarTooltip>
      </div>
    </Panel>
  );
}

function ToolbarTooltip({ label, children }: { label: string; children: React.ReactElement }) {
  return (
    <Tooltip>
      <TooltipTrigger render={children} />
      <TooltipContent side="bottom" className="text-xs">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
