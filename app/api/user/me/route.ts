// app/api/user/me/route.ts
import { NextResponse } from 'next/server';
import { callInternalAPI } from '@/lib/api';
import { auth } from '@/auth';

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const serviceResponse = await callInternalAPI(
        request,
        `/user/profile/${session.user.id}`,
        { method: 'GET' },
        { id: session.user.id }
    );

    if (serviceResponse.success && serviceResponse.user) {
      return NextResponse.json({ success: true, user: serviceResponse.user });
    } else {
      return NextResponse.json(
        { message: serviceResponse.message || 'User not found in backend service.' },
        { status: 404 }
      );
    }
  } catch (error: any) {
    console.error('API Error calling service from /user/me:', error);
    if (error.message === 'TOO_MANY_REQUESTS') {
        return NextResponse.json({ success: false, message: 'Rate limit exceeded' }, { status: 429 });
    }
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
