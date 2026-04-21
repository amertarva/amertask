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

// Vercel Node.js runtime Web Standard entrypoint.
export default {
  async fetch(request: Request) {
    return handleRequest(request);
  },
};
