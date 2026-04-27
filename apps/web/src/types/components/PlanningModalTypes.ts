export interface TeamMember {
  id: string;
  name: string;
  role: string;
  initials?: string;
}

export interface EditingItem {
  id?: string;
  number?: number;
}

export interface EditForm {
  id?: string;
  featureName?: string;
  assigneeId?: string;
  assignedUser?: string;
  avatar?: string;
  priority?: string;
  startDate?: string;
  dueDate?: string;
  estimatedHours?: number;
  expectedOutput?: string | string[];
}

export interface PlanningModalProps {
  mounted: boolean;
  editingItem: EditingItem | null;
  isCreating: boolean;
  editForm: EditForm;
  teamMembers: TeamMember[];
  isMembersLoading: boolean;
  teamSlug: string;
  nextPlanningNumber: number;
  setEditForm: (form: EditForm) => void;
  onClose: () => void;
  onSave: () => void;
}
