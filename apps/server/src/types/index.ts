// Shared TypeScript types

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  initials: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Team {
  id: string;
  slug: string;
  name: string;
  avatar: string | null;
  ownerId: string;
  type: "konstruksi" | "it" | "tugas";
  startDate: string | null;
  endDate: string | null;
  company: string | null;
  workArea: string | null;
  description: string | null;
  githubRepo: string | null;
  googleDocsUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: "owner" | "admin" | "member" | "pm";
  joinedAt: string;
}

export interface Issue {
  id: string;
  number: number;
  teamId: string;
  title: string;
  description: string | null;
  status:
    | "backlog"
    | "todo"
    | "in_progress"
    | "in_review"
    | "bug"
    | "done"
    | "cancelled";
  priority: "urgent" | "high" | "medium" | "low";
  labels: string[];
  assigneeId: string | null;
  createdById: string;
  parentIssueId: string | null;
  source: "slack" | "email" | "manual";
  isTriaged: boolean;
  reason: string | null;
  triageReason: string | null;
  planInfo: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string | null;
  issueId: string | null;
  teamId: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface JWTPayload {
  sub: string;
  email: string;
  name: string;
  type?: string;
  teamId?: string;
  teamSlug?: string;
  teamName?: string;
  role?: "owner" | "admin" | "member" | "pm";
  invitedBy?: string;
  iat?: number;
  exp?: number;
}

export interface IssueFilters {
  status?: string;
  priority?: string;
  labels?: string;
  assigneeId?: string;
  search?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  page?: number;
  limit?: number;
}
