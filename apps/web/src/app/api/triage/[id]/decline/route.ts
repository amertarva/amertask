import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL, forwardAuth, safeJson } from "@/app/api/_lib/proxy";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const authHeader = request.headers.get("authorization");

  if (!authHeader) {
    return NextResponse.json(
      { error: "UNAUTHORIZED", message: "Token tidak ditemukan" },
      { status: 401 },
    );
  }

  try {
    const body = await request.json().catch(() => ({}));

    const response = await fetch(`${BACKEND_URL}/triage/${id}/decline`, {
      method: "POST",
      headers: forwardAuth(request),
      body: JSON.stringify(body),
    });

    const data = await safeJson(response);

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error(`[proxy] POST /triage/${id}/decline -> error:`, error);
    return NextResponse.json(
      {
        error: "NETWORK_ERROR",
        message: "Tidak dapat terhubung ke server backend",
      },
      { status: 502 },
    );
  }
}
