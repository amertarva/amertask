// components/layout/Sidebar.tsx
"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import {
  Layout,
  LayoutGrid,
  BarChart2,
  Users,
  Hexagon,
  Settings as SettingsIcon,
  Network,
  Bug,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useThemeStore } from "@/store/useThemeStore";
import { SchoolSidebarOrnament } from "@/components/themes/SchoolOrnaments";
import { WorkSidebarOrnament } from "@/components/themes/WorkOrnaments";
import type {
  SidebarItemProps,
  FavoriteItemProps,
  SidebarProps,
} from "@/types";

const SidebarItem: React.FC<SidebarItemProps> = ({
  icon,
  label,
  href,
  isActive,
  isCollapsed,
}) => {
  return (
    <Link
      href={href}
      title={isCollapsed ? label : undefined}
      className={cn(
        "flex items-center gap-3 rounded-xl text-sm font-semibold transition-all",
        isActive
          ? "bg-card text-text border border-border shadow-sm ring-1 ring-primary/5"
          : "text-text-muted hover:bg-muted/60 hover:text-text border border-transparent",
        isCollapsed ? "w-11 h-11 justify-center p-0 mx-auto" : "px-3 py-2.5",
      )}
    >
      <span
        className={cn(
          "shrink-0 transition-colors",
          isActive ? "text-primary" : "text-text-subtle",
        )}
      >
        {icon}
      </span>
      {!isCollapsed && (
        <span className="flex-1 truncate tracking-wide animate-fade-in">
          {label}
        </span>
      )}
    </Link>
  );
};

const FavoriteItem: React.FC<FavoriteItemProps> = ({
  colorClass,
  label,
  href = "#",
  isCollapsed,
}) => {
  return (
    <Link
      href={href}
      title={isCollapsed ? label : undefined}
      className={cn(
        "flex items-center gap-3 rounded-xl hover:bg-muted/50 transition-colors group",
        isCollapsed ? "w-11 h-11 justify-center p-0 mx-auto" : "py-2 px-3",
      )}
    >
      <span className={cn("w-2 h-2 rounded-full", colorClass)}></span>
      {!isCollapsed && (
        <span className="text-sm font-medium text-text-muted group-hover:text-text tracking-wide truncate">
          {label}
        </span>
      )}
    </Link>
  );
};

const GroupHeader = ({
  label,
  isCollapsed,
}: {
  label: string;
  isCollapsed?: boolean;
}) => {
  if (isCollapsed) return <div className="h-px bg-border my-4 mx-4" />;
  return (
    <p className="px-3 text-[10px] font-extrabold text-text-subtle tracking-widest mb-2 mt-6 uppercase">
      {label}
    </p>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed = false }) => {
  const pathname = usePathname();
  const params = useParams();
  const { visualTheme } = useThemeStore();

  // Get teamSlug from URL params
  const teamSlug = (params?.teamSlug as string) || "";

  // If no teamSlug, don't render sidebar (we're not in a project)
  if (!teamSlug) {
    return null;
  }

  return (
    <aside
      className={cn(
        "border-r border-border bg-background flex flex-col h-full overflow-y-auto transition-all duration-300",
        "absolute md:relative z-40 h-full",
        isCollapsed
          ? "-translate-x-full md:translate-x-0 w-64 md:w-20"
          : "translate-x-0 w-64 shadow-2xl md:shadow-none",
      )}
    >
      {/* Navigation Links */}
      <div className="px-4 pb-4 mt-2">
        <div className={cn("space-y-1", !isCollapsed && "mt-4")}>
          <SidebarItem
            icon={<Layout className="w-4 h-4" />}
            label="Team Overview"
            href={`/projects/${teamSlug}`}
            isActive={pathname === `/projects/${teamSlug}`}
            isCollapsed={isCollapsed}
          />
        </div>

        <GroupHeader label="Perencanaan" isCollapsed={isCollapsed} />
        <div className="space-y-1">
          <SidebarItem
            icon={<LayoutGrid className="w-4 h-4" />}
            label="Backlog"
            href={`/projects/${teamSlug}/backlog`}
            isActive={pathname.includes("/backlog")}
            isCollapsed={isCollapsed}
          />
          <SidebarItem
            icon={<BarChart2 className="w-4 h-4" />}
            label="Planning & Sprint"
            href={`/projects/${teamSlug}/planning`}
            isActive={pathname.includes("/planning")}
            isCollapsed={isCollapsed}
          />
          <SidebarItem
            icon={<Network className="w-4 h-4" />}
            label="Task Graph"
            href={`/projects/${teamSlug}/graph`}
            isActive={pathname.includes("/graph")}
            isCollapsed={isCollapsed}
          />
        </div>

        <GroupHeader label="Pengerjaan" isCollapsed={isCollapsed} />
        <div className="space-y-1">
          <SidebarItem
            icon={<LayoutGrid className="w-4 h-4" />}
            label="Active Board"
            href={`/projects/${teamSlug}/issues`}
            isActive={pathname.includes("/issues")}
            isCollapsed={isCollapsed}
          />
          <SidebarItem
            icon={<Hexagon className="w-4 h-4" />}
            label="Siklus Eksekusi"
            href={`/projects/${teamSlug}/execution`}
            isActive={pathname.includes("/execution")}
            isCollapsed={isCollapsed}
          />
          <SidebarItem
            icon={<Bug className="w-4 h-4" />}
            label="Bug & Triage"
            href={`/projects/${teamSlug}/triage`}
            isActive={pathname.includes("/triage")}
            isCollapsed={isCollapsed}
          />
        </div>

        <GroupHeader label="Monitoring" isCollapsed={isCollapsed} />
        <div className="space-y-1">
          <SidebarItem
            icon={<BarChart2 className="w-4 h-4" />}
            label="Pantau Kinerja (Analytics)"
            href={`/projects/${teamSlug}/analytics`}
            isActive={pathname.includes("/analytics")}
            isCollapsed={isCollapsed}
          />
          <SidebarItem
            icon={<Users className="w-4 h-4" />}
            label="Tim & Anggota"
            href={`/projects/${teamSlug}/team`}
            isActive={pathname.includes("/team")}
            isCollapsed={isCollapsed}
          />
        </div>

        <GroupHeader label="Konfigurasi" isCollapsed={isCollapsed} />
        <div className="space-y-1">
          <SidebarItem
            icon={<SettingsIcon className="w-4 h-4" />}
            label="Project Settings"
            href={`/projects/${teamSlug}/settings`}
            isActive={pathname.includes(`/${teamSlug}/settings`)}
            isCollapsed={isCollapsed}
          />
        </div>
      </div>
      {/* Theme Ornaments */}
      {visualTheme === "school" && <SchoolSidebarOrnament />}
      {visualTheme === "work" && <WorkSidebarOrnament />}
    </aside>
  );
};
