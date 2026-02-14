import { NextResponse } from 'next/server';
import { fetchFromServiceAPI } from '@/lib/api';
import { auth } from '@/auth'; // 👈 replaces getToken from next-auth/jwt

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const settings = await request.json();

    if (typeof settings !== 'object') {
      return NextResponse.json({ error: 'Invalid settings format' }, { status: 400 });
    }

    await fetchFromServiceAPI('/user/settings', {
      method: 'POST',
      body: JSON.stringify({
        wyiUserId: session.user.id, // 👈 was token.id
        settings,
      }),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to sync settings:', error);
    return NextResponse.json({ error: 'Failed to sync settings' }, { status: 500 });
  }
}

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const res = await fetchFromServiceAPI('/user/get-settings', {
      method: 'POST',
      body: JSON.stringify({
        wyiUserId: session.user.id,
      }),
    });

    return NextResponse.json(res);
  } catch (error) {
    console.error('Failed to get settings:', error);
    return NextResponse.json({ error: 'Failed to get settings' }, { status: 500 });
  }
}