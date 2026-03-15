import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { z } from "zod/v4";
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
import { Checkbox } from "#/components/ui/checkbox";
import { Field, FieldDescription, FieldError, FieldLabel } from "#/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";
import { toast } from "sonner";
import { m } from "#/paraglide/messages";
import { diagramTypes } from "#/lib/diagram.validators";
import type { DiagramType } from "#/lib/diagram.validators";
import {
  createDiagram,
  updateDiagram,
} from "#/lib/diagram.functions";

interface DiagramData {
  id: string;
  name: string;
  description: string | null;
  diagramType: DiagramType;
  gridSize: number;
  snapToGrid: boolean;
}

interface DiagramFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  diagram?: DiagramData;
  onSuccess: () => void;
}

const TYPE_LABELS: Record<DiagramType, () => string> = {
  system_context: () => `${m.diagram_level_1()} — ${m.diagram_type_system_context()}`,
  container: () => `${m.diagram_level_2()} — ${m.diagram_type_container()}`,
  component: () => `${m.diagram_level_3()} — ${m.diagram_type_component()}`,
};

const TYPE_DESCRIPTIONS: Record<DiagramType, () => string> = {
  system_context: () => m.diagram_level_1_description(),
  container: () => m.diagram_level_2_description(),
  component: () => m.diagram_level_3_description(),
};

export function DiagramFormDialog({
  open,
  onOpenChange,
  workspaceId,
  diagram: editDiagram,
  onSuccess,
}: DiagramFormDialogProps) {
  const isEdit = !!editDiagram;
  const [selectedType, setSelectedType] = useState<DiagramType>(
    editDiagram?.diagramType ?? "system_context",
  );

  const diagramSchema = z.object({
    diagramType: z.enum(["system_context", "container", "component"] as const),
    name: z.string().min(1, m.validation_name_required()),
    description: z.string(),
    gridSize: z.number().min(5).max(100),
    snapToGrid: z.boolean(),
  });

  const form = useForm({
    defaultValues: {
      diagramType: editDiagram?.diagramType ?? ("system_context" as DiagramType),
      name: editDiagram?.name ?? "",
      description: editDiagram?.description ?? "",
      gridSize: editDiagram?.gridSize ?? 20,
      snapToGrid: editDiagram?.snapToGrid ?? true,
    },
    validators: {
      onSubmit: diagramSchema,
      onBlur: diagramSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        if (isEdit) {
          await updateDiagram({
            data: {
              id: editDiagram.id,
              name: value.name,
              description: value.description || null,
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

  const handleTypeChange = (newType: DiagramType) => {
    form.setFieldValue("diagramType", newType);
    setSelectedType(newType);
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
            void form.handleSubmit();
          }}
          className="flex flex-col gap-4"
        >
          {!isEdit && (
            <form.Field name="diagramType">
              {(field) => (
                <Field>
                  <FieldLabel>{m.diagram_label_level()}</FieldLabel>
                  <Select
                    value={field.state.value}
                    onValueChange={(val: string | null) => {
                      if (val) handleTypeChange(val as DiagramType);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {diagramTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {TYPE_LABELS[type]()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldDescription>
                    {TYPE_DESCRIPTIONS[selectedType]()}
                  </FieldDescription>
                </Field>
              )}
            </form.Field>
          )}

          <form.Field name="name">
            {(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel>{m.diagram_label_name()}</FieldLabel>
                  <Input
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder={m.diagram_placeholder_name()}
                    aria-invalid={isInvalid}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>

          <form.Field name="description">
            {(field) => (
              <Field>
                <FieldLabel>{m.diagram_label_description()}</FieldLabel>
                <Input
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder={m.diagram_placeholder_description()}
                />
              </Field>
            )}
          </form.Field>

          <form.Field name="gridSize">
            {(field) => (
              <Field>
                <FieldLabel>{m.diagram_label_grid_size()}</FieldLabel>
                <Input
                  type="number"
                  min={5}
                  max={100}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(Number(e.target.value))}
                  onBlur={field.handleBlur}
                />
              </Field>
            )}
          </form.Field>

          <form.Field name="snapToGrid">
            {(field) => (
              <Field orientation="horizontal">
                <Checkbox
                  id="snapToGrid"
                  checked={field.state.value}
                  onCheckedChange={(checked) => field.handleChange(checked === true)}
                />
                <FieldLabel htmlFor="snapToGrid">{m.diagram_label_snap_to_grid()}</FieldLabel>
              </Field>
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
