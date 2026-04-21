import { apiClient } from "./http";
import type { User } from "@/types";

interface UserWithTeams extends User {
  teams: Array<{ id: string; slug: string; name: string; role: string }>;
}

interface UpdateProfilePayload {
  name?: string;
  avatar?: string;
}

export interface UserActivity {
  activities: Array<{ date: string; count: number }>;
  stats: {
    totalLast30Days: number;
    currentStreak: number;
    dailyAverage: number;
  };
}

export const usersApi = {
  getMe: (): Promise<UserWithTeams> => apiClient<UserWithTeams>("/users/me"),

  updateMe: (payload: UpdateProfilePayload): Promise<UserWithTeams> =>
    apiClient<UserWithTeams>("/users/me", {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  getUserActivity: (): Promise<UserActivity> =>
    apiClient<UserActivity>("/users/me/activity"),
};
