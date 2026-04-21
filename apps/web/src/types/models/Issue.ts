import type { User } from "./User";
import type { IssueLink } from "./IssueLink";
import type { IssueComment } from "./IssueComment";
import type { IssueStatus } from "../constants/IssueStatus";
import type { IssuePriority } from "../constants/IssuePriority";
import type { IssueLabel } from "../constants/IssueLabel";

export interface Issue {
  id: string;
  number: number; // ENG-41 → number: 41
  teamId: string;
  teamSlug: string; // "ENG"
  title: string;
  description?: string; // Markdown / rich text
  status: IssueStatus;
  priority: IssuePriority;
  labels: IssueLabel[];
  assigneeId?: string;
  assignee?: User;
  createdById: string;
  createdBy?: User;
  parentIssueId?: string;
  parentIssue?: Pick<Issue, "id" | "number" | "title" | "status">;
  subIssues?: Pick<Issue, "id" | "number" | "title" | "status">[];
  blockedBy?: Pick<Issue, "id" | "number" | "title">[];
  blocks?: Pick<Issue, "id" | "number" | "title">[];
  links?: IssueLink[];
  comments?: IssueComment[];
  createdAt: string;
  updatedAt: string;
  // Triage-specific
  source?: "slack" | "email" | "manual";
  isTriaged?: boolean;
  triageReason?: string; // Alasan terkendala untuk antrean triage
  // Planning & Backlog specific
  reason?: string; // Alasan prioritas untuk priority backlog
  planInfo?: string; // Informasi planning / expected output
}
