export const PLANNING_STATUSES = ["To Do", "In Progress", "Done"] as const;
export type PlanningStatus = (typeof PLANNING_STATUSES)[number];
