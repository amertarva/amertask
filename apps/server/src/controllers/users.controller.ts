import { usersService } from "../services/users.service";

export const usersController = {
  async getMe({ currentUser }: any) {
    const profile = await usersService.getProfile(
      currentUser.sub,
      currentUser.email,
    );
    return profile;
  },

  async updateMe({ currentUser, body }: any) {
    const profile = await usersService.updateProfile(
      currentUser.sub,
      body,
      currentUser.email,
    );
    return profile;
  },

  async getActivity({ currentUser, query }: any) {
    const days = parseInt(query.days || "365");
    const activity = await usersService.getUserActivity(
      currentUser.sub,
      days,
      currentUser.email,
    );
    return activity;
  },
};
