import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL;

function forwardAuth(req: NextRequest): HeadersInit {
  const authHeader = req.headers.get("authorization");
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (authHeader) {
    headers["Authorization"] = authHeader;
  }
  return headers;
}

async function safeJson(res: Response) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { error: "INVALID_JSON", raw: text };
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ teamSlug: string }> },
) {
  const { teamSlug } = await params;
  try {
    const res = await fetch(`${BACKEND_URL}/teams/${teamSlug}/srs`, {
      headers: forwardAuth(req),
    });
    const data = await safeJson(res);
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "NETWORK_ERROR" }, { status: 502 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ teamSlug: string }> },
) {
  const { teamSlug } = await params;
  try {
    const body = await req.json();
    const res = await fetch(`${BACKEND_URL}/teams/${teamSlug}/srs`, {
      method: "PUT",
      headers: forwardAuth(req),
      body: JSON.stringify(body),
    });
    const data = await safeJson(res);
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "NETWORK_ERROR" }, { status: 502 });
  }
}
