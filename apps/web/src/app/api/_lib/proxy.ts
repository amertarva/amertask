const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:3000";

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
