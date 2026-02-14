// app/api/user/mute/route.ts

import { NextResponse } from 'next/server';
import { fetchFromServiceAPI } from '@/lib/api';
import { getToken } from '@/lib/session';

// MUTE a sender
export async function POST(request: Request) {
const token = await getToken(request);

    if (!token?.id) {
        return NextResponse.json(
            { success: false, message: 'Unauthorized' },
            { status: 401 }
        );
    }

    const { senderToMute } = await request.json();
    if (!senderToMute) {
        return NextResponse.json({ message: 'Sender is required.' }, { status: 400 });
    }

    try {
        const serviceResponse = await fetchFromServiceAPI(`/user/mute`, {
            method: 'POST',
            body: JSON.stringify({ senderToMute, wyiUserId: token.id }),
        });
        return NextResponse.json(serviceResponse);
    } catch (error: any) {
        return NextResponse.json({ message: error.message || 'Server Error' }, { status: 500 });
    }
}

// UNMUTE a sender
export async function DELETE(request: Request) {
const token = await getToken(request);

    if (!token?.id) {
        return NextResponse.json(
            { success: false, message: 'Unauthorized' },
            { status: 401 }
        );
    }

    const { senderToUnmute } = await request.json();

    try {
        // Your backend uses DELETE for this, but the handler name is unmuteSenderHandler.
        // The HTTP method and path should match the Express route definition.
        const serviceResponse = await fetchFromServiceAPI(`/user/mute`, {
            method: 'DELETE',
            body: JSON.stringify({ senderToUnmute, wyiUserId: token.id }),
        });
        return NextResponse.json(serviceResponse);
    } catch (error: any) {
        return NextResponse.json({ message: error.message || 'Server Error' }, { status: 500 });
    }
}