// app/api/user/domains/verify/route.ts
import { NextResponse } from 'next/server';
import { fetchFromServiceAPI } from '@/lib/api';
import { auth } from '@/auth';

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { domain } = await request.json();
  if (!domain) {
    return NextResponse.json({ message: 'Domain is required.' }, { status: 400 });
  }

  try {
    const serviceResponse = await fetchFromServiceAPI('/user/domains/verify', {
      method: 'POST',
      body: JSON.stringify({
        domain,
        wyiUserId: session.user.id,
      }),
    });

    return NextResponse.json(serviceResponse);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}