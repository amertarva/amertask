function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function normalizeAbsoluteHttpUrl(rawValue: string): string {
  const trimmed = trimTrailingSlash(rawValue.trim());

  if (!trimmed) {
    return "";
  }

  if (!/^https?:\/\//i.test(trimmed)) {
    return "";
  }

  return trimmed;
}

const backendUrlFromEnv = process.env.BACKEND_URL ?? "";
const publicApiUrlFromEnv = process.env.NEXT_PUBLIC_API_URL ?? "";

const normalizedBackendUrl = normalizeAbsoluteHttpUrl(backendUrlFromEnv);
const normalizedPublicApiUrl = normalizeAbsoluteHttpUrl(publicApiUrlFromEnv);

const BACKEND_URL = normalizedBackendUrl || normalizedPublicApiUrl;

if (backendUrlFromEnv.trim() && !normalizedBackendUrl) {
  console.warn(
    `⚠️ BACKEND_URL='${backendUrlFromEnv}' tidak valid. Gunakan URL absolut dengan http/https.`,
  );
}

if (
  !normalizedBackendUrl &&
  publicApiUrlFromEnv.trim() &&
  !normalizedPublicApiUrl
) {
  console.warn(
    `⚠️ NEXT_PUBLIC_API_URL='${publicApiUrlFromEnv}' diabaikan untuk server proxy karena bukan URL absolut.`,
  );
}

if (!BACKEND_URL) {
  console.error(
    "❌ BACKEND_URL belum valid. Set BACKEND_URL ke URL backend absolut (mis. https://api-amertask.vercel.app) agar route /api/* dapat mem-forward request.",
  );
} else {
  try {
    const url = new URL(BACKEND_URL);
    console.log(`🔧 Proxy target initialized: ${url.protocol}//${url.hostname}`);
    
    if ((url.hostname === "localhost" || url.hostname === "127.0.0.1") && process.env.NODE_ENV === "production") {
      console.error("🚨 ERROR: BACKEND_URL mengarah ke localhost di environment PRODUCTION. Ini akan menyebabkan timeout (502).");
    }
  } catch {
    console.error(`❌ BACKEND_URL '${BACKEND_URL}' bukan URL yang valid.`);
  }
}

export { BACKEND_URL };

export function guardBackendUrl(request?: Request): { error: string; message: string } | null {
  if (!BACKEND_URL) {
    return {
      error: "CONFIG_ERROR",
      message: "Backend URL belum dikonfigurasi di Vercel Settings. Hubungi administrator untuk set BACKEND_URL.",
    };
  }

  try {
    const url = new URL(BACKEND_URL);
    
    // Loop detection
    if (request) {
      const currentHost = request.headers.get("host");
      if (currentHost && url.hostname === currentHost.split(":")[0]) {
        return {
          error: "CONFIG_ERROR",
          message: "🚨 Infinite Loop Terdeteksi: BACKEND_URL mengarah ke URL frontend sendiri. Ubah BACKEND_URL ke URL backend (api-amertask.vercel.app).",
        };
      }
    }

    if ((url.hostname === "localhost" || url.hostname === "127.0.0.1") && process.env.NODE_ENV === "production") {
      return {
        error: "CONFIG_ERROR",
        message: "Konfigurasi error: BACKEND_URL masih menggunakan localhost di production. Silakan ubah di Vercel Settings.",
      };
    }
  } catch {
    // Ignore
  }

  return null;
}

const FETCH_TIMEOUT_MS = 12_000;

export async function fetchBackend(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const url = `${BACKEND_URL}${path}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    console.log(`📡 Forwarding request to: ${url}`);
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
    });
    return response;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      const msg = `Backend timeout (>${FETCH_TIMEOUT_MS}ms) saat mengakses ${path}. Pastikan backend di ${BACKEND_URL} sedang berjalan dan dapat diakses.`;
      console.error(`❌ ${msg}`);
      throw new Error(msg);
    }
    console.error(`❌ Fetch error to ${url}:`, error);
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function safeJson(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch {
      return {
        error: "PARSE_ERROR",
        message: "Response bukan JSON valid dari backend",
      };
    }
  }

  const text = await response.text();
  
  // Detect if we got HTML instead of JSON
  if (text.trim().startsWith("<!DOCTYPE") || text.trim().startsWith("<html")) {
    return {
      error: "HTML_RESPONSE_ERROR",
      message: "Proxy menerima HTML bukan JSON. Pastikan BACKEND_URL mengarah ke API (https://api-amertask.vercel.app) bukan ke URL frontend sendiri.",
    };
  }

  return {
    error: "BACKEND_ERROR",
    message: text || "Terjadi kesalahan di server",
  };
}

export function forwardAuth(request: Request): HeadersInit {
  const authHeader = request.headers.get("authorization");

  return {
    "Content-Type": "application/json",
    ...(authHeader ? { Authorization: authHeader } : {}),
  };
}
