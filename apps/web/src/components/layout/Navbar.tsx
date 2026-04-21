// components/layout/Navbar.tsx
"use client";

import React from "react";
import { Search, Hexagon, Menu, LogOut, Settings } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useThemeStore } from "@/store/useThemeStore";
import { useAuth } from "@/hooks/useAuth";
import { SchoolNavbarOrnament } from "@/components/themes/SchoolOrnaments";
import { WorkNavbarOrnament } from "@/components/themes/WorkOrnaments";
import { Dropdown } from "@/components/ui/Dropdown";
import type { NavbarProps } from "@/types";

export const Navbar: React.FC<NavbarProps> = ({
  onMenuToggle,
  isSidebarCollapsed,
}) => {
  const router = useRouter();
  const { visualTheme } = useThemeStore();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const handleOpenSettings = () => {
    router.push("/home/settings");
  };

  return (
    <nav className="h-16 border-b border-border bg-card flex items-center justify-between px-4 sticky top-0 z-50 shadow-sm transition-all overflow-visible">
      {/* Theme Ornaments */}
      {visualTheme === "school" && <SchoolNavbarOrnament />}
      {visualTheme === "work" && <WorkNavbarOrnament />}

      {/* Brand & Toggle Side */}
      <div className="flex items-center gap-4 relative z-10">
        <button
          suppressHydrationWarning
          onClick={onMenuToggle}
          className="p-2 rounded-xl text-text-muted hover:bg-muted hover:text-text transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Link href="/home" className="flex items-center gap-3">
          <Image
            src="/company-logos/amertask.svg"
            alt="Amertask Logo"
            width={120}
            height={32}
            className="h-8 w-auto hidden sm:block object-contain"
          />
        </Link>
      </div>

      {/* Global Search Side */}
      <div className="w-full max-w-md mx-6 relative z-10">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
        <input
          suppressHydrationWarning
          type="text"
          placeholder="Cari workspace atau tiket..."
          className="w-full h-10 pl-10 pr-4 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all text-text placeholder:text-text-muted shadow-inner"
        />
      </div>

      {/* Profile/Actions */}
      <div className="flex items-center gap-3 border-l border-border pl-4 relative z-10">
        {user ? (
          <div className="w-8">
            <Dropdown
              align="right"
              trigger={
                <button
                  type="button"
                  title={user.name}
                  className="w-8 h-8 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors text-primary font-bold text-xs flex items-center justify-center border border-primary/20 cursor-pointer shadow-sm"
                >
                  {user.initials || user.name.charAt(0).toUpperCase()}
                </button>
              }
              items={[
                {
                  label: "Pengaturan Akun",
                  icon: <Settings className="w-4 h-4" />,
                  onClick: handleOpenSettings,
                },
                {
                  label: "Keluar",
                  icon: <LogOut className="w-4 h-4" />,
                  danger: true,
                  onClick: handleLogout,
                },
              ]}
            />
          </div>
        ) : (
          <Link
            href="/auth/login"
            className="w-8 h-8 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors text-primary font-bold text-xs flex items-center justify-center border border-primary/20 cursor-pointer shadow-sm"
          >
            ?
          </Link>
        )}
      </div>
    </nav>
  );
};
