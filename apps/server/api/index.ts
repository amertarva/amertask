import { app } from "../src/app";

async function handleRequest(incomingRequest: any): Promise<Response> {
  let request: Request;

  if (incomingRequest && typeof incomingRequest.headers?.get !== "function") {
    const urlStr = `https://${incomingRequest.headers?.host || "localhost"}${incomingRequest.url || "/"}`;
    const headers = new Headers();

    for (const [key, value] of Object.entries(incomingRequest.headers || {})) {
      if (Array.isArray(value)) {
        value.forEach((v) => headers.append(key, v));
      } else if (value) {
        headers.set(key, value as string);
      }
    }

    let body: BodyInit | undefined = undefined;
    const method = incomingRequest.method || "GET";

    if (method !== "GET" && method !== "HEAD" && incomingRequest.body) {
      body =
        typeof incomingRequest.body === "string"
          ? incomingRequest.body
          : JSON.stringify(incomingRequest.body);
    }

    request = new Request(urlStr, { method, headers, body });
  } else {
    request = incomingRequest as Request;
  }

  let pathname = "unknown";
  let url: URL | undefined;

  try {
    const urlStr = request.url;
    const isAbsolute =
      urlStr.startsWith("http://") || urlStr.startsWith("https://");
    url = isAbsolute
      ? new URL(urlStr)
      : new URL(
          urlStr,
          `https://${request.headers.get("host") || "localhost"}`,
        );
    pathname = url.pathname;
  } catch (e) {
    console.error("Failed to parse URL:", request.url, e);
  }

  console.log(`[${request.method}] ${pathname} - Backend function started`);

  try {
    const response = await app.handle(request);
    console.log(
      `[${request.method}] ${pathname} - Handled: ${response.status}`,
    );
    return response;
  } catch (error) {
    console.error(`[${request.method}] ${pathname} - CRASH:`, error);

    return new Response(
      JSON.stringify({
        error: "FUNCTION_RUNTIME_ERROR",
        message: "Internal Backend Error",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

export const GET = handleRequest;
export const POST = handleRequest;
export const PATCH = handleRequest;
export const DELETE = handleRequest;
export const PUT = handleRequest;
export const OPTIONS = handleRequest;
