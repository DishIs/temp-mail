// app/api/user/domains/route.ts
import { NextResponse } from 'next/server';
import { fetchFromServiceAPI } from '@/lib/api';
import { auth } from '@/auth';

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const serviceResponse = await fetchFromServiceAPI(`/user/${session.user.id}/domains`);
    console.log('Fetched domains:', serviceResponse.domains.map((d: any) => d.domain));
    return NextResponse.json(serviceResponse.domains);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }

  const { domain } = await request.json();
  if (!domain) {
    return NextResponse.json({ message: 'Domain is required.' }, { status: 400 });
  }

  try {
    const serviceResponse = await fetchFromServiceAPI('/user/domains', {
      method: 'POST',
      body: JSON.stringify({
        domain,
        wyiUserId: session.user.id,
      }),
    });

    console.log(serviceResponse);
    return NextResponse.json(serviceResponse);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }

  const { domain } = await request.json();

  try {
    const serviceResponse = await fetchFromServiceAPI('/user/domains', {
      method: 'DELETE',
      body: JSON.stringify({ domain, wyiUserId: session.user.id }),
    });
    return NextResponse.json(serviceResponse);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}