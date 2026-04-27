import { NextRequest, NextResponse } from "next/server";
import {
  BACKEND_URL,
  safeJson,
  forwardAuth,
  guardBackendUrl,
} from "@/app/api/_lib/proxy";

async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ teamSlug: string; planningId: string }> },
) {
  const guardError = guardBackendUrl(req);
  if (guardError) {
    return NextResponse.json(guardError, { status: 502 });
  }

  const { teamSlug, planningId } = await params;

  try {
    let body;
    if (req.method === "PATCH") {
      body = await req.json();
    }

    const res = await fetch(
      `${BACKEND_URL}/teams/${teamSlug}/plannings/${planningId}`,
      {
        method: req.method,
        headers: {
          ...forwardAuth(req),
          "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
      },
    );

    const data = await safeJson(res);
    return NextResponse.json(data, { status: res.status });
  } catch (err: unknown) {
    console.error("Planning proxy error:", err);
    return NextResponse.json(
      {
        error: "NETWORK_ERROR",
        message: err instanceof Error ? err.message : "Network error",
      },
      { status: 502 },
    );
  }
}

export const GET = handler;
export const PATCH = handler;
export const DELETE = handler;
