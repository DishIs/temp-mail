// app/api/user/payment-logs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { callInternalAPI } from '@/lib/api';
import { auth } from '@/auth';

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const page = searchParams.get('page') || '1';
  const limit = searchParams.get('limit') || '10';

  const path = `/user/${session.user.id}/payment-logs?page=${page}&limit=${limit}`;

  try {
    const data = await callInternalAPI(request, path, { method: 'GET' }, { id: session.user.id });
    return NextResponse.json(data);
  } catch (error: any) {
    if (error.message === 'TOO_MANY_REQUESTS') {
        return NextResponse.json({ success: false, message: 'Rate limit exceeded' }, { status: 429 });
    }
    return NextResponse.json({ success: false, message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
