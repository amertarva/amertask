import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL } from "@/app/api/_lib/proxy";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  try {
    const response = await fetch(`${BACKEND_URL}/users/me/activity`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { authorization: authHeader } : {}),
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { error: "PROXY_ERROR", message: "Gagal terhubung ke backend" },
      { status: 502 },
    );
  }
}
