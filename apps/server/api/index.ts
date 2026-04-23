import { app } from "../src/app";

async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  console.log(`[${request.method}] ${url.pathname} - Backend function started`);

  try {
    const response = await app.handle(request);
    console.log(`[${request.method}] ${url.pathname} - Handled: ${response.status}`);
    return response;
  } catch (error) {
    console.error(`[${request.method}] ${url.pathname} - CRASH:`, error);

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
