import { useState } from "react";
import { Panel } from "@xyflow/react";
import { useEditorStore } from "#/stores/editor-store";
import { useHistoryStore } from "#/stores/history-store";
import { useEditorActions } from "#/hooks/use-editor-actions";
import { validateElementForDiagram } from "#/lib/diagram.validators";
import { useDnD, useCreateElementAtPosition } from "#/components/editor/dnd-context";
import { SaveIndicator } from "#/components/editor/save-indicator";
import { Button } from "#/components/ui/button";
import { Toggle } from "#/components/ui/toggle";
import { Separator } from "#/components/ui/separator";
import { Kbd, KbdGroup } from "#/components/ui/kbd";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "#/components/ui/popover";
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
  Grid3x3,
  Map,
  LayoutList,
  User,
  Box,
  Package,
  Database,
  Cpu,
  Undo2,
  Redo2,
  Keyboard,
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

interface EditorToolbarProps {
  autosaveStatus: "idle" | "saving" | "saved" | "error";
}

export function EditorToolbar({ autosaveStatus }: EditorToolbarProps) {
  const mode = useEditorStore((s) => s.mode);
  const setMode = useEditorStore((s) => s.setMode);
  const diagramType = useEditorStore((s) => s.diagramType);
  const showGrid = useEditorStore((s) => s.showGrid);
  const setShowGrid = useEditorStore((s) => s.setShowGrid);
  const showMinimap = useEditorStore((s) => s.showMinimap);
  const setShowMinimap = useEditorStore((s) => s.setShowMinimap);
  const elementPickerOpen = useEditorStore((s) => s.elementPickerOpen);
  const toggleElementPicker = useEditorStore((s) => s.toggleElementPicker);
  const setShortcutsDialogOpen = useEditorStore((s) => s.setShortcutsDialogOpen);

  const canUndo = useHistoryStore((s) => s.canUndo);
  const canRedo = useHistoryStore((s) => s.canRedo);
  const { undo, redo } = useEditorActions();

  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const { startDrag } = useDnD();
  const createElementAtPosition = useCreateElementAtPosition();

  return (
    <Panel position="center-left">
      <div className="flex flex-col items-center gap-1 rounded-lg border bg-card p-1 shadow-sm">
        <ToolbarTooltip label={m.editor_toolbar_select()} keys={["V"]}>
          <Toggle
            size="sm"
            pressed={mode === "select"}
            onPressedChange={() => setMode("select")}
            aria-label={m.editor_toolbar_select()}
          >
            <MousePointer2 className="size-4" />
          </Toggle>
        </ToolbarTooltip>

        <ToolbarTooltip label={m.editor_toolbar_pan()} keys={["H"]}>
          <Toggle
            size="sm"
            pressed={mode === "pan"}
            onPressedChange={() => setMode("pan")}
            aria-label={m.editor_toolbar_pan()}
          >
            <Hand className="size-4" />
          </Toggle>
        </ToolbarTooltip>

        <Popover open={addMenuOpen} onOpenChange={setAddMenuOpen}>
          <ToolbarTooltip label={m.editor_toolbar_add_element()}>
            <PopoverTrigger
              render={
                <Toggle
                  size="sm"
                  pressed={false}
                  aria-label={m.editor_toolbar_add_element()}
                >
                  <Plus className="size-4" />
                </Toggle>
              }
            />
          </ToolbarTooltip>
          <PopoverContent side="right" className="w-auto min-w-40 p-1">
            {ADD_ELEMENT_OPTIONS.map(({ type, label, icon }) => {
              const valid = diagramType
                ? validateElementForDiagram(diagramType, type).valid
                : true;
              return (
                <button
                  key={type}
                  disabled={!valid}
                  className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-sm cursor-grab active:cursor-grabbing hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
                  onPointerDown={(e) => {
                    if (!valid) return;
                    setAddMenuOpen(false);
                    startDrag(e, label(), async (flowPos) => {
                      await createElementAtPosition(type, flowPos);
                    });
                  }}
                >
                  {icon}
                  {label()}
                </button>
              );
            })}
          </PopoverContent>
        </Popover>

        <ToolbarTooltip label={m.editor_toolbar_add_connection()} keys={["C"]}>
          <Toggle
            size="sm"
            pressed={mode === "add_connection"}
            onPressedChange={() => setMode(mode === "add_connection" ? "select" : "add_connection")}
            aria-label={m.editor_toolbar_add_connection()}
          >
            <Cable className="size-4" />
          </Toggle>
        </ToolbarTooltip>

        <Separator orientation="horizontal" className="data-[orientation=horizontal]:w-full" />

        <ToolbarTooltip label={m.editor_toolbar_undo()} keys={["⌘", "Z"]}>
          <Button
            variant="ghost"
            size="sm"
            disabled={!canUndo}
            onClick={undo}
            aria-label={m.editor_toolbar_undo()}
            className="size-8 p-0"
          >
            <Undo2 className="size-4" />
          </Button>
        </ToolbarTooltip>

        <ToolbarTooltip label={m.editor_toolbar_redo()} keys={["⌘", "⇧", "Z"]}>
          <Button
            variant="ghost"
            size="sm"
            disabled={!canRedo}
            onClick={redo}
            aria-label={m.editor_toolbar_redo()}
            className="size-8 p-0"
          >
            <Redo2 className="size-4" />
          </Button>
        </ToolbarTooltip>

        <Separator orientation="horizontal" className="data-[orientation=horizontal]:w-full" />

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

        <Separator orientation="horizontal" className="data-[orientation=horizontal]:w-full" />

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

        <ToolbarTooltip label={m.editor_shortcut_show_shortcuts()} keys={["?"]}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShortcutsDialogOpen(true)}
            aria-label={m.editor_shortcut_show_shortcuts()}
            className="size-8 p-0"
          >
            <Keyboard className="size-4" />
          </Button>
        </ToolbarTooltip>

        <SaveIndicator status={autosaveStatus} />
      </div>
    </Panel>
  );
}

function ToolbarTooltip({
  label,
  keys,
  children,
}: {
  label: string;
  keys?: string[];
  children: React.ReactElement;
}) {
  return (
    <Tooltip>
      <TooltipTrigger render={children} />
      <TooltipContent side="right" className="flex items-center gap-2 text-xs">
        {label}
        {keys && (
          <KbdGroup>
            {keys.map((k, i) => (
              <Kbd key={i}>{k}</Kbd>
            ))}
          </KbdGroup>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
