import { useEditorStore } from "#/stores/editor-store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog";
import { Kbd, KbdGroup } from "#/components/ui/kbd";
import { m } from "#/paraglide/messages";

interface ShortcutRow {
  label: () => string;
  keys: string[];
}

const GENERAL_SHORTCUTS: ShortcutRow[] = [
  { label: () => m.editor_shortcut_undo(), keys: ["⌘", "Z"] },
  { label: () => m.editor_shortcut_redo(), keys: ["⌘", "⇧", "Z"] },
  { label: () => m.editor_shortcut_copy(), keys: ["⌘", "C"] },
  { label: () => m.editor_shortcut_paste(), keys: ["⌘", "V"] },
  { label: () => m.editor_shortcut_duplicate(), keys: ["⌘", "D"] },
  { label: () => m.editor_shortcut_delete(), keys: ["⌫"] },
  { label: () => m.editor_shortcut_select_all(), keys: ["⌘", "A"] },
  { label: () => m.editor_shortcut_deselect(), keys: ["Esc"] },
];

const TOOLS_SHORTCUTS: ShortcutRow[] = [
  { label: () => m.editor_shortcut_select_mode(), keys: ["V"] },
  { label: () => m.editor_shortcut_pan_mode(), keys: ["H"] },
  { label: () => m.editor_shortcut_connection_mode(), keys: ["C"] },
];

const NAVIGATION_SHORTCUTS: ShortcutRow[] = [
  { label: () => m.editor_shortcut_zoom_in(), keys: ["⌘", "+"] },
  { label: () => m.editor_shortcut_zoom_out(), keys: ["⌘", "−"] },
  { label: () => m.editor_shortcut_fit_view(), keys: ["⌘", "0"] },
  { label: () => m.editor_shortcut_zoom_100(), keys: ["⌘", "1"] },
];

const ELEMENTS_SHORTCUTS: ShortcutRow[] = [
  { label: () => m.editor_shortcut_add_actor(), keys: ["⇧", "P"] },
  { label: () => m.editor_shortcut_add_system(), keys: ["⇧", "S"] },
  { label: () => m.editor_shortcut_add_app(), keys: ["⇧", "A"] },
  { label: () => m.editor_shortcut_add_store(), keys: ["⇧", "D"] },
  { label: () => m.editor_shortcut_add_component(), keys: ["⇧", "X"] },
  { label: () => m.editor_shortcut_show_shortcuts(), keys: ["?"] },
];

function ShortcutSection({ title, shortcuts }: { title: string; shortcuts: ShortcutRow[] }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold">{title}</h3>
      <div className="space-y-1.5">
        {shortcuts.map((s, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{s.label()}</span>
            <KbdGroup>
              {s.keys.map((k, j) => (
                <Kbd key={j}>{k}</Kbd>
              ))}
            </KbdGroup>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ShortcutsDialog() {
  const open = useEditorStore((s) => s.shortcutsDialogOpen);
  const setOpen = useEditorStore((s) => s.setShortcutsDialogOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{m.editor_shortcuts_title()}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-6">
          <ShortcutSection title={m.editor_shortcuts_general()} shortcuts={GENERAL_SHORTCUTS} />
          <ShortcutSection title={m.editor_shortcuts_tools()} shortcuts={TOOLS_SHORTCUTS} />
          <ShortcutSection title={m.editor_shortcuts_navigation()} shortcuts={NAVIGATION_SHORTCUTS} />
          <ShortcutSection title={m.editor_shortcuts_elements()} shortcuts={ELEMENTS_SHORTCUTS} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
