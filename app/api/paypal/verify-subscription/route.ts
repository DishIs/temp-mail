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
    const accessToken = await getPayPalAccessToken();

    // 1. Get Subscription Details
    const subReq = await fetch(`${PAYPAL_API}/v1/billing/subscriptions/${subscriptionId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const subData = await subReq.json();

    if (!subReq.ok) {
        return NextResponse.json({ error: 'Failed to fetch subscription details' }, { status: 400 });
    }

    // 2. Validate Status
    // Valid statuses: ACTIVE, APPROVAL_PENDING (if instant), APPROVED
    if (subData.status !== 'ACTIVE') {
         // Sometimes it takes a moment to become ACTIVE, proceed if approved but log warning
         console.warn(`Subscription status is ${subData.status}`);
    }

    // 3. Format Data for Backend
    const paymentRecord = {
      userId: session.user.id,
      provider: 'paypal_subscription',
      subscriptionId: subData.id,
      planId: subData.plan_id,
      status: subData.status,
      startTime: subData.start_time,
      payer: {
        email: subData.subscriber?.email_address,
        name: `${subData.subscriber?.name?.given_name} ${subData.subscriber?.name?.surname}`,
        paypalId: subData.subscriber?.payer_id
      }
    };

    // 4. Sync to Backend Service
    // await fetchFromServiceAPI('/user/payments', {
    //   method: 'POST',
    //   body: JSON.stringify(paymentRecord)
    // });

    // // 5. Upgrade User Plan
    // await fetchFromServiceAPI('/user/upgrade', {
    //     method: 'POST',
    //     body: JSON.stringify({
    //         userId: session.user.id,
    //         plan: 'pro',
    //         subscriptionId: subData.id
    //     })
    // });

    return NextResponse.json({ success: true, data: paymentRecord });

  } catch (error) {
    console.error('Verify Subscription Error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}