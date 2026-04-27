export interface PlanningUIItem {
  id: string;
  planningId: string;
  number: number;
  taskName: string;
  featureName: string;
  description: string;
  expectedOutput: string[];
  assignedUser: string;
  assigneeId: string;
  avatar: string;
  status: string;
  priority: string;
  startDate?: string;
  dueDate?: string;
  estimatedHours?: number;
}

export interface EditFormData {
  featureName?: string;
  taskName?: string;
  expectedOutput: string[];
  assigneeId: string;
  priority: string;
  status: string;
  startDate?: string;
  dueDate?: string;
  estimatedHours?: number;
}
