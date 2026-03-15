// app/api/user/inbox-notes/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { fetchFromServiceAPI } from '@/lib/api';

// GET  /api/inbox-notes  → fetch all notes for the current user
export async function GET(_req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const data = await fetchFromServiceAPI(
      `/user/inbox-notes?wyiUserId=${encodeURIComponent(session.user.id)}`,
    );
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message ?? 'Server error.' },
      { status: 500 },
    );
  }
}

// POST  /api/inbox-notes  { inbox, note }  → upsert a note
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  if (!body.inbox) {
    return NextResponse.json({ success: false, message: 'inbox is required.' }, { status: 400 });
  }

  try {
    const data = await fetchFromServiceAPI('/user/inbox-notes', {
      method: 'POST',
      body: JSON.stringify({ wyiUserId: session.user.id, ...body }),
    });
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message ?? 'Server error.' },
      { status: 500 },
    );
  }
}

// DELETE  /api/inbox-notes  { inbox }  → remove a note
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
    const data = await fetchFromServiceAPI('/user/inbox-notes', {
      method: 'DELETE',
      body: JSON.stringify({ wyiUserId: session.user.id, ...body }),
    });
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message ?? 'Server error.' },
      { status: 500 },
    );
  }
}