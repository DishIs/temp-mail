// app/api/user/inboxes/route.ts
import { NextResponse } from 'next/server';
import { fetchFromServiceAPIWithStatus } from '@/lib/api';
import { auth } from '@/auth';

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }

  let body: { inboxName?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: 'Invalid JSON body.' },
      { status: 400 }
    );
  }
  const inboxName = body?.inboxName;
  if (!inboxName || typeof inboxName !== 'string' || !inboxName.trim()) {
    return NextResponse.json(
      { success: false, message: 'Inbox name is required.' },
      { status: 400 }
    );
  }

  const { status, data } = await fetchFromServiceAPIWithStatus('/user/inboxes', {
    method: 'POST',
    body: JSON.stringify({
      wyiUserId: session.user.id,
      inboxName: inboxName.trim(),
    }),
  });

  return NextResponse.json(data, { status });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
  }
 
  const body = await req.json().catch(() => ({}));
  if (!body.inbox) {
    return NextResponse.json({ success: false, message: 'inbox is required.' }, { status: 400 });
  }
 
  try {
    const data = await fetchFromServiceAPIWithStatus('/user/inboxes', {
      method: 'DELETE',
      body: JSON.stringify({ wyiUserId: session.user.id, inbox: body.inbox }),
    });
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message ?? 'Server error.' },
      { status: 500 },
    );
  }
}
