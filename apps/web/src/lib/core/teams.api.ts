import { apiClient } from "./http";
import type { Team } from "@/types";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  initials: string;
  role: "owner" | "admin" | "member" | "pm";
  joinedAt: string;
}

interface TeamMemberDetail extends TeamMember {}

interface TeamStats {
  totalIssues: number;
  openIssues: number;
  inProgress: number;
  completed: number;
  cancelled: number;
}

interface TeamDetail extends Team {
  type: string;
  startDate?: string;
  endDate?: string;
  stats: TeamStats;
}

interface ProjectSettings {
  id: string;
  teamId: string;
  name: string;
  slug: string;
  type: "konstruksi" | "it" | "tugas";
  startDate?: string;
  endDate?: string;
  projectManagerId?: string;
  company?: string;
  workArea?: string;
  description?: string;
  integrations: {
    githubRepo?: string;
    googleDocsUrl?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface UpdateSettingsPayload {
  name?: string;
  slug?: string;
  type?: "konstruksi" | "it" | "tugas";
  startDate?: string;
  endDate?: string;
  projectManagerId?: string;
  company?: string;
  workArea?: string;
  description?: string;
  integrations?: {
    githubRepo?: string;
    googleDocsUrl?: string;
  };
}

interface CreateTeamPayload {
  slug: string;
  name: string;
  type?: "konstruksi" | "it" | "tugas";
}

interface DeleteTeamResponse {
  success: boolean;
  message: string;
  project: {
    id: string;
    slug: string;
    name: string;
  };
}

type TeamInviteRole = "admin" | "member" | "pm";

interface TeamInviteLinkResponse {
  inviteToken: string;
  inviteUrl: string;
  role: TeamInviteRole;
  expiresAt: string;
  team: {
    id: string;
    slug: string;
    name: string;
  };
}

interface TeamInvitePreviewResponse {
  team: {
    id: string;
    slug: string;
    name: string;
  };
  role: TeamInviteRole;
  expiresAt: string | null;
  alreadyMember: boolean;
  existingRole: string | null;
}

interface TeamInviteAcceptResponse {
  joined: boolean;
  alreadyMember: boolean;
  membershipRole: string;
  team: {
    id: string;
    slug: string;
    name: string;
  };
}

interface TeamInviteRejectResponse {
  rejected: boolean;
  message: string;
  team: {
    slug: string;
    name: string;
  };
}

interface TeamRemoveMemberResponse {
  success: boolean;
  message: string;
  removed: boolean;
  teamId: string;
  member: {
    id: string;
    role: string;
    name: string | null;
    email: string | null;
  };
}

interface TeamLeaveResponse {
  success: boolean;
  message: string;
  left: boolean;
  teamId: string;
  userId: string;
  removedMemberships: number;
}

export const teamsApi = {
  list: (): Promise<(Team & { role: string })[]> => apiClient("/teams"),

  create: (payload: CreateTeamPayload): Promise<Team> =>
    apiClient("/teams", { method: "POST", body: JSON.stringify(payload) }),

  getBySlug: (teamSlug: string): Promise<TeamDetail> =>
    apiClient(`/teams/${teamSlug}`),

  getMembers: (teamSlug: string): Promise<{ members: TeamMember[] }> =>
    apiClient(`/teams/${teamSlug}/members`),

  getMemberDetail: (
    teamSlug: string,
    memberId: string,
  ): Promise<{ member: TeamMemberDetail }> =>
    apiClient(`/teams/${teamSlug}/members/${memberId}`),

  removeMember: (
    teamSlug: string,
    memberId: string,
  ): Promise<TeamRemoveMemberResponse> =>
    apiClient(`/teams/${teamSlug}/members/${memberId}`, {
      method: "DELETE",
    }),

  leaveTeam: (teamSlug: string): Promise<TeamLeaveResponse> =>
    apiClient(`/teams/${teamSlug}/leave`, {
      method: "POST",
    }),

  getSettings: (teamSlug: string): Promise<ProjectSettings> =>
    apiClient(`/teams/${teamSlug}/settings`),

  updateSettings: (
    teamSlug: string,
    payload: UpdateSettingsPayload,
  ): Promise<ProjectSettings> =>
    apiClient(`/teams/${teamSlug}/settings`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  remove: (teamSlug: string): Promise<DeleteTeamResponse> =>
    apiClient(`/teams/${teamSlug}`, {
      method: "DELETE",
    }),

  createInvite: (
    teamSlug: string,
    payload?: {
      role?: TeamInviteRole;
      expiresInHours?: number;
    },
  ): Promise<TeamInviteLinkResponse> =>
    apiClient(`/teams/${teamSlug}/invite`, {
      method: "POST",
      body: JSON.stringify(payload ?? {}),
    }),

  previewInvite: (token: string): Promise<TeamInvitePreviewResponse> =>
    apiClient("/teams/invitations/preview", {
      method: "POST",
      body: JSON.stringify({ token }),
    }),

  acceptInvite: (token: string): Promise<TeamInviteAcceptResponse> =>
    apiClient("/teams/invitations/accept", {
      method: "POST",
      body: JSON.stringify({ token }),
    }),

  rejectInvite: (token: string): Promise<TeamInviteRejectResponse> =>
    apiClient("/teams/invitations/reject", {
      method: "POST",
      body: JSON.stringify({ token }),
    }),
};
