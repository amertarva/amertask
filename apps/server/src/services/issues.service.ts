export {
  listIssues,
  getIssueById,
  getTeamIdFromSlug,
} from "./issues/issues-query.service";
export type { IssueListParams } from "./issues/issues-query.service";
export {
  createIssue,
  updateIssue,
  deleteIssue,
} from "./issues/issues-mutate.service";
export type { CreateIssuePayload } from "./issues/issues-mutate.service";

import {
  listIssues,
  getIssueById,
  getTeamIdFromSlug,
} from "./issues/issues-query.service";
import {
  createIssue,
  updateIssue,
  deleteIssue,
} from "./issues/issues-mutate.service";
import type { IssueFilters } from "../types";

export const issuesService = {
  async list(teamIdentifier: string, filters: IssueFilters) {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    let teamId = teamIdentifier;
    if (!isUuid.test(teamIdentifier)) {
      const resolvedId = await getTeamIdFromSlug(teamIdentifier);
      if (!resolvedId) {
        const page = Math.max(1, filters.page || 1);
        const limit = Math.min(filters.limit || 20, 100);
        return {
          issues: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
          },
        };
      }
      teamId = resolvedId;
    }

    return listIssues(teamId, filters);
  },

  getById: getIssueById,
  create: createIssue,
  update: updateIssue,
  remove: deleteIssue,
};
