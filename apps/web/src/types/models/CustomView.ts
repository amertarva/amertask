import type { IssueFilters } from "./IssueFilters";
import type { IssueSortKey } from "./IssueSortKey";

export interface CustomView {
  id: string;
  name: string;
  filters: IssueFilters;
  sortBy: IssueSortKey;
  groupBy?: "status" | "priority" | "label" | "assignee";
  isPinned?: boolean;
}
