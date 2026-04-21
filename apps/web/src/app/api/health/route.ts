import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL } from "@/app/api/_lib/proxy";

export async function GET(request: NextRequest) {
  try {
    // Check backend health
    const backendResponse = await fetch(`${BACKEND_URL}/health`);
    const backendData = await backendResponse.json();

    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      proxy: "Next.js API Routes",
      backend: backendData,
      env: {
        BACKEND_URL,
        NODE_ENV: process.env.NODE_ENV,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: "Backend tidak dapat dijangkau",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 },
    );
  }
}
