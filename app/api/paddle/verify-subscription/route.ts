// app/api/paddle/verify-transaction/route.ts
// Explicit fallback: verifies a Paddle transaction by ID and upgrades the user.
// Called only when session polling times out on the success page.
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { fetchFromServiceAPI } from '@/lib/api';

const PADDLE_API =
  process.env.NEXT_PUBLIC_PADDLE_ENV === 'sandbox'
    ? 'https://sandbox-api.paddle.com'
    : 'https://api.paddle.com';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { transactionId } = await request.json();
  if (!transactionId) {
    return NextResponse.json({ error: 'transactionId is required' }, { status: 400 });
  }

  // Fetch the transaction from Paddle
  const txRes = await fetch(`${PADDLE_API}/transactions/${transactionId}`, {
    headers: {
      Authorization: `Bearer ${process.env.PADDLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  const txJson = await txRes.json();
  if (!txRes.ok) {
    console.error('[Paddle verify-transaction] API error:', txJson);
    return NextResponse.json({ error: 'Failed to fetch transaction from Paddle' }, { status: 400 });
  }

  const tx = txJson.data;

  // Must be completed and belong to this user
  if (tx.status !== 'completed') {
    return NextResponse.json(
      { error: `Transaction status is '${tx.status}', not completed` },
      { status: 400 }
    );
  }

  const customUserId = tx.custom_data?.userId;
  if (customUserId && customUserId !== session.user.id) {
    console.error(`[Paddle verify-transaction] userId mismatch: ${customUserId} vs ${session.user.id}`);
    return NextResponse.json({ error: 'Transaction does not belong to this user' }, { status: 403 });
  }

  // Upgrade the user via the backend service
  await fetchFromServiceAPI('/user/upgrade', {
    method: 'POST',
    body: JSON.stringify({
      userId:         session.user.id,
      subscriptionId: tx.subscription_id,
      planId:         tx.items?.[0]?.price?.id,
      status:         'ACTIVE',
      startTime:      tx.created_at,
      provider:       'paddle',
      payer: {
        email: tx.customer?.email ?? null,
      },
    }),
  });

  return NextResponse.json({ success: true, plan: 'pro' });
}