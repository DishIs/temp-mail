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
        `/user/webhooks/${session.user.id}`,
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
    const { url, inbox } = body;

    if (!url || !inbox) {
      return NextResponse.json({ success: false, message: 'url and inbox are required' }, { status: 400 });
    }

    const data = await callInternalAPI(
        request,
        '/user/webhooks',
        { 
          method: 'POST',
          body: JSON.stringify({ wyiUserId: session.user.id, url, inbox }),
        },
        { id: session.user.id }
    );
    return NextResponse.json(data, { status: data.success ? 201 : 400 });
  } catch (err: any) {
    if (err.message === 'TOO_MANY_REQUESTS') {
        return NextResponse.json({ success: false, message: 'Rate limit exceeded' }, { status: 429 });
    }
    return NextResponse.json({ success: false, message: err?.message ?? 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.clone().json();
    const { webhookId } = body;

    if (!webhookId) {
      return NextResponse.json({ success: false, message: 'webhookId is required' }, { status: 400 });
    }

    const data = await callInternalAPI(
        request,
        '/user/webhooks',
        { 
          method: 'DELETE',
          body: JSON.stringify({ wyiUserId: session.user.id, webhookId }),
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
