import { NextRequest, NextResponse } from "next/server";
import { fetchFromServiceAPIWithStatus } from "@/lib/api";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  const { ok, status, data } = await fetchFromServiceAPIWithStatus(`/user/api-keys/${session.user.id}`);
  return NextResponse.json(data, { status });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  let body: { name?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: "Invalid JSON body." }, { status: 400 });
  }
  const name = typeof body?.name === "string" && body.name.trim() ? body.name.trim() : "Default";
  const { ok, status, data } = await fetchFromServiceAPIWithStatus("/user/api-keys", {
    method: "POST",
    body: JSON.stringify({ wyiUserId: session.user.id, name }),
  });
  return NextResponse.json(data, { status });
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  let body: { prefix?: string; keyId?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: "Invalid JSON body." }, { status: 400 });
  }
  const keyId = body?.keyId;
  if (!keyId || typeof keyId !== "string") {
    return NextResponse.json({ success: false, message: "keyId and wyiUserId are required." }, { status: 400 });
  }
  const { status, data } = await fetchFromServiceAPIWithStatus("/user/api-keys", {
    method: "DELETE",
    body: JSON.stringify({ keyId, wyiUserId: session.user.id }),
  });
  return NextResponse.json(data ?? { success: true }, { status });
}
