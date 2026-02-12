import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { fetchFromServiceAPI } from '@/lib/api';

export async function POST(request: Request) {
    // ---- Extract JWT from cookie
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

    console.log("user", token);

    try {
        const { inboxName } = await request.json();

        if (!inboxName) {
            return NextResponse.json(
                { success: false, message: 'Inbox name is required.' },
                { status: 400 }
            );
        }

        const serviceResponse = await fetchFromServiceAPI('/user/inboxes', {
            method: 'POST',
            body: JSON.stringify({
                wyiUserId: token.id,
                inboxName,
            }),
        });

        return NextResponse.json(serviceResponse);

    } catch (error) {
        console.error('Error in /api/user/inboxes:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to update inbox.' },
            { status: 500 }
        );
    }
}
