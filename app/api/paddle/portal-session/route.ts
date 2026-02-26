// app/api/paddle/portal-session/route.ts
import { NextResponse } from 'next/server';
import { fetchFromServiceAPI } from '@/lib/api';
import { auth } from '@/auth';

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Get the user's subscription data (customerId + subscriptionId) from our service
    const userRes = await fetchFromServiceAPI('/user/me', {
      method: 'GET',
      headers: { 'x-user-id': (session.user as any).wyiUserId ?? '' },
    });

    const sub = userRes?.user?.subscription;

    if (!sub || sub.provider !== 'paddle') {
      return NextResponse.json({ error: 'No Paddle subscription found' }, { status: 404 });
    }

    if (!sub.customerId) {
      return NextResponse.json({ error: 'Paddle customer ID not found — please contact support' }, { status: 404 });
    }

    // 2. Call Paddle API to create an authenticated portal session
    //    Passing subscription_ids generates a deep-link directly to that subscription's management page.
    const paddleApiUrl = process.env.PADDLE_ENV === 'sandbox'
      ? 'https://sandbox-api.paddle.com'
      : 'https://api.paddle.com';

    const paddleRes = await fetch(
      `${paddleApiUrl}/customers/${sub.customerId}/portal-sessions`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.PADDLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription_ids: [sub.subscriptionId],
        }),
      }
    );

    if (!paddleRes.ok) {
      const err = await paddleRes.json().catch(() => ({}));
      console.error('[Paddle Portal] API error:', err);
      return NextResponse.json(
        { error: 'Failed to create Paddle portal session' },
        { status: paddleRes.status }
      );
    }

    const paddleData = await paddleRes.json();

    // The overview URL is a short-lived authenticated link (~1 hour TTL)
    // subscriptions[0].cancel_subscription etc. are the deep-link URLs
    const overviewUrl: string = paddleData.data.urls.general.overview;

    // If Paddle returned a subscription deep-link, prefer that
    const subLinks = paddleData.data.urls.subscriptions ?? [];
    const manageUrl: string = subLinks[0]?.update_payment_method ?? overviewUrl;

    return NextResponse.json({ url: manageUrl });
  } catch (error) {
    console.error('[Paddle Portal] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}