import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { fetchFromServiceAPI } from '@/lib/api';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const settings = await request.json();
    
    // Validate settings structure loosely
    if (typeof settings !== 'object') {
        return NextResponse.json({ error: 'Invalid settings format' }, { status: 400 });
    }

    // Forward to backend service
    await fetchFromServiceAPI('/user/settings', {
      method: 'POST',
      body: JSON.stringify({
        wyiUserId: session.user.id,
        settings
      })
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to sync settings:', error);
    return NextResponse.json({ error: 'Failed to sync settings' }, { status: 500 });
  }
}
