// Export types
export type {
  TeamInviteRole,
  Team,
  TeamMember,
  TeamStats,
  TeamInviteData,
  CreateTeamPayload,
  UpdateTeamSettingsPayload,
} from "./teams/teams-types";

// Export query functions
import {
  getUserTeams,
  getTeamBySlug,
  getTeamStats,
  getTeamMembers,
  getTeamMemberDetail,
} from "./teams/teams-query.service";

// Export mutate functions
import {
  createTeam,
  updateTeamSettings,
  deleteTeam,
} from "./teams/teams-mutate.service";

// Export member management functions
import { removeTeamMember, leaveTeam } from "./teams/teams-members.service";

// Export invite functions
import {
  createTeamInviteLink,
  previewTeamInvite,
  acceptTeamInvite,
  rejectTeamInvite,
} from "./teams/teams-invite.service";

// Export main service object
export const teamsService = {
  // Query operations
  getUserTeams,
  getTeamBySlug,
  getTeamStats,
  getTeamMembers,
  getTeamMemberDetail,

  // Mutation operations
  createTeam,
  updateTeamSettings,
  deleteTeam,

  // Member management
  removeTeamMember,
  leaveTeam,

  // Invite system
  createTeamInviteLink,
  previewTeamInvite,
  acceptTeamInvite,
  rejectTeamInvite,
};
