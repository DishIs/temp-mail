// app/api/user/me/route.ts
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
    const serviceResponse = await fetchFromServiceAPI(`/user/profile/${session.user.id}`);

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
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}