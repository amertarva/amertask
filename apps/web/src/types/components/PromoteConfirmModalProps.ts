import type { PlanningUIItem } from "./PlanningContainerTypes";

export interface PromoteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: PlanningUIItem | null;
  onConfirm: (
    item: PlanningUIItem,
  ) => Promise<{ success: boolean; message: string; issueNumber?: number }>;
  teamSlug: string;
}
