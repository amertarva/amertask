import { app } from "../src/app";

async function handleRequest(request: Request): Promise<Response> {
  try {
    return await app.handle(request);
  } catch (error) {
    console.error("[vercel handler crash]", error);

    return new Response(
      JSON.stringify({
        error: "FUNCTION_RUNTIME_ERROR",
        message: "Terjadi kesalahan runtime pada backend.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

// Vercel Bun runtime — compatible with both Edge-style and Bun.serve-style entrypoints.
export default handleRequest;

// Also export GET/POST/PATCH/DELETE/OPTIONS for Vercel Node.js/Edge runtime compatibility
export const GET = handleRequest;
export const POST = handleRequest;
export const PATCH = handleRequest;
export const DELETE = handleRequest;
export const PUT = handleRequest;
export const OPTIONS = handleRequest;
