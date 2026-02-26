// app/api/paddle/portal-session/route.ts
import { NextResponse } from 'next/server';
import { fetchFromServiceAPI } from '@/lib/api';
import { auth } from '@/auth';

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const wyiUserId = (session.user as any).wyiUserId ?? session.user.id;

  try {
    // Use the same endpoint /api/user/me already uses successfully
    const userRes = await fetchFromServiceAPI(`/user/profile/${wyiUserId}`);

    if (!userRes?.success || !userRes?.user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const sub = userRes.user.subscription;

    if (!sub || sub.provider !== 'paddle') {
      return NextResponse.json({ error: 'No Paddle subscription found' }, { status: 404 });
    }

    if (!sub.customerId) {
      // customerId wasn't saved for subscriptions created before the webhook fix.
      // Fall back to the generic portal homepage — user can still manage from there.
      // Run the backfill script below to fix existing records.
      console.warn(`[Paddle Portal] No customerId for user ${wyiUserId} — falling back to portal homepage`);
      return NextResponse.json({
        url: 'https://customer.paddle.com/subscriptions',
        warning: 'no_customer_id',
      });
    }

    const paddleApiUrl = process.env.PADDLE_ENV === 'sandbox'
      ? 'https://sandbox-api.paddle.com'
      : 'https://api.paddle.com';

    const paddleRes = await fetch(
      `${paddleApiUrl}/customers/${sub.customerId}/portal-sessions`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.PADDLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription_ids: [sub.subscriptionId],
        }),
      }
    );

    if (!paddleRes.ok) {
      const err = await paddleRes.json().catch(() => ({}));
      console.error('[Paddle Portal] Paddle API error:', paddleRes.status, err);
      return NextResponse.json(
        { error: 'Failed to create Paddle portal session' },
        { status: paddleRes.status }
      );
    }

    const paddleData = await paddleRes.json();
    const overviewUrl: string = paddleData.data.urls.general.overview;
    const subLinks = paddleData.data.urls.subscriptions ?? [];
    // Prefer the subscription management deep-link, fall back to overview
    const manageUrl: string = subLinks[0]?.update_payment_method ?? overviewUrl;

    return NextResponse.json({ url: manageUrl });
  } catch (error) {
    console.error('[Paddle Portal] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}