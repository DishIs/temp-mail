import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { setUpsellSource } from "@/lib/upsell-tracker";

export async function POST(request: Request) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  let body: { source?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: "Invalid JSON" }, { status: 400 });
  }

  const source = body.source;
  if (!source) {
    return NextResponse.json({ success: false, message: "Source is required" }, { status: 400 });
  }

  try {
    await setUpsellSource(session.user.id, source as any);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to track upsell source:", error);
    return NextResponse.json({ success: false, message: "Failed to track source" }, { status: 500 });
  }
}
