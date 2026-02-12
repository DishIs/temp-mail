// app/api/user/domains/route.ts
import { NextResponse } from 'next/server';
import { fetchFromServiceAPI } from '@/lib/api';
import { getToken } from 'next-auth/jwt';


// --- NEW GET METHOD ---
export async function GET(request: Request) {
    const token = await getToken({
        req: request as any,
        secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token?.id) {
        return NextResponse.json(
            { success: false, message: 'Unauthorized' },
            { status: 401 }
        );
    }


    try {
        // Fetch domains from your Express backend
        const serviceResponse = await fetchFromServiceAPI(`/user/${token.id}/domains`);
        console.log("Fetched domains:", serviceResponse.domains.map((d: any) => d.domain));
        return NextResponse.json(serviceResponse.domains); // Return the domains array directly
    } catch (error: any) {
        return NextResponse.json({ message: error.message || 'Server Error' }, { status: 500 });
    }
}


export async function POST(request: Request) {
    // Get the session using the server-side utility
const token = await getToken({
        req: request as any,
        secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token?.id) {
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
        // Proxy the request to the Service API
        const serviceResponse = await fetchFromServiceAPI(`/user/domains`, {
            method: 'POST',
            body: JSON.stringify({
                domain: domain,
                wyiUserId: token.id // Pass the authenticated user ID
            }),
        });

        console.log(serviceResponse)

        return NextResponse.json(serviceResponse);

    } catch (error: any) {
        return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    // Get the session using the server-side utility
    const token = await getToken({
        req: request as any,
        secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token?.id) {
        return NextResponse.json(
            { success: false, message: 'Unauthorized' },
            { status: 401 }
        );
    }

    const { domain } = await request.json();

    try {
        const serviceResponse = await fetchFromServiceAPI(`/user/domains`, {
            method: 'DELETE',
            body: JSON.stringify({ domain, wyiUserId: token.id }) // Pass the authenticated user ID,
        });
        return NextResponse.json(serviceResponse);

    } catch (error: any) {
        return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
