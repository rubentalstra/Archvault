import { EdgeLabelRenderer } from "@xyflow/react";
import { TechIcon } from "#/components/technologies/tech-icon";

interface EdgeLabelProps {
  labelX: number;
  labelY: number;
  description: string | null;
  technologies: string[];
  iconTechSlug: string | null;
}

export function EdgeLabel({
  labelX,
  labelY,
  description,
  technologies,
  iconTechSlug,
}: EdgeLabelProps) {
  if (!description && technologies.length === 0) return null;

  return (
    <EdgeLabelRenderer>
      <div
        className="nodrag nopan pointer-events-auto absolute"
        style={{
          transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
        }}
      >
        <div className="flex flex-col items-center gap-0.5 rounded bg-background/80 px-1.5 py-0.5 text-xs shadow-sm">
          {iconTechSlug && (
            <TechIcon slug={iconTechSlug} className="size-4" />
          )}
          {description && (
            <span className="max-w-32 truncate text-foreground">
              {description}
            </span>
          )}
          {technologies.length > 0 && (
            <div className="flex flex-wrap justify-center gap-0.5">
              {technologies.map((tech) => (
                <span
                  key={tech}
                  className="rounded bg-muted px-1 py-px text-[10px] text-muted-foreground"
                >
                  {tech}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </EdgeLabelRenderer>
  );
}
