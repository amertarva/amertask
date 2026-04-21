import React from "react";
import {
  MoreVertical,
  Mail,
  ExternalLink,
  Calendar,
  LogOut,
  UserMinus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { MemberCardProps } from "@/types";
import { Dropdown } from "@/components/ui/Dropdown";
import type { DropdownItem } from "@/types";

// Helper function to get color based on role
const getRoleColor = (role: string) => {
  const roleColors: Record<string, string> = {
    pm: "bg-primary",
    owner: "bg-primary",
    admin: "bg-secondary",
    member: "bg-priority-low",
    developer: "bg-status-in-progress",
    designer: "bg-priority-high",
    qa: "bg-[hsl(var(--label-integrations))]",
  };
  return roleColors[role.toLowerCase()] || "bg-text-muted";
};

// Helper function to format role display
const formatRole = (role: string) => {
  const roleMap: Record<string, string> = {
    pm: "Project Manager",
    owner: "Owner",
    admin: "Administrator",
    member: "Member",
    developer: "Developer",
    designer: "Designer",
    qa: "QA Engineer",
  };
  return roleMap[role.toLowerCase()] || role;
};

// Helper function to format date
const formatJoinedDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("id-ID", {
    year: "numeric",
    month: "short",
  });
};

export function MemberCard({
  id,
  name,
  role,
  email,
  initials,
  avatar,
  joinedAt,
  teamSlug,
  canShowActions = false,
  canRemoveMember = false,
  canLeaveTeam = false,
  isActionLoading = false,
  onRemoveMember,
  onLeaveTeam,
}: MemberCardProps) {
  const roleColor = getRoleColor(role);
  const displayRole = formatRole(role);
  const joinedDateFormatted = formatJoinedDate(joinedAt);

  const actionItems: DropdownItem[] = [];

  if (canRemoveMember && onRemoveMember) {
    actionItems.push({
      label: "Keluarkan Anggota",
      icon: <UserMinus className="w-4 h-4" />,
      danger: true,
      disabled: isActionLoading,
      onClick: onRemoveMember,
    });
  }

  if (canLeaveTeam && onLeaveTeam) {
    if (actionItems.length > 0) {
      actionItems.push({ divider: true });
    }

    actionItems.push({
      label: "Keluar dari Tim",
      icon: <LogOut className="w-4 h-4" />,
      danger: true,
      disabled: isActionLoading,
      onClick: onLeaveTeam,
    });
  }

  const hasActionMenu = canShowActions && actionItems.length > 0;

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative group">
      {hasActionMenu ? (
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-10">
            <Dropdown
              align="right"
              className="w-56"
              trigger={
                <button
                  type="button"
                  aria-label="Aksi anggota"
                  disabled={isActionLoading}
                  className="w-10 h-10 rounded-xl text-text-muted hover:text-text hover:bg-muted/40 transition-colors flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
              }
              items={actionItems}
            />
          </div>
        </div>
      ) : null}

      <div className="flex flex-col items-center text-center">
        <div className="relative mb-4">
          {avatar ? (
            <Image
              src={avatar}
              alt={name}
              width={80}
              height={80}
              className="w-20 h-20 rounded-full object-cover shadow-sm"
            />
          ) : (
            <div
              className={cn(
                "w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-primary-foreground shadow-sm",
                roleColor,
              )}
            >
              {initials}
            </div>
          )}
        </div>
        <h3 className="font-bold text-lg text-text mb-1">{name}</h3>
        <p className="text-sm font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full mb-2">
          {displayRole}
        </p>
        <div className="flex items-center gap-1 text-xs text-text-muted mb-4">
          <Calendar className="w-3 h-3" />
          <span>Bergabung {joinedDateFormatted}</span>
        </div>
        <div className="w-full space-y-2 pt-4 border-t border-border">
          <div className="flex items-center justify-center gap-2 text-sm text-text-muted hover:text-text cursor-pointer transition-colors">
            <Mail className="w-4 h-4" />
            <span className="font-medium truncate">{email}</span>
          </div>
          <Link
            href={`/projects/${teamSlug}/team/${id}`}
            className="flex items-center justify-center gap-2 text-xs font-bold text-text-muted hover:text-primary cursor-pointer transition-colors uppercase tracking-widest mt-2"
          >
            Lihat Profil <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
