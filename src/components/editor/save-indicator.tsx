import { useEffect, useMemo, useState } from "react";
import { Loader2, Check } from "lucide-react";
import { m } from "#/paraglide/messages";

interface SaveIndicatorProps {
  status: "idle" | "saving" | "saved" | "error";
}

export function SaveIndicator({ status }: SaveIndicatorProps) {
  const [hideSaved, setHideSaved] = useState(false);

  useEffect(() => {
    if (status !== "saved") {
      setHideSaved(false);
      return;
    }
    const timer = setTimeout(() => setHideSaved(true), 3000);
    return () => clearTimeout(timer);
  }, [status]);

  const visible = useMemo(() => {
    if (status === "saving" || status === "error") return true;
    if (status === "saved" && !hideSaved) return true;
    return false;
  }, [status, hideSaved]);

  if (!visible) return null;

  if (status === "saving") {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="size-3 animate-spin" />
        {m.editor_autosave_saving()}
      </div>
    );
  }

  if (status === "saved") {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Check className="size-3" />
        {m.editor_autosave_saved()}
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex items-center gap-1.5 text-xs text-destructive">
        {m.editor_autosave_failed()}
      </div>
    );
  }

  return null;
}
