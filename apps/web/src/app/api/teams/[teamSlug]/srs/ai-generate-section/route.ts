import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL, safeJson, forwardAuth } from "@/app/api/_lib/proxy";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ teamSlug: string }> },
) {
  const { teamSlug } = await params;
  try {
    const body = await req.json();
    const res = await fetch(
      `${BACKEND_URL}/teams/${teamSlug}/srs/ai-generate-section`,
      { method: "POST", headers: forwardAuth(req), body: JSON.stringify(body) },
    );
    const data = await safeJson(res);
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "NETWORK_ERROR" }, { status: 502 });
  }
}
