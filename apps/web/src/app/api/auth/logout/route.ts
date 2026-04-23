import { NextRequest, NextResponse } from "next/server";
import { guardBackendUrl, fetchBackend, safeJson, forwardAuth } from "@/app/api/_lib/proxy";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const configError = guardBackendUrl(request);
  if (configError) {
    return NextResponse.json(configError, { status: 503 });
  }

  try {
    const body = await request.json().catch(() => ({}));

    const response = await fetchBackend("/auth/logout", {
      method: "POST",
      headers: forwardAuth(request),
      body: JSON.stringify(body),
    });

    const data = (await safeJson(response)) as any;

    if (!response.ok) {
      console.error("[proxy /auth/logout]", response.status, data);
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Logout API error:", error);
    return NextResponse.json(
      {
        error: "INTERNAL_ERROR",
        message:
          error instanceof Error ? error.message : "Terjadi kesalahan server",
      },
      { status: 502 },
    );
  }
}
