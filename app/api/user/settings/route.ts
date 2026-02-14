import { NextResponse } from 'next/server';
import { fetchFromServiceAPI } from '@/lib/api';
import { getToken } from '@/lib/session';

export async function POST(request: Request) {
  const token = await getToken(request);

    if (!token?.id) {
        return NextResponse.json(
            { success: false, message: 'Unauthorized' },
            { status: 401 }
        );
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
        wyiUserId: token.id,
        settings
      })
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to sync settings:', error);
    return NextResponse.json({ error: 'Failed to sync settings' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const token = await getToken(request);

    if (!token?.id) {
        return NextResponse.json(
            { success: false, message: 'Unauthorized' },
            { status: 401 }
        );
    }


  try {

    // Forward to backend service
    const res = await fetchFromServiceAPI('/user/get-settings', {
      method: 'POST',
      body: JSON.stringify({
        wyiUserId: token.id
      })
    });

    return NextResponse.json(res);
  } catch (error) {
    console.error('Failed to sync settings:', error);
    return NextResponse.json({ error: 'Failed to sync settings' }, { status: 500 });
  }
}
