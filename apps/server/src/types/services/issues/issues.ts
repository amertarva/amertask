export interface CreateIssuePayload {
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  labels?: string[];
  assigneeId?: string;
  parentIssueId?: string;
  source?: string;
  isTriaged?: boolean;
  reason?: string;
  // NOTE: reason, triageReason, planInfo moved to separate tables
  // Use issue_triage and issue_planning tables instead
}
