// app/api/paddle/webhook/route.ts
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { fetchFromServiceAPI } from '@/lib/api';
import crypto from 'crypto';

// ---------------------------------------------------------------
// Paddle Webhook Signature Verification
// Paddle uses HMAC-SHA256 with a secret key from your dashboard.
// Header format: ts=<timestamp>;h1=<hmac>
// See: https://developer.paddle.com/webhooks/signature-verification
// ---------------------------------------------------------------
function verifyPaddleSignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!signatureHeader) return false;

  const secret = process.env.PADDLE_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[Paddle Webhook] PADDLE_WEBHOOK_SECRET is not set');
    return false;
  }

  try {
    // Parse: ts=1234567890;h1=<hmac>
    const parts = Object.fromEntries(
      signatureHeader.split(';').map((p) => p.split('=') as [string, string])
    );
    const { ts, h1 } = parts;
    if (!ts || !h1) return false;

    // Prevent replay attacks — reject events older than 5 minutes
    const eventTimestamp = parseInt(ts, 10);
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - eventTimestamp) > 300) {
      console.warn('[Paddle Webhook] Timestamp too old — possible replay attack');
      return false;
    }

    // HMAC: signed payload = ts + ":" + rawBody
    const signedPayload = `${ts}:${rawBody}`;
    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(signedPayload)
      .digest('hex');

    return crypto.timingSafeEqual(Buffer.from(h1, 'hex'), Buffer.from(expectedSig, 'hex'));
  } catch (err) {
    console.error('[Paddle Webhook] Signature parse error:', err);
    return false;
  }
}

// ---------------------------------------------------------------
// Extract userId from Paddle custom_data
// Set during checkout: customData: { userId }
// ---------------------------------------------------------------
function getUserIdFromEvent(event: any): string | null {
  return (
    event?.data?.custom_data?.userId ||
    event?.data?.items?.[0]?.price?.custom_data?.userId ||
    null
  );
}

function getSubscriptionId(event: any): string | null {
  return event?.data?.id || event?.data?.subscription_id || null;
}

// ---------------------------------------------------------------
// Event Handlers
// ---------------------------------------------------------------

async function handleSubscriptionActivated(event: any) {
  const userId = getUserIdFromEvent(event);
  const data = event.data;

  await fetchFromServiceAPI('/paddle/subscription-event', {
    method: 'POST',
    body: JSON.stringify({
      eventType: 'ACTIVATED',
      userId,
      subscriptionId: data.id,
      priceId: data.items?.[0]?.price?.id,
      status: data.status,           // 'active'
      startTime: data.started_at ?? data.created_at,
      nextBilledAt: data.next_billed_at,
      payerEmail: data.customer?.email,
      scheduledChange: data.scheduled_change ?? null,
      rawEvent: event,
    }),
  });
}

async function handleSubscriptionTrialing(event: any) {
  const userId = getUserIdFromEvent(event);
  const data = event.data;

  await fetchFromServiceAPI('/paddle/subscription-event', {
    method: 'POST',
    body: JSON.stringify({
      eventType:      'ACTIVATED',   // grant pro access during trial
      userId,
      subscriptionId: data.id,
      priceId:        data.items?.[0]?.price?.id,
      status:         data.status,   // 'trialing'
      startTime:      data.started_at ?? data.created_at,
      nextBilledAt:   data.next_billed_at,
      payerEmail:     data.customer?.email,
      scheduledChange: data.scheduled_change ?? null,
      rawEvent:       event,
    }),
  });
}

async function handleSubscriptionCanceled(event: any) {
  const userId = getUserIdFromEvent(event);
  const data = event.data;

  await fetchFromServiceAPI('/paddle/subscription-event', {
    method: 'POST',
    body: JSON.stringify({
      eventType: 'CANCELLED',
      userId,
      subscriptionId: data.id,
      status: data.status,           // 'canceled'
      canceledAt: data.canceled_at,
      rawEvent: event,
    }),
  });
}

async function handleSubscriptionPaused(event: any) {
  const userId = getUserIdFromEvent(event);
  const data = event.data;

  await fetchFromServiceAPI('/paddle/subscription-event', {
    method: 'POST',
    body: JSON.stringify({
      eventType: 'SUSPENDED',
      userId,
      subscriptionId: data.id,
      status: data.status,           // 'paused'
      pausedAt: data.paused_at,
      rawEvent: event,
    }),
  });
}

