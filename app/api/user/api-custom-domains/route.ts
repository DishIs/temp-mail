// app/api/user/api-custom-domains/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { fetchFromServiceAPIWithStatus } from '@/lib/api';

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const { status, data } = await fetchFromServiceAPIWithStatus(
    `/user/api-custom-domains?wyiUserId=${encodeURIComponent(session.user.id)}`,
  );

  return NextResponse.json(data, { status });
}

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));

  const { status, data } = await fetchFromServiceAPIWithStatus(
    `/user/api-custom-domains?wyiUserId=${encodeURIComponent(session.user.id)}`,
    { method: 'POST', body: JSON.stringify(body) },
  );

  return NextResponse.json(data, { status });
}