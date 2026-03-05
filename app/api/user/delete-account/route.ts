import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { fetchFromServiceAPIWithStatus } from "@/lib/api";

/**
 * POST /api/user/delete-account
 * Schedules account deletion (7-day cooldown). Body: { ip?: string }.
 * Forwards to backend POST /user/delete-account.
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  let body: { ip?: string } = {};
  try {
    body = await request.json().catch(() => ({}));
  } catch {
    // no body is ok
  }
  const ip =
    body?.ip ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    undefined;
  const payload: { wyiUserId: string; ip?: string } = { wyiUserId: session.user.id };
  if (ip) payload.ip = ip;

  const { status, data } = await fetchFromServiceAPIWithStatus("/user/delete-account", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return NextResponse.json(data ?? { success: true }, { status });
}
