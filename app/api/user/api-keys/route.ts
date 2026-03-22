// app/api/user/api-keys/route.ts
import { NextRequest, NextResponse } from "next/server";
import { callInternalAPI } from "@/lib/api";
import { auth } from "@/auth";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  
  try {
    const data = await callInternalAPI(
        request, 
        `/user/api-keys/${session.user.id}`, 
        { method: 'GET' }, 
        { id: session.user.id }
    );
    return NextResponse.json(data);
  } catch (error: any) {
    if (error.message === 'TOO_MANY_REQUESTS') {
        return NextResponse.json({ success: false, message: 'Rate limit exceeded' }, { status: 429 });
    }
    return NextResponse.json({ success: false, message: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.clone().json().catch(() => ({}));
    const name = typeof body?.name === "string" && body.name.trim() ? body.name.trim() : "Default";
    
    const data = await callInternalAPI(
        request,
        "/user/api-keys",
        {
            method: "POST",
            body: JSON.stringify({ wyiUserId: session.user.id, name }),
        },
        { id: session.user.id }
    );
    return NextResponse.json(data);
  } catch (error: any) {
    if (error.message === 'TOO_MANY_REQUESTS') {
        return NextResponse.json({ success: false, message: 'Rate limit exceeded' }, { status: 429 });
    }
    return NextResponse.json({ success: false, message: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.clone().json().catch(() => ({}));
    if (!body.id) {
        return NextResponse.json({ success: false, message: "API Key ID required" }, { status: 400 });
    }
    
    const data = await callInternalAPI(
        request,
        "/user/api-keys",
        {
            method: "DELETE",
            body: JSON.stringify({ wyiUserId: session.user.id, id: body.id }),
        },
        { id: session.user.id }
    );
    return NextResponse.json(data);
  } catch (error: any) {
    if (error.message === 'TOO_MANY_REQUESTS') {
        return NextResponse.json({ success: false, message: 'Rate limit exceeded' }, { status: 429 });
    }
    return NextResponse.json({ success: false, message: error.message || "Internal Server Error" }, { status: 500 });
  }
}
