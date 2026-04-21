import { tokenStorage } from "./token";

const DEFAULT_BASE_URL = "/api";

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function normalizeBaseUrl(rawValue: string): string {
  const trimmed = trimTrailingSlash(rawValue.trim());

  if (!trimmed) {
    return DEFAULT_BASE_URL;
  }

  if (trimmed.startsWith("/")) {
    return trimmed;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  console.warn(
    `⚠️ NEXT_PUBLIC_API_URL='${rawValue}' tidak valid (harus URL absolut http/https atau path relatif '/api'). Fallback ke ${DEFAULT_BASE_URL}.`,
  );

  return DEFAULT_BASE_URL;
}

function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${BASE_URL}${normalizedPath}`;
}

const BASE_URL = normalizeBaseUrl(process.env.NEXT_PUBLIC_API_URL ?? "");

console.log("🔧 BASE_URL configured:", BASE_URL);

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Flag untuk mencegah multiple refresh request serentak
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function attemptTokenRefresh(): Promise<boolean> {
  if (isRefreshing && refreshPromise) return refreshPromise;

  isRefreshing = true;
  refreshPromise = (async () => {
    const refreshToken = tokenStorage.getRefresh();
    if (!refreshToken) return false;

    try {
      const res = await fetch(buildApiUrl("/auth/refresh"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) {
        tokenStorage.clearTokens();
        return false;
      }

      const data = await res.json();
      tokenStorage.setTokens(data.accessToken, data.refreshToken);
      return true;
    } catch {
      tokenStorage.clearTokens();
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function apiClient<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const makeRequest = async (withToken: boolean): Promise<Response> => {
    const token = tokenStorage.getAccess();
    const url = buildApiUrl(path);

    console.log("🌐 API Request:", {
      url,
      method: options.method || "GET",
      hasToken: !!token,
      tokenPreview: token ? `${token.substring(0, 20)}...` : "none",
    });

    return fetch(url, {
      ...options,
      cache: options.cache ?? "no-store",
      headers: {
        "Content-Type": "application/json",
        ...(withToken && token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  };

  let res = await makeRequest(true);

  console.log("📡 API Response:", {
    status: res.status,
    contentType: res.headers.get("content-type"),
    url: res.url,
  });

  // Auto-refresh: jika 401, coba refresh sekali lalu retry
  if (res.status === 401) {
    const refreshed = await attemptTokenRefresh();
    if (refreshed) {
      res = await makeRequest(true);
    } else {
      // Sesi habis — DISABLED redirect untuk development
      if (typeof window !== "undefined") {
        tokenStorage.clearTokens();
        console.warn("⚠️ Session expired - redirect disabled for development");
        // window.location.href = "/"; // DISABLED for development
      }
      throw new ApiError(
        401,
        "UNAUTHORIZED",
        "Sesi berakhir. Silakan login kembali.",
      );
    }
  }

  if (!res.ok) {
    let errorPayload: { error?: string; message?: string } = {};
    const contentType = res.headers.get("content-type");

    // Check if response is JSON
    if (contentType && contentType.includes("application/json")) {
      try {
        errorPayload = await res.json();
      } catch (e) {
        console.error("Failed to parse error response:", e);
      }
    } else {
      // Response is not JSON (probably HTML error page)
      const text = await res.text();
      console.error("Non-JSON response:", text.substring(0, 200));
      throw new ApiError(
        res.status,
        "INVALID_RESPONSE",
        "Server mengembalikan response yang tidak valid. Pastikan backend berjalan.",
      );
    }

    throw new ApiError(
      res.status,
      errorPayload.error ?? "UNKNOWN_ERROR",
      errorPayload.message ?? "Terjadi kesalahan. Coba lagi.",
    );
  }

  // Untuk respons 204 No Content
  if (res.status === 204) return undefined as T;

  const contentType = res.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    const text = await res.text();
    console.error("Expected JSON but got:", text.substring(0, 200));
    throw new ApiError(
      500,
      "INVALID_RESPONSE",
      "Server mengembalikan response yang tidak valid.",
    );
  }

  return res.json() as Promise<T>;
}
