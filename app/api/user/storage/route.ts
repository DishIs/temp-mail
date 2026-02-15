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
    const serviceResponse = await fetchFromServiceAPI(`/user/${session.user.id}/storage`);

    if (serviceResponse.success) {
      return NextResponse.json({ ...serviceResponse });
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