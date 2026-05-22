export interface BacklogItem {
  id: string;
  issueId: string;
  featureName: string;
  description?: string;
  targetUser?: string;
  priority?: string;
  priorityClass?: string;
  reason?: string;
  status?: string;
  executionIssueId?: string;
}
