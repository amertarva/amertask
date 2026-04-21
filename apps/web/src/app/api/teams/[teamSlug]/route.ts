import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL, forwardAuth, safeJson } from "@/app/api/_lib/proxy";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamSlug: string }> },
) {
  try {
    const { teamSlug } = await params;
    const authHeader = request.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "Token tidak ditemukan" },
        { status: 401 },
      );
    }

    const response = await fetch(`${BACKEND_URL}/teams/${teamSlug}`, {
      method: "GET",
      cache: "no-store",
      headers: forwardAuth(request),
    });

    const data = await safeJson(response);

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Get team detail API error:", error);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Terjadi kesalahan server" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ teamSlug: string }> },
) {
  try {
    const { teamSlug } = await params;
    const authHeader = request.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "Token tidak ditemukan" },
        { status: 401 },
      );
    }

    const response = await fetch(`${BACKEND_URL}/teams/${teamSlug}`, {
      method: "DELETE",
      headers: forwardAuth(request),
    });

    const data = await safeJson(response);

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Delete team API error:", error);
    return NextResponse.json(
      {
        error: "UPSTREAM_UNAVAILABLE",
        message: "Gagal terhubung ke backend.",
      },
      { status: 502 },
    );
  }
}
