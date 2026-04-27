export type TeamInviteRole = "admin" | "member" | "pm";

export interface InviteMemberModalProps {
  isOpen: boolean;
  teamSlug: string;
  onClose: () => void;
}
