import type { User } from "./User";

export interface IssueComment {
  id: string;
  issueId: string;
  authorId: string;
  author?: User;
  content: string;
  createdAt: string;
  source?: "slack" | "email" | "manual";
}
