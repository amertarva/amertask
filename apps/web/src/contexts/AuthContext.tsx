"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { authApi, usersApi, tokenStorage, ApiError } from "@/lib/core";
import { AUTH_TOKEN_CHANGED_EVENT } from "@/lib/core/token";
import type { User } from "@/types";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface LoginPayload {
  email: string;
  password: string;
}

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

interface AuthContextValue {
  user: User | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [error, setError] = useState<string | null>(null);

  const syncAuthFromStorage = useCallback(async () => {
    if (!tokenStorage.hasTokens()) {
      await Promise.resolve();
      setUser(null);
      setStatus("unauthenticated");
      return;
    }

    try {
      const userData = await usersApi.getMe();
      setUser(userData);
      setStatus("authenticated");
    } catch {
      tokenStorage.clearTokens();
      setUser(null);
      setStatus("unauthenticated");
    }
  }, []);

  useEffect(() => {
    const bootstrapId = window.setTimeout(() => {
      void syncAuthFromStorage();
    }, 0);

    return () => {
      window.clearTimeout(bootstrapId);
    };
  }, [syncAuthFromStorage]);

  useEffect(() => {
    const handleTokenChange = () => {
      setStatus("loading");
      void syncAuthFromStorage();
    };

    const handleStorage = (event: StorageEvent) => {
      if (!event.key) return;
      if (
        event.key === "amertask_access_token" ||
        event.key === "amertask_refresh_token"
      ) {
        setStatus("loading");
        void syncAuthFromStorage();
      }
    };

    window.addEventListener(AUTH_TOKEN_CHANGED_EVENT, handleTokenChange);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(AUTH_TOKEN_CHANGED_EVENT, handleTokenChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, [syncAuthFromStorage]);

  const login = useCallback(async (payload: LoginPayload) => {
    setError(null);
    setStatus("loading");

    try {
      const { user: userData } = await authApi.login(payload);
      setUser(userData);
      setStatus("authenticated");
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Login gagal. Coba lagi.";
      setError(message);
      setUser(null);
      setStatus("unauthenticated");
      throw err;
    }
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    setError(null);
    setStatus("loading");

    try {
      const { user: userData } = await authApi.register(payload);
      setUser(userData);
      setStatus("authenticated");
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Registrasi gagal. Coba lagi.";
      setError(message);
      setUser(null);
      setStatus("unauthenticated");
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
    setStatus("unauthenticated");
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      isAuthenticated: status === "authenticated",
      isLoading: status === "loading",
      error,
      login,
      register,
      logout,
      clearError,
    }),
    [user, status, error, login, register, logout, clearError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }

  return context;
}
