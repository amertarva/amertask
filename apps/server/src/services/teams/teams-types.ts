export type TeamInviteRole = "admin" | "member" | "pm";

export interface Team {
  id: string;
  slug: string;
  name: string;
  avatar: string | null;
  owner_id: string;
  type: string;
  start_date: string | null;
  end_date: string | null;
  company: string | null;
  work_area: string | null;
  description: string | null;
  github_repo: string | null;
  google_docs_url: string | null;
  r_docs: string | null;
  srs_docs: string | null;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  initials: string;
  role: string;
  joinedAt: string;
}

export interface TeamStats {
  totalIssues: number;
  openIssues: number;
  inProgress: number;
  completed: number;
}

export interface TeamInviteData {
  teamId: string;
  teamSlug: string;
  teamName: string;
  role: TeamInviteRole;
  expiresAt: string | null;
}

export interface CreateTeamPayload {
  slug: string;
  name: string;
  type?: string;
}

export interface UpdateTeamSettingsPayload {
  name?: string;
  type?: string;
  start_date?: string | null;
  end_date?: string | null;
  company?: string | null;
  work_area?: string | null;
  description?: string | null;
  github_repo?: string | null;
  google_docs_url?: string | null;
  separate_docs_enabled?: boolean;
  backlog_docs?: string | null;
  planning_docs?: string | null;
  execution_docs?: string | null;
  r_docs?: string | null;
  srs_docs?: string | null;
}
