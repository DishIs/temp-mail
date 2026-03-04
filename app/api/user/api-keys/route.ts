import { NextRequest, NextResponse } from "next/server";
import { fetchFromServiceAPI } from "@/lib/api";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  try {
    const data = await fetchFromServiceAPI(`/user/api-keys/${session.user.id}`);
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("API Error GET /user/api-keys:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const name = typeof body?.name === "string" ? body.name : "Default";
    const data = await fetchFromServiceAPI("/user/api-keys", {
      method: "POST",
      body: JSON.stringify({ wyiUserId: session.user.id, name }),
    });
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("API Error POST /user/api-keys:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const prefix = body?.prefix;
    if (!prefix || typeof prefix !== "string") {
      return NextResponse.json({ success: false, message: "userId and prefix are required." }, { status: 400 });
    }
    const data = await fetchFromServiceAPI("/user/api-keys", {
      method: "DELETE",
      body: JSON.stringify({ userId: session.user.id, prefix }),
    });
    return NextResponse.json(data ?? { success: true });
  } catch (error: unknown) {
    console.error("API Error DELETE /user/api-keys:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
