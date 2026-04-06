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
    const userRes = await fetchFromServiceAPI(`/user/profile/${wyiUserId}`);

    if (!userRes?.success || !userRes?.user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userRes.user;

    // ── Determine which subscription provider is active ──────────────────────
    const paddleSub = user.subscription ?? null;
    const cryptoSub = user.cryptoSubscription ?? null;

    const paddleActive =
      paddleSub?.provider === 'paddle' &&
      ['ACTIVE', 'TRIALING', 'SUSPENDED'].includes((paddleSub.status ?? '').toUpperCase());

    // Also accept a cancelled-but-still-in-period Paddle sub (user might want history)
    const hasPaddleHistory =
      paddleSub?.provider === 'paddle' &&
      ['CANCELLED', 'EXPIRED'].includes((paddleSub.status ?? '').toUpperCase());

    const hasNowPayments =
      cryptoSub?.provider === 'nowpayments' &&
      ['ACTIVE', 'SUSPENDED', 'PENDING_RENEWAL'].includes((cryptoSub.status ?? '').toUpperCase());

    // ── NOWPayments: no customer portal — return info for the frontend ────────
    if (!paddleActive && !hasPaddleHistory && hasNowPayments) {
      return NextResponse.json({
        provider:       'nowpayments',
        hasPortal:      false,
        subscriptionId: cryptoSub.subscriptionId,
        status:         cryptoSub.status,
        periodEnd:      cryptoSub.periodEnd ?? null,
        message:        'Your subscription is managed via NOWPayments. To cancel or modify it, please contact support.',
        supportUrl:     'mailto:support@freecustom.email',
      });
    }

    // ── No active subscription at all ─────────────────────────────────────────
    if (!paddleActive && !hasPaddleHistory) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 });
    }

    // ── Paddle portal ─────────────────────────────────────────────────────────
    const sub = paddleSub;

    if (!sub.customerId) {
      // customerId wasn't saved for subscriptions created before the webhook fix.
      console.warn(`[Paddle Portal] No customerId for user ${wyiUserId} — falling back to portal homepage`);
      return NextResponse.json({
        provider:  'paddle',
        hasPortal: true,
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
        body: JSON.stringify({ subscription_ids: [sub.subscriptionId] }),
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
    const manageUrl: string = subLinks[0]?.update_payment_method ?? overviewUrl;

    return NextResponse.json({ provider: 'paddle', hasPortal: true, url: manageUrl });
  } catch (error) {
    console.error('[Paddle Portal] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}