import { app } from "../src/app";

/**
 * Vercel Serverless Function Handler for ElysiaJS
 * Using Web Standard Request/Response API
 */
async function handleRequest(request: Request): Promise<Response> {
  let pathname = "unknown";
  let url: URL | undefined;

  try {
    // request.url might be relative in some Vercel Node.js environments
    const urlStr = request.url;
    const isAbsolute = urlStr.startsWith("http://") || urlStr.startsWith("https://");
    url = isAbsolute 
      ? new URL(urlStr) 
      : new URL(urlStr, `https://${request.headers.get("host") || "localhost"}`);
    pathname = url.pathname;
  } catch (e) {
    console.error("Failed to parse URL:", request.url, e);
  }

  console.log(`[${request.method}] ${pathname} - Backend function started`);

  try {
    const response = await app.handle(request);
    console.log(`[${request.method}] ${pathname} - Handled: ${response.status}`);
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

export default handleRequest;
export const GET = handleRequest;
export const POST = handleRequest;
export const PATCH = handleRequest;
export const DELETE = handleRequest;
export const PUT = handleRequest;
export const OPTIONS = handleRequest;

export { handleRequest as handler };
