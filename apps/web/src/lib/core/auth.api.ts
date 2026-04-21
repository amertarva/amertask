import { apiClient } from "./http";
import { tokenStorage } from "./token";
import type { User } from "@/types";

interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

interface LoginPayload {
  email: string;
  password: string;
}

export const authApi = {
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const data = await apiClient<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    tokenStorage.setTokens(data.accessToken, data.refreshToken);
    return data;
  },

  async login(payload: LoginPayload): Promise<AuthResponse> {
    const data = await apiClient<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    tokenStorage.setTokens(data.accessToken, data.refreshToken);
    return data;
  },

  async logout(): Promise<void> {
    try {
      await apiClient("/auth/logout", {
        method: "POST",
      });
    } catch {
      /* abaikan error logout, tetap clear token */
    }
    tokenStorage.clearTokens();
  },
};
