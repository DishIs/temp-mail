import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getPayPalAccessToken, PAYPAL_PLANS } from '@/lib/paypal';

const PAYPAL_API = process.env.PAYPAL_API_URL || 'https://api-m.sandbox.paypal.com';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { cycle } = await request.json();
    const planId = PAYPAL_PLANS[cycle as keyof typeof PAYPAL_PLANS];

    if (!planId) {
      return NextResponse.json({ error: 'Invalid or missing Plan ID configuration' }, { status: 400 });
    }

    const accessToken = await getPayPalAccessToken();

    // PayPal Subscriptions V1 Payload
    const subscriptionPayload = {
      plan_id: planId,
      custom_id: session.user.id, // Store User ID here to track who subscribed
      application_context: {
        brand_name: "FreeCustom.Email",
        locale: "en-US",
        user_action: "SUBSCRIBE_NOW",
        payment_method: {
          payer_selected: "PAYPAL",
          payee_preferred: "IMMEDIATE_PAYMENT_REQUIRED"
        },
        return_url: `${process.env.NEXTAUTH_URL}/payment/success`,
        cancel_url: `${process.env.NEXTAUTH_URL}/pricing`
      }
    };

    const response = await fetch(`${PAYPAL_API}/v1/billing/subscriptions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(subscriptionPayload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("PayPal API Error:", data);
      return NextResponse.json({ error: data.message || 'PayPal API Error', details: data }, { status: 400 });
    }

    const approveLink = data.links.find((link: any) => link.rel === 'approve');

    if (!approveLink) {
        return NextResponse.json({ error: 'No approval link returned from PayPal' }, { status: 500 });
    }

    return NextResponse.json({ url: approveLink.href });

  } catch (error) {
    console.error('Create Subscription Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}