"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PlusCircle,
  Settings,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useThemeStore } from "@/store/useThemeStore";
import { SchoolSidebarOrnament } from "@/components/themes/SchoolOrnaments";
import { WorkSidebarOrnament } from "@/components/themes/WorkOrnaments";
import type { SidebarItemProps, OnboardingSidebarProps } from "@/types";

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
          "flex-shrink-0 transition-colors",
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

export const OnboardingSidebar: React.FC<OnboardingSidebarProps> = ({
  isCollapsed = false,
}) => {
  const pathname = usePathname();
  const { visualTheme } = useThemeStore();

  return (
    <aside
      className={cn(
        "border-r border-border bg-background flex flex-col h-full overflow-y-auto transition-all duration-300 relative",
        isCollapsed ? "w-20" : "w-64",
      )}
    >
      <div className="px-4 pb-4 mt-4 flex-1">
        <GroupHeader label="Navigasi Utama" isCollapsed={isCollapsed} />
        <div className="space-y-1">
          <SidebarItem
            icon={<LayoutDashboard className="w-4 h-4" />}
            label="Beranda Portal"
            href="/home"
            isActive={pathname === "/home"}
            isCollapsed={isCollapsed}
          />
          <SidebarItem
            icon={<PlusCircle className="w-4 h-4" />}
            label="Buat Proyek Baru"
            href="/home/new-project"
            isActive={pathname.includes("/new-project")}
            isCollapsed={isCollapsed}
          />
        </div>

        <GroupHeader label="Personal" isCollapsed={isCollapsed} />
        <div className="space-y-1">
          <SidebarItem
            icon={<Settings className="w-4 h-4" />}
            label="Pengaturan Akun"
            href="/home/settings"
            isActive={pathname.includes("/settings")}
            isCollapsed={isCollapsed}
          />
        </div>
      </div>

      <div className="p-4 mb-4 mt-auto">
        {!isCollapsed && (
          <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 text-center space-y-2 group cursor-pointer hover:bg-primary/10 transition-colors">
            <div className="w-10 h-10 bg-primary/10 rounded-full mx-auto flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <HelpCircle className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-extrabold text-text">Pusat Bantuan</h4>
            <p className="text-xs font-semibold text-text-muted">
              Pelajari panduan memulai Amertask
            </p>
          </div>
        )}
      </div>

      {/* Theme Ornaments */}
      {visualTheme === "school" && <SchoolSidebarOrnament />}
      {visualTheme === "work" && <WorkSidebarOrnament />}
    </aside>
  );
};