async function handleSubscriptionResumed(event: any) {
  const userId = getUserIdFromEvent(event);
  const data = event.data;

  await fetchFromServiceAPI('/paddle/subscription-event', {
    method: 'POST',
    body: JSON.stringify({
      eventType: 'ACTIVATED',           // Reuse ACTIVATED to restore pro plan
      userId,
      subscriptionId: data.id,
      status: data.status,           // 'active'
      rawEvent: event,
    }),
  });
}

async function handleSubscriptionUpdated(event: any) {
  const userId = getUserIdFromEvent(event);
  const data = event.data;

  await fetchFromServiceAPI('/paddle/subscription-event', {
    method: 'POST',
    body: JSON.stringify({
      eventType: 'UPDATED',
      userId,
      subscriptionId: data.id,
      priceId: data.items?.[0]?.price?.id,
      status: data.status,
      rawEvent: event,
    }),
  });
}

async function handleTransactionCompleted(event: any) {
  // Fires on every successful charge (new subscription or renewal)
  const data = event.data;
  const subscriptionId = data.subscription_id;

  if (!subscriptionId) return; // One-time payment, not a subscription

  await fetchFromServiceAPI('/paddle/subscription-event', {
    method: 'POST',
    body: JSON.stringify({
      eventType: 'PAYMENT_COMPLETED',
      userId: getUserIdFromEvent(event),
      subscriptionId,
      amount: data.details?.totals?.grand_total,
      currency: data.currency_code,
      rawEvent: event,
    }),
  });
}

async function handleTransactionPaymentFailed(event: any) {
  const data = event.data;
  const subscriptionId = data.subscription_id;

  await fetchFromServiceAPI('/paddle/subscription-event', {
    method: 'POST',
    body: JSON.stringify({
      eventType: 'PAYMENT_FAILED',
      userId: getUserIdFromEvent(event),
      subscriptionId,
      rawEvent: event,
    }),
  });
}

async function handleTransactionRefunded(event: any) {
  const data = event.data;
  const subscriptionId = data.subscription_id;

  await fetchFromServiceAPI('/paddle/subscription-event', {
    method: 'POST',
    body: JSON.stringify({
      eventType: 'REFUNDED',
      subscriptionId,
      amount: data.details?.totals?.grand_total,
      currency: data.currency_code,
      rawEvent: event,
    }),
  });
}

// ---------------------------------------------------------------
// Main Webhook Route
// ---------------------------------------------------------------
export async function POST(request: Request) {
  const headersList = await headers();
  const rawBody = await request.text();
  const signatureHeader = headersList.get('paddle-signature');

  // 1. Verify signature — ALWAYS in production
  if (process.env.NODE_ENV === 'production') {
    const isValid = verifyPaddleSignature(rawBody, signatureHeader);
    if (!isValid) {
      console.error('[Paddle Webhook] Signature verification FAILED. Rejecting request.');
      return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 401 });
    }
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const eventType: string = event?.event_type ?? '';
  console.log(`[Paddle Webhook] Received: ${eventType} | ID: ${event?.notification_id}`);

  try {
    switch (eventType) {
      case 'subscription.created':
        await handleSubscriptionActivated(event); // reuse existing handler
        break;

      case 'subscription.trialing':
        await handleSubscriptionTrialing(event);
        break;

      // Subscription lifecycle
      case 'subscription.activated':
        await handleSubscriptionActivated(event);
        break;
      case 'subscription.canceled':
        await handleSubscriptionCanceled(event);
        break;
      case 'subscription.paused':
        await handleSubscriptionPaused(event);
        break;
      case 'subscription.resumed':
        await handleSubscriptionResumed(event);
        break;
      case 'subscription.updated':
        await handleSubscriptionUpdated(event);
        break;

      // Transaction / payment events
      case 'transaction.completed':
        await handleTransactionCompleted(event);
        break;
      case 'transaction.payment_failed':
        await handleTransactionPaymentFailed(event);
        break;
      case 'transaction.refunded':
        await handleTransactionRefunded(event);
        break;

      default:
        console.log(`[Paddle Webhook] Unhandled event: ${eventType}`);
    }
  } catch (err) {
    console.error(`[Paddle Webhook] Error processing ${eventType}:`, err);
    // Return 200 so Paddle doesn't retry indefinitely. Log to Sentry etc.
    return NextResponse.json({ received: true, warning: 'Processing error occurred' }, { status: 200 });
  }

  // Paddle requires a 200 response within 5 s or it will retry
  return NextResponse.json({ received: true }, { status: 200 });
}