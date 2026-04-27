export interface PlanningItem {
  id: string;
  number: number;
  featureName: string;
  status: string;
  avatar: string;
  assignedUser: string;
  startDate?: string;
  dueDate?: string;
  estimatedHours?: number;
  expectedOutput: string | string[];
}

export interface PlanningTableProps {
  plannings: PlanningItem[];
  mounted: boolean;
  teamSlug: string;
  onEdit: (item: PlanningItem) => void;
  onDelete: (id: string) => void;
  onPromote: (item: PlanningItem) => void;
}
