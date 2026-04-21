import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL, forwardAuth, safeJson } from "@/app/api/_lib/proxy";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

    const response = await fetch(`${BACKEND_URL}/teams/${teamSlug}/settings`, {
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
    console.error("Get team settings API error:", error);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Terjadi kesalahan server" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ teamSlug: string }> },
) {
  try {
    const { teamSlug } = await params;
    const authHeader = request.headers.get("authorization");
    const body = await request.json();

    if (!authHeader) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "Token tidak ditemukan" },
        { status: 401 },
      );
    }

    console.log("🔧 Updating team settings:", { teamSlug, body });

    const response = await fetch(`${BACKEND_URL}/teams/${teamSlug}/settings`, {
      method: "PATCH",
      headers: forwardAuth(request),
      body: JSON.stringify(body),
    });

    const data = await safeJson(response);

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    console.log("✅ Team settings updated successfully");
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("❌ Update team settings API error:", error);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Terjadi kesalahan server" },
      { status: 500 },
    );
  }
}
