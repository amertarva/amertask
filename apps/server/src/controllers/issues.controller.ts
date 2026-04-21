import { issuesService } from "../services/issues.service";
import { notificationsService } from "../services/notifications.service";

export const issuesController = {
  async list({ teamId, query }: any) {
    const result = await issuesService.list(teamId, query);
    return result;
  },

  async getById({ params }: any) {
    const issue = await issuesService.getById(params.id);
    return issue;
  },

  async create({ teamId, currentUser, body }: any) {
    const issue = await issuesService.create(teamId, currentUser.sub, body);

    // Create notification if assigned (in-memory)
    if (issue.assignee_id && issue.assignee_id !== currentUser.sub) {
      notificationsService.createNotification({
        userId: issue.assignee_id,
        type: "issue_assigned",
        title: `Anda di-assign ke issue #${issue.number}`,
        body: issue.title,
        issueId: issue.id,
        teamId: teamId,
      });
    }

    return issue;
  },

  async update({ params, body, currentUser }: any) {
    const oldIssue = await issuesService.getById(params.id);
    const issue = await issuesService.update(params.id, body);

    // Create notification if assignee changed (in-memory)
    if (
      body.assigneeId &&
      body.assigneeId !== oldIssue.assignee_id &&
      body.assigneeId !== currentUser.sub
    ) {
      notificationsService.createNotification({
        userId: body.assigneeId,
        type: "issue_assigned",
        title: `Anda di-assign ke issue #${issue.number}`,
        body: issue.title,
        issueId: issue.id,
        teamId: issue.team_id,
      });
    }

    return issue;
  },

  async remove({ params }: any) {
    await issuesService.remove(params.id);
    return { message: "Issue berhasil dihapus" };
  },
};
