import { NextResponse } from 'next/server';
import { callInternalAPI } from '@/lib/api';
import { auth } from '@/auth';

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const inbox = searchParams.get('inbox');

  if (!inbox) {
    return NextResponse.json(
      { success: false, message: 'inbox is required.' },
      { status: 400 }
    );
  }

  try {
    const data = await callInternalAPI(
      request,
      `/user/timeline?inbox=${encodeURIComponent(inbox)}`,
      { method: 'GET' },
      { id: session.user.id }
    );

    return NextResponse.json(data);
  } catch (err: any) {
    if (err.message === 'TOO_MANY_REQUESTS') {
        return NextResponse.json({ success: false, message: 'Rate limit exceeded' }, { status: 429 });
    }
    return NextResponse.json(
      { success: false, message: err?.message ?? 'Server error.' },
      { status: 500 }
    );
  }
}
