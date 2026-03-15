import { create } from "zustand";
import type { AppNode, AppEdge } from "#/lib/types/diagram-nodes";

const MAX_UNDO_ENTRIES = 50;
const MERGE_WINDOW_MS = 300;

export interface HistoryAction {
  type: "move_nodes" | "resize_node" | "add_node" | "remove_node" | "add_edge" | "remove_edge";
  timestamp: number;
  before: { nodes?: AppNode[]; edges?: AppEdge[] };
  after: { nodes?: AppNode[]; edges?: AppEdge[] };
}

interface HistoryState {
  undoStack: HistoryAction[];
  redoStack: HistoryAction[];
  canUndo: boolean;
  canRedo: boolean;
  pushAction: (action: Omit<HistoryAction, "timestamp">) => void;
  popUndo: () => HistoryAction | null;
  popRedo: () => HistoryAction | null;
  clear: () => void;
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  undoStack: [],
  redoStack: [],
  canUndo: false,
  canRedo: false,

  pushAction: (action) => {
    const now = Date.now();
    const { undoStack } = get();
    const last = undoStack[undoStack.length - 1];

    // Merge rapid same-type actions within the merge window
    if (
      last &&
      last.type === action.type &&
      now - last.timestamp < MERGE_WINDOW_MS
    ) {
      const merged: HistoryAction = {
        ...last,
        timestamp: now,
        after: action.after,
      };
      const newStack = [...undoStack.slice(0, -1), merged];
      set({
        undoStack: newStack,
        redoStack: [],
        canUndo: newStack.length > 0,
        canRedo: false,
      });
      return;
    }

    const entry: HistoryAction = { ...action, timestamp: now };
    const newStack = [...undoStack, entry].slice(-MAX_UNDO_ENTRIES);
    set({
      undoStack: newStack,
      redoStack: [],
      canUndo: newStack.length > 0,
      canRedo: false,
    });
  },

  popUndo: () => {
    const { undoStack, redoStack } = get();
    if (undoStack.length === 0) return null;
    const action = undoStack[undoStack.length - 1];
    const newUndo = undoStack.slice(0, -1);
    const newRedo = [...redoStack, action];
    set({
      undoStack: newUndo,
      redoStack: newRedo,
      canUndo: newUndo.length > 0,
      canRedo: true,
    });
    return action;
  },

  popRedo: () => {
    const { undoStack, redoStack } = get();
    if (redoStack.length === 0) return null;
    const action = redoStack[redoStack.length - 1];
    const newRedo = redoStack.slice(0, -1);
    const newUndo = [...undoStack, action];
    set({
      undoStack: newUndo,
      redoStack: newRedo,
      canUndo: true,
      canRedo: newRedo.length > 0,
    });
    return action;
  },

  clear: () =>
    set({ undoStack: [], redoStack: [], canUndo: false, canRedo: false }),
}));
