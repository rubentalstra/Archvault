import { useState, useMemo } from "react";
import { useForm } from "@tanstack/react-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { toast } from "sonner";
import { m } from "#/paraglide/messages";
import {
  diagramTypes,
  validateDiagramScope,
} from "#/lib/diagram.validators";
import type { DiagramType } from "#/lib/diagram.validators";
import type { ElementType } from "#/lib/element.validators";
import {
  createDiagram,
  updateDiagram,
} from "#/lib/diagram.functions";

interface DiagramData {
  id: string;
  name: string;
  description: string | null;
  diagramType: DiagramType;
  scopeElementId: string | null;
  gridSize: number;
  snapToGrid: boolean;
}

interface ScopeElementOption {
  id: string;
  name: string;
  elementType: ElementType;
}

interface DiagramFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  diagram?: DiagramData;
  scopeElementOptions: ScopeElementOption[];
  onSuccess: () => void;
}

const TYPE_LABELS: Record<DiagramType, () => string> = {
  context: () => m.diagram_type_context(),
  container: () => m.diagram_type_container(),
  component: () => m.diagram_type_component(),
};

const SCOPE_FILTER: Record<DiagramType, ElementType[]> = {
  context: ["system"],
  container: ["system"],
  component: ["app"],
};

export function DiagramFormDialog({
  open,
  onOpenChange,
  workspaceId,
  diagram: editDiagram,
  scopeElementOptions,
  onSuccess,
}: DiagramFormDialogProps) {
  const isEdit = !!editDiagram;
  const [scopeError, setScopeError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<DiagramType>(
    editDiagram?.diagramType ?? "context",
  );

  const form = useForm({
    defaultValues: {
      diagramType: editDiagram?.diagramType ?? ("context" as DiagramType),
      name: editDiagram?.name ?? "",
      description: editDiagram?.description ?? "",
      scopeElementId: editDiagram?.scopeElementId ?? "",
      gridSize: editDiagram?.gridSize ?? 20,
      snapToGrid: editDiagram?.snapToGrid ?? true,
    },
    onSubmit: async ({ value }) => {
      try {
        setScopeError(null);

        // Client-side scope validation
        if (value.scopeElementId) {
          const scopeEl = scopeElementOptions.find((e) => e.id === value.scopeElementId);
          if (scopeEl) {
            const validation = validateDiagramScope(value.diagramType, scopeEl.elementType);
            if (!validation.valid) {
              setScopeError(validation.message ?? null);
              return;
            }
          }
        } else {
          const validation = validateDiagramScope(value.diagramType, null);
          if (!validation.valid) {
            setScopeError(validation.message ?? null);
            return;
          }
        }

        if (isEdit) {
          await updateDiagram({
            data: {
              id: editDiagram.id,
              name: value.name,
              description: value.description || null,
              scopeElementId: value.scopeElementId || null,
              gridSize: value.gridSize,
              snapToGrid: value.snapToGrid,
            },
          });
          toast.success(m.diagram_edit_success());
        } else {
          await createDiagram({
            data: {
              workspaceId,
              name: value.name,
              description: value.description || undefined,
              diagramType: value.diagramType,
              scopeElementId: value.scopeElementId || undefined,
              gridSize: value.gridSize,
              snapToGrid: value.snapToGrid,
            },
          });
          toast.success(m.diagram_create_success());
        }
        onOpenChange(false);
        onSuccess();
      } catch (err) {
        toast.error(
          err instanceof Error
            ? err.message
            : isEdit
              ? m.diagram_edit_failed()
              : m.diagram_create_failed(),
        );
      }
    },
  });

  const filteredScopeOptions = useMemo(() => {
    const allowedTypes = SCOPE_FILTER[selectedType];
    return scopeElementOptions.filter((e) => allowedTypes.includes(e.elementType));
  }, [selectedType, scopeElementOptions]);

  const handleTypeChange = (newType: DiagramType) => {
    form.setFieldValue("diagramType", newType);
    setSelectedType(newType);
    // Clear scope if current selection is invalid for new type
    const currentScope = form.getFieldValue("scopeElementId");
    if (currentScope) {
      const scopeEl = scopeElementOptions.find((e) => e.id === currentScope);
      if (scopeEl) {
        const allowed = SCOPE_FILTER[newType];
        if (!allowed.includes(scopeEl.elementType)) {
          form.setFieldValue("scopeElementId", "");
        }
      }
    }
    setScopeError(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? m.diagram_edit_title() : m.diagram_create_title()}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? m.diagram_edit_description() : m.diagram_create_description()}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className="flex flex-col gap-4"
        >
          {/* Diagram Type (create only) */}
          {!isEdit && (
            <form.Field name="diagramType">
              {(field) => (
                <div className="flex flex-col gap-1.5">
                  <Label>{m.diagram_label_type()}</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={field.state.value}
                    onChange={(e) => handleTypeChange(e.target.value as DiagramType)}
                  >
                    {diagramTypes.map((type) => (
                      <option key={type} value={type}>
                        {TYPE_LABELS[type]()}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </form.Field>
          )}

          {/* Name */}
          <form.Field name="name">
            {(field) => (
              <div className="flex flex-col gap-1.5">
                <Label>{m.diagram_label_name()}</Label>
                <Input
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder={m.diagram_placeholder_name()}
                />
              </div>
            )}
          </form.Field>

          {/* Description */}
          <form.Field name="description">
            {(field) => (
              <div className="flex flex-col gap-1.5">
                <Label>{m.diagram_label_description()}</Label>
                <Input
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder={m.diagram_placeholder_description()}
                />
              </div>
            )}
          </form.Field>

          {/* Scope Element */}
          <form.Field name="scopeElementId">
            {(field) => (
              <div className="flex flex-col gap-1.5">
                <Label>{m.diagram_label_scope()}</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={field.state.value}
                  onChange={(e) => {
                    field.handleChange(e.target.value);
                    setScopeError(null);
                  }}
                >
                  <option value="">{m.diagram_no_scope()}</option>
                  {filteredScopeOptions.map((el) => (
                    <option key={el.id} value={el.id}>
                      {el.name}
                    </option>
                  ))}
                </select>
                {scopeError && (
                  <p className="text-xs text-destructive">{scopeError}</p>
                )}
              </div>
            )}
          </form.Field>

          {/* Grid Size */}
          <form.Field name="gridSize">
            {(field) => (
              <div className="flex flex-col gap-1.5">
                <Label>{m.diagram_label_grid_size()}</Label>
                <Input
                  type="number"
                  min={5}
                  max={100}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(Number(e.target.value))}
                  onBlur={field.handleBlur}
                />
              </div>
            )}
          </form.Field>

          {/* Snap to Grid */}
          <form.Field name="snapToGrid">
            {(field) => (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="snapToGrid"
                  checked={field.state.value}
                  onChange={(e) => field.handleChange(e.target.checked)}
                  className="size-4 rounded border-input"
                />
                <Label htmlFor="snapToGrid">{m.diagram_label_snap_to_grid()}</Label>
              </div>
            )}
          </form.Field>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {m.common_cancel()}
            </Button>
            <form.Subscribe selector={(s) => s.isSubmitting}>
              {(isSubmitting) => (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? m.common_saving()
                    : isEdit
                      ? m.common_save_changes()
                      : m.common_create()}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
