"use client";

import {
  Activity,
  Bell,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  FolderOpen,
  Layout as LayoutIcon,
  LayoutDashboard,
  MapPin,
  Megaphone,
  Paperclip,
  PenLine,
  Phone,
  Pin,
  Plus,
  Search,
  Settings,
  Theater,
  Users,
} from "lucide-react";
import type { LucideProps } from "lucide-react";

const ICONS = {
  Activity,
  Bell,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  FolderOpen,
  Layout: LayoutIcon,
  LayoutDashboard,
  MapPin,
  Megaphone,
  Paperclip,
  PenLine,
  Phone,
  Pin,
  Plus,
  Search,
  Settings,
  Theater,
  Users,
} as const;

export type IconName = keyof typeof ICONS;

export function Icon({ name, ...props }: { name: IconName } & LucideProps) {
  const Component = ICONS[name];
  return <Component {...props} />;
}
