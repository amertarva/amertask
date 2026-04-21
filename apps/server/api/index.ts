import { app } from "../src/app";

// Named fetch export keeps Bun-compatible shape available.
export const fetch = (request: Request) => app.handle(request);

// Default handler keeps Vercel function invocation explicit and adds crash isolation.
export default async function handler(request: Request): Promise<Response> {
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
