// app/api/user/payment-logs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { fetchFromServiceAPI } from '@/lib/api';
import { auth } from '@/auth';

const VALID_TYPES = ['app', 'api', 'credits'] as const;

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }

  const wyiUserId = session.user.id;
  const { searchParams } = new URL(request.url);
  const limit = searchParams.get('limit');
  const offset = searchParams.get('offset');
  const type = searchParams.get('type');

  const params = new URLSearchParams();
  if (limit != null && limit !== '') params.set('limit', limit);
  if (offset != null && offset !== '') params.set('offset', offset);
  if (type != null && type !== '' && VALID_TYPES.includes(type as typeof VALID_TYPES[number])) {
    params.set('type', type);
  }
  const query = params.toString();
  const path = `/user/payment-logs/${wyiUserId}${query ? `?${query}` : ''}`;

  try {
    const data = await fetchFromServiceAPI(path);
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('API Error calling service from /user/payment-logs:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
