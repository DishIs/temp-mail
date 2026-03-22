// app/api/user/api-custom-domains/route.ts
import { NextResponse } from 'next/server';
import { callInternalAPI } from '@/lib/api';
import { auth } from '@/auth';

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await callInternalAPI(
        request,
        `/user/api-custom-domains?wyiUserId=${encodeURIComponent(session.user.id)}`,
        { method: 'GET' },
        { id: session.user.id }
    );
    return NextResponse.json(data);
  } catch (err: any) {
    if (err.message === 'TOO_MANY_REQUESTS') {
        return NextResponse.json({ success: false, message: 'Rate limit exceeded' }, { status: 429 });
    }
    return NextResponse.json({ success: false, message: err?.message ?? 'Server error' }, { status: 500 });
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
        '/user/api-custom-domains',
        {
            method: 'POST',
            body: JSON.stringify({ ...body, wyiUserId: session.user.id }),
        },
        { id: session.user.id }
    );
    return NextResponse.json(data);
  } catch (err: any) {
    if (err.message === 'TOO_MANY_REQUESTS') {
        return NextResponse.json({ success: false, message: 'Rate limit exceeded' }, { status: 429 });
    }
    return NextResponse.json({ success: false, message: err?.message ?? 'Server error' }, { status: 500 });
  }
}
