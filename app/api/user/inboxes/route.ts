// app/api/user/inboxes/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { fetchFromServiceAPI } from '@/lib/api';

/**
 * Handles POST requests to add or update a user's inbox in the database.
 * This acts as a secure proxy to the backend service.
 */
export async function POST(request: Request) {
    // 1. Authenticate the request and get user data
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    console.log("user", session.user)

    try {
        // 2. Get the new inbox name from the request body
        const { inboxName } = await request.json();
        if (!inboxName) {
            return NextResponse.json({ success: false, message: 'Inbox name is required.' }, { status: 400 });
        }

        // 3. Proxy the request to your backend service API
        // This calls the `addInboxHandler` you created on the Express server.
        const serviceResponse = await fetchFromServiceAPI('/user/inboxes', {
            method: 'POST',
            body: JSON.stringify({
                wyiUserId: session.user.id,
                inboxName: inboxName,
            }),
        });

        // 4. Return the response from the service to the client
        return NextResponse.json(serviceResponse);

    } catch (error) {
        console.error('Error in /api/user/inboxes:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return NextResponse.json({ success: false, message: 'Failed to update inbox.', error: errorMessage }, { status: 500 });
    }
}