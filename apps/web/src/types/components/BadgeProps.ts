import type { IssueStatus } from "../constants/IssueStatus";
import type { IssuePriority } from "../constants/IssuePriority";
import type { IssueLabel } from "../constants/IssueLabel";

export interface BadgeProps {
  variant: "status" | "priority" | "label";
  value: IssueStatus | IssuePriority | IssueLabel;
  showIcon?: boolean;
  className?: string;
}
