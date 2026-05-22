export interface BacklogHeaderProps {
  teamSlug: string;
  onCreateClick: (value: boolean) => void;
  onSetEditForm: (value: Record<string, unknown>) => void;
  onSetOpenMenuId: (value: string | null) => void;
}
