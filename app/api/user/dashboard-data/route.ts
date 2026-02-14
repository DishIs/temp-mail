// app/api/user/dashboard-data/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { fetchFromServiceAPI } from '@/lib/api';
import { getSession, getToken } from '@/lib/session';

export async function GET(request: NextRequest) {
    // Get the session using the server-side utility
    const session = await getToken(request)

    if (!session || !session.id) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const serviceResponse = await fetchFromServiceAPI(`/user/${session.id}/dashboard-data`);
        
        // The serviceResponse already contains the data we need.
        return NextResponse.json(serviceResponse);

    } catch (error) {
        console.error("Dashboard data fetch error:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}