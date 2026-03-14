interface GroupBadgeProps {
  name: string;
  color: string;
  className?: string;
}

export function GroupBadge({ name, color, className }: GroupBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium ${className ?? ""}`}
      style={{
        borderColor: color,
        color: color,
        backgroundColor: `${color}1A`,
      }}
    >
      <span
        className="size-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      {name}
    </span>
  );
}
