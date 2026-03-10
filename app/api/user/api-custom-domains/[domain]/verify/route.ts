// app/api/user/api-custom-domains/[domain]/verify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { fetchFromServiceAPIWithStatus } from '@/lib/api';

export async function POST(
  _req: NextRequest,
  { params }: { params: { domain: string } },
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const { status, data } = await fetchFromServiceAPIWithStatus(
    `/user/api-custom-domains/${encodeURIComponent(params.domain)}/verify?wyiUserId=${encodeURIComponent(session.user.id)}`,
    { method: 'POST' },
  );

  return NextResponse.json(data, { status });
}