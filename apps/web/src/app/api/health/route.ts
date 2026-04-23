import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL, fetchBackend } from "@/app/api/_lib/proxy";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Check backend health
    const backendResponse = await fetchBackend("/health");
    const backendData = await backendResponse.json();

    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      proxy: "Next.js API Routes",
      backend: backendData,
      env: {
        BACKEND_URL: BACKEND_URL ? `${new URL(BACKEND_URL).protocol}//${new URL(BACKEND_URL).hostname}` : "NOT_SET",
        NODE_ENV: process.env.NODE_ENV,
      },
    });
  } catch (error) {
    console.error("🏥 Health check failed:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Backend tidak dapat dijangkau",
        error: error instanceof Error ? error.message : "Unknown error",
        diagnostics: {
          BACKEND_URL: BACKEND_URL ? "SET" : "NOT_SET",
          NODE_ENV: process.env.NODE_ENV,
        }
      },
      { status: 503 },
    );
  }
}
