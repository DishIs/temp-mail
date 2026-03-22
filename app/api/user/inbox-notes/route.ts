// app/api/user/inbox-notes/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { callInternalAPI } from '@/lib/api';

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await callInternalAPI(
        request,
        `/user/inbox-notes?wyiUserId=${encodeURIComponent(session.user.id)}`,
        { method: 'GET' },
        { id: session.user.id }
    );
    return NextResponse.json(data);
  } catch (error: any) {
    if (error.message === 'TOO_MANY_REQUESTS') {
        return NextResponse.json({ success: false, message: 'Rate limit exceeded' }, { status: 429 });
    }
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.clone().json();
    const data = await callInternalAPI(
        request,
        '/user/inbox-notes',
        {
            method: 'POST',
            body: JSON.stringify({ ...body, wyiUserId: session.user.id }),
        },
        { id: session.user.id }
    );
    return NextResponse.json(data);
  } catch (error: any) {
    if (error.message === 'TOO_MANY_REQUESTS') {
        return NextResponse.json({ success: false, message: 'Rate limit exceeded' }, { status: 429 });
    }
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.clone().json();
    const data = await callInternalAPI(
        request,
        '/user/inbox-notes',
        {
            method: 'DELETE',
            body: JSON.stringify({ ...body, wyiUserId: session.user.id }),
        },
        { id: session.user.id }
    );
    return NextResponse.json(data);
  } catch (error: any) {
    if (error.message === 'TOO_MANY_REQUESTS') {
        return NextResponse.json({ success: false, message: 'Rate limit exceeded' }, { status: 429 });
    }
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}
