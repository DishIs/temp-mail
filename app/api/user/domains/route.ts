// app/api/user/domains/route.ts
import { NextResponse } from 'next/server';
import { callInternalAPI } from '@/lib/api';
import { auth } from '@/auth';

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const serviceResponse = await callInternalAPI(
        request,
        `/user/${session.user.id}/domains`,
        { method: 'GET' },
        { id: session.user.id }
    );
    return NextResponse.json(serviceResponse);
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
    const serviceResponse = await callInternalAPI(
        request,
        '/user/domains',
        {
            method: 'POST',
            body: JSON.stringify({ ...body, wyiUserId: session.user.id }),
        },
        { id: session.user.id }
    );
    return NextResponse.json(serviceResponse);
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
    const serviceResponse = await callInternalAPI(
        request,
        '/user/domains',
        {
            method: 'DELETE',
            body: JSON.stringify({ ...body, wyiUserId: session.user.id }),
        },
        { id: session.user.id }
    );
    return NextResponse.json(serviceResponse);
  } catch (error: any) {
    if (error.message === 'TOO_MANY_REQUESTS') {
        return NextResponse.json({ success: false, message: 'Rate limit exceeded' }, { status: 429 });
    }
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}
