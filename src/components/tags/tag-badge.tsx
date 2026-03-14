import {
  Globe,
  Database,
  Server,
  Cloud,
  Lock,
  Shield,
  Network,
  Monitor,
  Cpu,
  HardDrive,
  Wifi,
  Smartphone,
  Tablet,
  Laptop,
  Container,
  Box,
  Archive,
  Folder,
  File,
  Code,
  Terminal,
  GitBranch,
  Layers,
  Layout,
  Grid3x3,
  Zap,
  Activity,
  BarChart,
  PieChart,
  Users,
  User,
  Key,
  Settings,
  Wrench,
  Bug,
  Bell,
  Mail,
  MessageSquare,
  Search,
  Eye,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { TagIconName } from "#/lib/tag.validators";

export const TAG_ICON_MAP: Record<TagIconName, LucideIcon> = {
  globe: Globe,
  database: Database,
  server: Server,
  cloud: Cloud,
  lock: Lock,
  shield: Shield,
  network: Network,
  monitor: Monitor,
  cpu: Cpu,
  "hard-drive": HardDrive,
  wifi: Wifi,
  smartphone: Smartphone,
  tablet: Tablet,
  laptop: Laptop,
  container: Container,
  box: Box,
  archive: Archive,
  folder: Folder,
  file: File,
  code: Code,
  terminal: Terminal,
  "git-branch": GitBranch,
  layers: Layers,
  layout: Layout,
  grid: Grid3x3,
  zap: Zap,
  activity: Activity,
  "bar-chart": BarChart,
  "pie-chart": PieChart,
  users: Users,
  user: User,
  key: Key,
  settings: Settings,
  wrench: Wrench,
  bug: Bug,
  bell: Bell,
  mail: Mail,
  "message-square": MessageSquare,
  search: Search,
  eye: Eye,
};

interface TagBadgeProps {
  name: string;
  color: string;
  icon?: string | null;
  className?: string;
}

export function TagBadge({ name, color, icon, className }: TagBadgeProps) {
  const Icon = icon ? TAG_ICON_MAP[icon as TagIconName] : null;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${className ?? ""}`}
      style={{
        borderColor: color,
        color: color,
        backgroundColor: `${color}1A`,
      }}
    >
      {Icon && <Icon className="size-3" />}
      {name}
    </span>
  );
}
