export interface PlanningGoalProps {
  totalItems: number;
  todoItems: number;
  inProgressItems: number;
  doneItems: number;
  inExecutionItems: number;
  plannings?: Array<{
    id: string;
    status: string;
    startDate?: string | null;
    dueDate?: string | null;
    estimatedHours?: number;
  }>;
}
