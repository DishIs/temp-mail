// app/api/paypal/verify-subscription/route.ts
import { NextResponse } from 'next/server';
import { fetchFromServiceAPI } from '@/lib/api';
import { getPayPalAccessToken } from '@/lib/paypal';
import { auth } from '@/auth';

const PAYPAL_API = process.env.PAYPAL_API_URL || 'https://api-m.sandbox.paypal.com';

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { subscriptionId } = await request.json();

    if (!subscriptionId) {
      return NextResponse.json({ error: 'subscriptionId is required' }, { status: 400 });
    }

    const accessToken = await getPayPalAccessToken();

    const subReq = await fetch(`${PAYPAL_API}/v1/billing/subscriptions/${subscriptionId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const subData = await subReq.json();

    if (!subReq.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch subscription details from PayPal' },
        { status: 400 }
      );
    }

    if (subData.custom_id !== session.user.id) {
      console.error(`[Verify Sub] custom_id mismatch: ${subData.custom_id} !== ${session.user.id}`);
      return NextResponse.json(
        { error: 'Subscription does not belong to this user' },
        { status: 403 }
      );
    }

    const validStatuses = ['ACTIVE', 'APPROVAL_PENDING', 'APPROVED'];
    if (!validStatuses.includes(subData.status)) {
      return NextResponse.json(
        { error: `Subscription status is '${subData.status}', expected ACTIVE` },
        { status: 400 }
      );
    }

    await fetchFromServiceAPI('/user/upgrade', {
      method: 'POST',
      body: JSON.stringify({
        userId: session.user.id,
        subscriptionId: subData.id,
        planId: subData.plan_id,
        status: subData.status,
        startTime: subData.start_time,
        payer: {
          email: subData.subscriber?.email_address,
          name: `${subData.subscriber?.name?.given_name ?? ''} ${subData.subscriber?.name?.surname ?? ''}`.trim(),
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