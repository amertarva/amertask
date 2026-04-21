import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const searchParams = request.nextUrl.searchParams;

    if (!authHeader) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "Token tidak ditemukan" },
        { status: 401 },
      );
    }

    const queryString = searchParams.toString();
    const url = `${BACKEND_URL}/inbox${queryString ? `?${queryString}` : ""}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: authHeader,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Get inbox API error:", error);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Terjadi kesalahan server" },
      { status: 500 },
    );
  }
}
