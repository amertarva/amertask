import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL } from "@/app/api/_lib/proxy";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "Token tidak ditemukan" },
        { status: 401 },
      );
    }

    console.log("👤 Fetching current user...");

    const response = await fetch(`${BACKEND_URL}/users/me`, {
      method: "GET",
      cache: "no-store",
      headers: {
        Authorization: authHeader,
      },
    });

    // Get response text first to handle non-JSON responses
    const text = await response.text();
    console.log("📥 Backend raw response:", {
      status: response.status,
      contentType: response.headers.get("content-type"),
      body: text.substring(0, 200),
    });

    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      console.error("❌ Failed to parse response as JSON:", text);
      return NextResponse.json(
        {
          error: "BACKEND_ERROR",
          message: "Backend error: " + text.substring(0, 100),
        },
        { status: 500 },
      );
    }

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    console.log("✅ User fetched:", { userId: data.id, name: data.name });
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("❌ Get user API error:", error);
    return NextResponse.json(
      {
        error: "INTERNAL_ERROR",
        message:
          error instanceof Error ? error.message : "Terjadi kesalahan server",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const body = await request.json();

    if (!authHeader) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "Token tidak ditemukan" },
        { status: 401 },
      );
    }

    const response = await fetch(`${BACKEND_URL}/users/me`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Update user API error:", error);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Terjadi kesalahan server" },
      { status: 500 },
    );
  }
}
