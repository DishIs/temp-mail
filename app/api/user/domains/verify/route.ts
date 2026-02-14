// app/api/user/domains/verify/route.ts
import { NextResponse } from 'next/server';
import { fetchFromServiceAPI } from '@/lib/api';
import { getToken } from '@/lib/session';

export async function POST(request: Request) {
    // Get the session using the server-side utility
    const session = await getToken(request)

    if (!session || !session.id) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    const { domain } = await request.json();
    if (!domain) {
        return NextResponse.json({ message: 'Domain is required.' }, { status: 400 });
    }

    try {
        // Proxy the request to the Service API's new verification endpoint
        const serviceResponse = await fetchFromServiceAPI(`/user/domains/verify`, {
            method: 'POST',
            body: JSON.stringify({
                domain: domain,
                wyiUserId: session.id // Pass the authenticated user ID
            }),
        });
        
        return NextResponse.json(serviceResponse);

    } catch (error: any) {
        // Forward the error message from the service API if available
        return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
    }
}