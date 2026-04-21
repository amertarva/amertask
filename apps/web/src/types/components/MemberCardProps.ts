import React from "react";

export interface MemberCardProps {
  id: string;
  name: string;
  role: string;
  email: string;
  initials: string;
  avatar?: string;
  joinedAt: string;
  teamSlug: string;
  canShowActions?: boolean;
  canRemoveMember?: boolean;
  canLeaveTeam?: boolean;
  isActionLoading?: boolean;
  onRemoveMember?: () => void;
  onLeaveTeam?: () => void;
}
