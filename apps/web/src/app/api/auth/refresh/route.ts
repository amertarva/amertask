import { NextRequest, NextResponse } from "next/server";
import { guardBackendUrl, fetchBackend } from "@/app/api/_lib/proxy";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const configError = guardBackendUrl();
  if (configError) {
    return NextResponse.json(configError, { status: 503 });
  }

  try {
    const body = await request.json();

    const response = await fetchBackend("/auth/refresh", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: "BACKEND_ERROR", message: "Invalid response from backend" },
        { status: 502 },
      );
    }

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Refresh API error:", error);
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
