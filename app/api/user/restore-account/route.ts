import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { fetchFromServiceAPIWithStatus } from "@/lib/api";

/**
 * POST /api/user/restore-account
 * Cancels scheduled deletion. Forwards to backend POST /user/restore-account.
 */
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const { status, data } = await fetchFromServiceAPIWithStatus("/user/restore-account", {
    method: "POST",
    body: JSON.stringify({ userId: session.user.id }),
  });
  return NextResponse.json(data ?? { success: true }, { status });
}
