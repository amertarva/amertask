export interface JoinTeamInviteAlertProps {
  onJoined?: (teamSlug: string) => Promise<void> | void;
  refreshTeams?: () => Promise<void>;
}

export type InvitePreview = {
  team: {
    id: string;
    slug: string;
    name: string;
  };
  role: "admin" | "member" | "pm";
  expiresAt: string | null;
  alreadyMember: boolean;
  existingRole: string | null;
};
