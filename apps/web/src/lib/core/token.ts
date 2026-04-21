const ACCESS_TOKEN_KEY = "amertask_access_token";
const REFRESH_TOKEN_KEY = "amertask_refresh_token";
export const AUTH_TOKEN_CHANGED_EVENT = "amertask:auth:token-changed";

export const tokenStorage = {
  getAccess: (): string | null =>
    typeof window !== "undefined"
      ? localStorage.getItem(ACCESS_TOKEN_KEY)
      : null,

  getRefresh: (): string | null =>
    typeof window !== "undefined"
      ? localStorage.getItem(REFRESH_TOKEN_KEY)
      : null,

  setTokens: (accessToken: string, refreshToken: string): void => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent(AUTH_TOKEN_CHANGED_EVENT, {
          detail: { type: "set" },
        }),
      );
    }
  },

  clearTokens: (): void => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent(AUTH_TOKEN_CHANGED_EVENT, {
          detail: { type: "clear" },
        }),
      );
    }
  },

  hasTokens: (): boolean =>
    Boolean(
      typeof window !== "undefined" &&
      localStorage.getItem(ACCESS_TOKEN_KEY) &&
      localStorage.getItem(REFRESH_TOKEN_KEY),
    ),
};
