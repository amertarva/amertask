import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL, forwardAuth, safeJson } from "@/app/api/_lib/proxy";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamSlug: string }> },
) {
  const { teamSlug } = await params;
  const authHeader = request.headers.get("authorization");

  if (!authHeader) {
    return NextResponse.json(
      { error: "UNAUTHORIZED", message: "Token tidak ditemukan" },
      { status: 401 },
    );
  }

  try {
    const response = await fetch(`${BACKEND_URL}/teams/${teamSlug}/triage`, {
      method: "GET",
      cache: "no-store",
      headers: forwardAuth(request),
    });

    const data = await safeJson(response);

    if (!response.ok) {
      console.error(
        `[proxy] GET /teams/${teamSlug}/triage -> ${response.status}:`,
        data,
      );
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error(`[proxy] GET /teams/${teamSlug}/triage -> error:`, error);
    return NextResponse.json(
      {
        error: "NETWORK_ERROR",
        message: "Tidak dapat terhubung ke server backend",
      },
      { status: 502 },
    );
  }
}
