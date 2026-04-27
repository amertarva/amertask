import { NextRequest, NextResponse } from "next/server";
import {
  BACKEND_URL,
  safeJson,
  forwardAuth,
  guardBackendUrl,
} from "@/app/api/_lib/proxy";

async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ teamSlug: string }> },
) {
  const guardError = guardBackendUrl(req);
  if (guardError) {
    return NextResponse.json(guardError, { status: 502 });
  }

  const { teamSlug } = await params;

  try {
    const url = new URL(req.url);
    const queryString = url.search;

    let body;
    if (req.method === "POST" || req.method === "PATCH") {
      body = await req.json();
    }

    const res = await fetch(
      `${BACKEND_URL}/teams/${teamSlug}/plannings${queryString}`,
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
    console.error("Standalone plannings proxy error:", err);
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
export const POST = handler;
