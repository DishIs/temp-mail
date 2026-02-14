// app/api/user/inboxes/route.ts
import { NextResponse } from 'next/server';
import { fetchFromServiceAPI } from '@/lib/api';
import { auth } from '@/auth';

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { inboxName } = await request.json();

    if (!inboxName) {
      return NextResponse.json(
        { success: false, message: 'Inbox name is required.' },
        { status: 400 }
      );
    }

    const serviceResponse = await fetchFromServiceAPI('/user/inboxes', {
      method: 'POST',
      body: JSON.stringify({
        wyiUserId: session.user.id,
        inboxName,
      }),
    });

    return NextResponse.json(serviceResponse);
  } catch (error) {
    console.error('Error in /api/user/inboxes:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update inbox.' },
      { status: 500 }
    );
  }
}