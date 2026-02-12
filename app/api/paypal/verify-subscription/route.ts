// app/api/paypal/verify-subscription/route.ts
// This is called by YOUR frontend after the user is redirected back from PayPal.
// It verifies the subscription is ACTIVE and tells your backend to upgrade the user.

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { fetchFromServiceAPI } from '@/lib/api';
import { getPayPalAccessToken } from '@/lib/paypal';

const PAYPAL_API = process.env.PAYPAL_API_URL || 'https://api-m.sandbox.paypal.com';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { subscriptionId } = await request.json();

    if (!subscriptionId) {
      return NextResponse.json({ error: 'subscriptionId is required' }, { status: 400 });
    }

    const accessToken = await getPayPalAccessToken();

    // 1. Fetch subscription details from PayPal to verify it's real
    const subReq = await fetch(`${PAYPAL_API}/v1/billing/subscriptions/${subscriptionId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const subData = await subReq.json();

    if (!subReq.ok) {
      return NextResponse.json({ error: 'Failed to fetch subscription details from PayPal' }, { status: 400 });
    }

    // 2. Verify the subscription belongs to the logged-in user via custom_id
    if (subData.custom_id !== session.user.id) {
      console.error(`[Verify Sub] custom_id mismatch: ${subData.custom_id} !== ${session.user.id}`);
      return NextResponse.json({ error: 'Subscription does not belong to this user' }, { status: 403 });
    }

    // 3. Allow ACTIVE or APPROVAL_PENDING (just approved, not yet cycled)
    const validStatuses = ['ACTIVE', 'APPROVAL_PENDING', 'APPROVED'];
    if (!validStatuses.includes(subData.status)) {
      return NextResponse.json(
        { error: `Subscription status is '${subData.status}', expected ACTIVE` },
        { status: 400 }
      );
    }

    // 4. Tell the backend to upgrade the user and log the subscription
    await fetchFromServiceAPI('/user/upgrade', {
      method: 'POST',
      body: JSON.stringify({
        userId:         session.user.id,
        subscriptionId: subData.id,
        planId:         subData.plan_id,
        status:         subData.status,
        startTime:      subData.start_time,
        payer: {
          email: subData.subscriber?.email_address,
          name:  `${subData.subscriber?.name?.given_name ?? ''} ${subData.subscriber?.name?.surname ?? ''}`.trim(),
          paypalId: subData.subscriber?.payer_id,
        },
      }),
    });

    return NextResponse.json({ success: true, plan: 'pro' });

  } catch (error) {
    console.error('[Verify Subscription] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}