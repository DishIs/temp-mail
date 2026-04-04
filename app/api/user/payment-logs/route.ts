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

  // Forward all params the handler and dashboard actually use
  const type   = searchParams.get('type')   || '';
  const limit  = searchParams.get('limit')  || '20';
  const offset = searchParams.get('offset') || '0';

  const qs = new URLSearchParams({ limit, offset });
  if (type) qs.set('type', type);

  // ✅ Correct path: /user/payment-logs/:wyiUserId  (was /user/:id/payment-logs)
  const path = `/user/payment-logs/${session.user.id}?${qs.toString()}`;

  try {
    const data = await callInternalAPI(
      request,
      path,
      { method: 'GET' },
      { id: session.user.id },
    );
    return NextResponse.json(data);
  } catch (error: any) {
    if (error.message === 'TOO_MANY_REQUESTS') {
      return NextResponse.json(
        { success: false, message: 'Rate limit exceeded' },
        { status: 429 },
      );
    }
    return NextResponse.json(
      { success: false, message: error.message || 'Internal Server Error' },
      { status: 500 },
    );
  }
}