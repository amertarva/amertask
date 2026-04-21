"use client";

import React, { useState } from "react";
import { UserPlus, Loader2, AlertCircle } from "lucide-react";
import { MemberCard } from "@/components/dashboard/team/MemberCard";
import { InviteMemberModal } from "@/components/dashboard/team/join/InviteMemberModal";
import { useParams, useRouter } from "next/navigation";
import { useTeamMembers, useTeams } from "@/hooks/useTeams";
import { useAuthContext } from "@/contexts/AuthContext";
import { ApiError, teamsApi } from "@/lib/core";

export function TeamDirectory() {
  const router = useRouter();
  const params = useParams();
  const teamSlug = String(params?.teamSlug || "");
  const { user } = useAuthContext();
  const { teams, refetch: refetchTeams } = useTeams();
  const {
    members,
    isLoading,
    error,
    refetch: refetchMembers,
  } = useTeamMembers(teamSlug);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [actionMemberId, setActionMemberId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const currentUserId = String(user?.id || "");

  const currentTeam = teams.find(
    (team) => String(team.slug || "").toLowerCase() === teamSlug.toLowerCase(),
  );
  const currentUserRole = String(currentTeam?.role || "").toLowerCase();

  const canInviteMembers = ["owner", "admin", "pm"].includes(currentUserRole);

  const getActionErrorMessage = (err: unknown, fallback: string) =>
    err instanceof ApiError ? err.message : fallback;

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    const shouldRemove = window.confirm(
      `Keluarkan ${memberName} dari tim ini?`,
    );

    if (!shouldRemove) {
      return;
    }

    setActionMemberId(memberId);
    setActionError(null);

    try {
      await teamsApi.removeMember(teamSlug, memberId);
      await refetchMembers();
    } catch (err) {
      setActionError(
        getActionErrorMessage(err, "Gagal mengeluarkan anggota dari tim."),
      );
    } finally {
      setActionMemberId(null);
    }
  };

  const handleLeaveTeam = async () => {
    const shouldLeave = window.confirm("Anda yakin ingin keluar dari tim ini?");

    if (!shouldLeave) {
      return;
    }

    if (currentUserId) {
      setActionMemberId(currentUserId);
    }

    setActionError(null);

    try {
      await teamsApi.leaveTeam(teamSlug);
      await refetchTeams();
      router.push("/home");
    } catch (err) {
      setActionError(getActionErrorMessage(err, "Gagal keluar dari tim."));
      setActionMemberId(null);
    }
  };

  if (!teamSlug) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-priority-urgent mx-auto" />
          <p className="text-text-muted">Tim tidak ditemukan</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-text-muted">Memuat anggota tim...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-priority-urgent mx-auto" />
          <p className="text-text-muted">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background p-6 lg:p-8 animate-fade-in overflow-y-auto w-full">
      <div className="flex justify-between items-center mb-8 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-text tracking-tight">
            Anggota Tim
          </h1>
          <p className="text-text-muted mt-2">
            Kelola akses dan peran untuk {members.length} anggota tim.
          </p>
        </div>
        {canInviteMembers ? (
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold px-5 py-2.5 rounded-xl transition-all shadow-sm"
          >
            <UserPlus className="w-5 h-5" /> Undang Anggota Baru
          </button>
        ) : null}
      </div>

      {actionError ? (
        <div className="mb-6 rounded-xl border border-priority-urgent/40 bg-priority-urgent/10 p-3 text-sm font-medium text-priority-urgent">
          {actionError}
        </div>
      ) : null}

      {members.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="w-16 h-16 text-text-muted mb-4" />
          <h3 className="text-xl font-bold text-text mb-2">
            Belum Ada Anggota
          </h3>
          <p className="text-text-muted mb-6">
            Mulai undang anggota untuk berkolaborasi dalam tim ini.
          </p>
          {canInviteMembers ? (
            <button
              onClick={() => setIsInviteModalOpen(true)}
              className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold px-5 py-2.5 rounded-xl transition-all shadow-sm"
            >
              <UserPlus className="w-5 h-5" /> Undang Anggota Pertama
            </button>
          ) : null}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {members.map((member) => {
            const memberRole = String(member.role || "member").toLowerCase();
            const isSelf = currentUserId !== "" && member.id === currentUserId;
            const canRemoveMember =
              ["owner", "admin", "pm"].includes(currentUserRole) &&
              memberRole === "member" &&
              !isSelf;
            const canLeaveTeam = isSelf && currentUserRole !== "owner";
            const canShowActions =
              currentUserRole === "member"
                ? isSelf
                : canRemoveMember || canLeaveTeam;

            return (
              <MemberCard
                key={member.id}
                id={member.id}
                name={member.name}
                role={member.role}
                email={member.email}
                initials={member.initials}
                avatar={member.avatar}
                joinedAt={member.joinedAt}
                teamSlug={teamSlug}
                canShowActions={canShowActions}
                canRemoveMember={canRemoveMember}
                canLeaveTeam={canLeaveTeam}
                isActionLoading={actionMemberId === member.id}
                onRemoveMember={() =>
                  void handleRemoveMember(member.id, member.name)
                }
                onLeaveTeam={() => void handleLeaveTeam()}
              />
            );
          })}
        </div>
      )}

      {canInviteMembers ? (
        <InviteMemberModal
          isOpen={isInviteModalOpen}
          teamSlug={teamSlug}
          onClose={() => setIsInviteModalOpen(false)}
        />
      ) : null}
    </div>
  );
}
