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
  console.warn(
    "⚠️ BACKEND_URL belum valid. Set BACKEND_URL ke URL backend absolut agar route /api/* dapat mem-forward request.",
  );
}

export { BACKEND_URL };

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
