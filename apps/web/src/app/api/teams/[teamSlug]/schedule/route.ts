import { NextRequest, NextResponse } from "next/server";
import {
  BACKEND_URL,
  safeJson,
  forwardAuth,
  guardBackendUrl,
} from "@/app/api/_lib/proxy";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ teamSlug: string }> },
) {
  const guardError = guardBackendUrl(req);
  if (guardError) {
    return NextResponse.json(guardError, { status: 502 });
  }

  const { teamSlug } = await params;

  try {
    const body = await req.json();

    const res = await fetch(`${BACKEND_URL}/teams/${teamSlug}/schedule`, {
      method: "POST",
      headers: {
        ...forwardAuth(req),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await safeJson(res);
    return NextResponse.json(data, { status: res.status });
  } catch (err: unknown) {
    console.error("Schedule proxy error:", err);
    return NextResponse.json(
      {
        error: "NETWORK_ERROR",
        message: err instanceof Error ? err.message : "Network error",
      },
      { status: 502 },
    );
  }
}
