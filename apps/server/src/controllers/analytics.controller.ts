import { analyticsService } from "../services/analytics.service";

export const analyticsController = {
  async getTeamAnalytics({ teamId, query }: any) {
    const result = await analyticsService.getTeamAnalytics(
      teamId,
      query.from,
      query.to,
    );
    return result;
  },
};
