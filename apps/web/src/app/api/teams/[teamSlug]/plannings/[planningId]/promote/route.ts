import { NextRequest, NextResponse } from "next/server";
import {
  BACKEND_URL,
  safeJson,
  forwardAuth,
  guardBackendUrl,
} from "@/app/api/_lib/proxy";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ teamSlug: string; planningId: string }> },
) {
  const guardError = guardBackendUrl(req);
  if (guardError) {
    return NextResponse.json(guardError, { status: 502 });
  }

  const { teamSlug, planningId } = await params;

  console.log(
    `[Promote] Calling backend: ${BACKEND_URL}/teams/${teamSlug}/plannings/${planningId}/promote`,
  );

  try {
    const res = await fetch(
      `${BACKEND_URL}/teams/${teamSlug}/plannings/${planningId}/promote`,
      {
        method: "POST",
        headers: {
          ...forwardAuth(req),
          "Content-Type": "application/json",
        },
      },
    );

    console.log(`[Promote] Backend response status: ${res.status}`);

    const data = await safeJson(res);
    return NextResponse.json(data, { status: res.status });
  } catch (err: unknown) {
    console.error("Promote planning proxy error:", err);
    return NextResponse.json(
      {
        error: "NETWORK_ERROR",
        message: err instanceof Error ? err.message : "Network error",
      },
      { status: 502 },
    );
  }
}
