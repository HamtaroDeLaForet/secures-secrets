import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const cookie = req.headers.get("cookie") || "";
  if (!cookie.includes("admin_session=1")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const API_BASE = process.env.API_BASE_URL || "http://localhost:8000";
  const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "";

  const r = await fetch(`${API_BASE}/api/admin/secrets/`, {
    headers: {
      "X-ADMIN-TOKEN": ADMIN_TOKEN, 
    },
    cache: "no-store",
  });

  const text = await r.text();
  return new NextResponse(text, {
    status: r.status,
    headers: { "Content-Type": r.headers.get("content-type") || "application/json" },
  });
}
