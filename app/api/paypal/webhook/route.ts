// app/api/paypal/webhook/route.ts
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getPayPalAccessToken } from '@/lib/paypal';
import { fetchFromServiceAPI } from '@/lib/api';

const PAYPAL_API = process.env.PAYPAL_API_URL || 'https://api-m.sandbox.paypal.com';
const PAYPAL_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID!;

// ---------------------------------------------------------------
// PayPal Webhook Signature Verification
// This is MANDATORY for production. Never skip this step.
// See: https://developer.paypal.com/api/rest/webhooks/
// ---------------------------------------------------------------
async function verifyPayPalWebhook(
  rawBody: string,
  incomingHeaders: Headers
): Promise<boolean> {
  try {
    const accessToken = await getPayPalAccessToken();

    const verificationPayload = {
      auth_algo:         incomingHeaders.get('paypal-auth-algo') || '',
      cert_url:          incomingHeaders.get('paypal-cert-url') || '',
      transmission_id:   incomingHeaders.get('paypal-transmission-id') || '',
      transmission_sig:  incomingHeaders.get('paypal-transmission-sig') || '',
      transmission_time: incomingHeaders.get('paypal-transmission-time') || '',
      webhook_id:        PAYPAL_WEBHOOK_ID,
      webhook_event:     JSON.parse(rawBody),
    };

    const res = await fetch(`${PAYPAL_API}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(verificationPayload),
    });

    const data = await res.json();
    // PayPal returns verification_status: "SUCCESS" or "FAILURE"
    return data.verification_status === 'SUCCESS';
  } catch (err) {
    console.error('[PayPal Webhook] Signature verification error:', err);
    return false;
  }
}

// ---------------------------------------------------------------
// Event Handlers — map each PayPal event to a backend action
// ---------------------------------------------------------------

/**
 * Extracts a consistent userId from the subscription's custom_id field.
 * This is set during subscription creation (create-subscription route).
 */
function getUserIdFromEvent(event: any): string | null {
  return (
    event?.resource?.custom_id ||          // Subscriptions
    event?.resource?.custom ||             // Older PayPal format
    null
  );
}

async function handleSubscriptionActivated(event: any) {
  const userId = getUserIdFromEvent(event);
  const resource = event.resource;

  if (!userId) {
    console.warn('[PayPal Webhook] ACTIVATED: No userId found in custom_id', event.id);
    return;
  }

  await fetchFromServiceAPI('/paypal/subscription-event', {
    method: 'POST',
    body: JSON.stringify({
      eventType: 'ACTIVATED',
      userId,
      subscriptionId:  resource.id,
      planId:          resource.plan_id,
      status:          resource.status,         // 'ACTIVE'
      startTime:       resource.start_time,
      payerEmail:      resource.subscriber?.email_address,
      payerName:       `${resource.subscriber?.name?.given_name ?? ''} ${resource.subscriber?.name?.surname ?? ''}`.trim(),
      rawEvent:        event,
    }),
  });
}

async function handleSubscriptionCancelled(event: any) {
  const userId = getUserIdFromEvent(event);
  const resource = event.resource;

  if (!userId) {
    // Fall back to looking up by subscriptionId in the backend
    console.warn('[PayPal Webhook] CANCELLED: No userId, falling back to subscriptionId lookup');
  }

  await fetchFromServiceAPI('/paypal/subscription-event', {
    method: 'POST',
    body: JSON.stringify({
      eventType:      'CANCELLED',
      userId,
      subscriptionId: resource.id,
      status:         resource.status,   // 'CANCELLED'
      rawEvent:       event,
    }),
  });
}

async function handleSubscriptionSuspended(event: any) {
  const userId = getUserIdFromEvent(event);
  const resource = event.resource;

  await fetchFromServiceAPI('/paypal/subscription-event', {
    method: 'POST',
    body: JSON.stringify({
      eventType:      'SUSPENDED',
      userId,
      subscriptionId: resource.id,
      status:         resource.status,   // 'SUSPENDED'
      rawEvent:       event,
    }),
  });
}

async function handleSubscriptionExpired(event: any) {
  const userId = getUserIdFromEvent(event);
  const resource = event.resource;

  await fetchFromServiceAPI('/paypal/subscription-event', {
    method: 'POST',
    body: JSON.stringify({
      eventType:      'EXPIRED',
      userId,
      subscriptionId: resource.id,
      status:         'EXPIRED',
      rawEvent:       event,
    }),
  });
}

async function handleSubscriptionUpdated(event: any) {
  const userId = getUserIdFromEvent(event);
  const resource = event.resource;

  await fetchFromServiceAPI('/paypal/subscription-event', {
    method: 'POST',
    body: JSON.stringify({
      eventType:      'UPDATED',
      userId,
      subscriptionId: resource.id,
      planId:         resource.plan_id,
      status:         resource.status,
      rawEvent:       event,
    }),
  });
}

async function handlePaymentCompleted(event: any) {
  // PAYMENT.SALE.COMPLETED fires on every successful renewal charge
  const subscriptionId = event?.resource?.billing_agreement_id;

  if (!subscriptionId) return; // Not a subscription payment

  await fetchFromServiceAPI('/paypal/subscription-event', {
    method: 'POST',
    body: JSON.stringify({
      eventType:      'PAYMENT_COMPLETED',
      subscriptionId,
      amount:         event.resource?.amount?.total,
      currency:       event.resource?.amount?.currency,
      rawEvent:       event,
    }),
  });
}

async function handlePaymentFailed(event: any) {
  // PAYMENT.SALE.DENIED or BILLING.SUBSCRIPTION.PAYMENT.FAILED
  const subscriptionId =
    event?.resource?.billing_agreement_id ||
    event?.resource?.id;

  const userId = getUserIdFromEvent(event);

  await fetchFromServiceAPI('/paypal/subscription-event', {
    method: 'POST',
    body: JSON.stringify({
      eventType:      'PAYMENT_FAILED',
      userId,
      subscriptionId,
      rawEvent:       event,
    }),
  });
}

async function handleRefunded(event: any) {
  const subscriptionId = event?.resource?.billing_agreement_id;

  await fetchFromServiceAPI('/paypal/subscription-event', {
    method: 'POST',
    body: JSON.stringify({
      eventType:      'REFUNDED',
      subscriptionId,
      amount:         event.resource?.amount?.total,
      currency:       event.resource?.amount?.currency,
      rawEvent:       event,
    }),
  });
}

// ---------------------------------------------------------------
// Main Webhook Route
// ---------------------------------------------------------------
export async function POST(request: Request) {
  const headersList = await headers();
  const rawBody = await request.text();

  // 1. Verify the webhook signature — NEVER skip in production
  if (process.env.NODE_ENV === 'production') {
    const isValid = await verifyPayPalWebhook(rawBody, headersList);
    if (!isValid) {
      console.error('[PayPal Webhook] Signature verification FAILED. Rejecting request.');
      return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 401 });
    }
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const eventType: string = event?.event_type ?? '';
  console.log(`[PayPal Webhook] Received: ${eventType} | Event ID: ${event?.id}`);

  try {
    switch (eventType) {
      // Subscription lifecycle
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
        await handleSubscriptionActivated(event);
        break;
      case 'BILLING.SUBSCRIPTION.CANCELLED':
        await handleSubscriptionCancelled(event);
        break;
      case 'BILLING.SUBSCRIPTION.SUSPENDED':
        await handleSubscriptionSuspended(event);
        break;
      case 'BILLING.SUBSCRIPTION.EXPIRED':
        await handleSubscriptionExpired(event);
        break;
      case 'BILLING.SUBSCRIPTION.UPDATED':
        await handleSubscriptionUpdated(event);
        break;
      case 'BILLING.SUBSCRIPTION.RE-ACTIVATED':
        await handleSubscriptionActivated(event);  // Reuse same handler
        break;

      // Payment events
      case 'PAYMENT.SALE.COMPLETED':
        await handlePaymentCompleted(event);
        break;
      case 'PAYMENT.SALE.DENIED':
      case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED':
        await handlePaymentFailed(event);
        break;
      case 'PAYMENT.SALE.REFUNDED':
        await handleRefunded(event);
        break;

      default:
        console.log(`[PayPal Webhook] Unhandled event type: ${eventType}`);
    }
  } catch (err) {
    console.error(`[PayPal Webhook] Error processing event ${eventType}:`, err);
    // Still return 200 so PayPal doesn't keep retrying.
    // Log to your monitoring system (Sentry, etc.) here.
    return NextResponse.json({ received: true, warning: 'Processing error occurred' }, { status: 200 });
  }

  // Always return 200 quickly — PayPal will retry on non-2xx responses
  return NextResponse.json({ received: true }, { status: 200 });
}