// app/api/user/dashboard-data/route.ts
import { NextResponse } from 'next/server';
import { fetchFromServiceAPI } from '@/lib/api';
import { auth } from '@/auth';

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const serviceResponse = await fetchFromServiceAPI(`/user/${session.user.id}/dashboard-data`);
    return NextResponse.json(serviceResponse);
  } catch (error) {
    console.error('Dashboard data fetch error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}