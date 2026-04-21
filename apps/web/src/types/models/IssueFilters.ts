import type { IssueStatus } from "../constants/IssueStatus";
import type { IssuePriority } from "../constants/IssuePriority";
import type { IssueLabel } from "../constants/IssueLabel";

export interface IssueFilters {
  status?: IssueStatus[];
  priority?: IssuePriority[];
  labels?: IssueLabel[];
  assigneeId?: string;
  search?: string;
}
