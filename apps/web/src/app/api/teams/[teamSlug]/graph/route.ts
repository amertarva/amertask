import { NextRequest, NextResponse } from "next/server";
import {
  BACKEND_URL,
  safeJson,
  forwardAuth,
  guardBackendUrl,
} from "@/app/api/_lib/proxy";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ teamSlug: string }> },
) {
  const guardError = guardBackendUrl(req);
  if (guardError) {
    return NextResponse.json(guardError, { status: 502 });
  }

  const { teamSlug } = await params;

  try {
    const res = await fetch(`${BACKEND_URL}/teams/${teamSlug}/graph`, {
      method: "GET",
      headers: {
        ...forwardAuth(req),
        "Content-Type": "application/json",
      },
    });

    const data = await safeJson(res);
    return NextResponse.json(data, { status: res.status });
  } catch (err: unknown) {
    console.error("Graph proxy error:", err);
    return NextResponse.json(
      {
        error: "NETWORK_ERROR",
        message: err instanceof Error ? err.message : "Network error",
      },
      { status: 502 },
    );
  }
}
