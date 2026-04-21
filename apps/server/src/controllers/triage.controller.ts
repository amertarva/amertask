import { triageService } from "../services/triage.service";

export const triageController = {
  async list({ teamId }: any) {
    const result = await triageService.getTriageIssues(teamId);
    return result;
  },

  async accept({ params, body }: any) {
    const issue = await triageService.acceptIssue(params.id, body);
    return issue;
  },

  async decline({ params, body }: any) {
    const issue = await triageService.declineIssue(params.id, body?.reason);
    return { message: "Issue ditolak", issueId: issue.id };
  },
};
