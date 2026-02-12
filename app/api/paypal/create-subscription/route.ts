// app/api/paypal/create-subscription/route.ts
import { NextResponse } from 'next/server';
import { getPayPalAccessToken, PAYPAL_PLANS } from '@/lib/paypal';
import { getToken } from 'next-auth/jwt';

const PAYPAL_API = process.env.PAYPAL_API_URL || 'https://api-m.sandbox.paypal.com';

export async function POST(request: Request) {
  const token = await getToken({
        req: request as any,
        secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token?.id) {
        return NextResponse.json(
            { success: false, message: 'Unauthorized' },
            { status: 401 }
        );
    }

  try {
    const { cycle } = await request.json();
    
    // Validate cycle
    if (!cycle || !['weekly', 'monthly', 'yearly'].includes(cycle)) {
      return NextResponse.json({ error: 'Invalid billing cycle selected' }, { status: 400 });
    }

    const planId = PAYPAL_PLANS[cycle as keyof typeof PAYPAL_PLANS];

    // 🔍 DEBUG LOG: Check what is actually being sent
    console.log(`[PayPal] Creating subscription for cycle: ${cycle}`);
    console.log(`[PayPal] Using Plan ID: ${planId}`);
    console.log(`[PayPal] Target API: ${PAYPAL_API}`);

    if (!planId) {
      console.error(`[PayPal] Missing Plan ID for ${cycle}. Check .env variables.`);
      return NextResponse.json({ error: 'Server configuration error: Plan ID missing' }, { status: 500 });
    }

    const accessToken = await getPayPalAccessToken();

    // PayPal Subscriptions V1 Payload
    const subscriptionPayload = {
      plan_id: planId,
      custom_id: token.id,
      application_context: {
        brand_name: "Free Custom Email",
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
      console.error("[PayPal API Error Dump]:", JSON.stringify(data, null, 2));
      
      // Handle specific invalid resource error
      if (data.name === 'RESOURCE_NOT_FOUND') {
        return NextResponse.json({ 
          error: 'PayPal Plan Configuration Error. The Plan ID in .env does not match the PayPal environment.' 
        }, { status: 400 });
      }

      return NextResponse.json({ error: data.message || 'PayPal API Error', details: data }, { status: 400 });
    }

    const approveLink = data.links.find((link: any) => link.rel === 'approve');

    if (!approveLink) {
        console.error("[PayPal] No approval link in response:", data);
        return NextResponse.json({ error: 'No approval link returned from PayPal' }, { status: 500 });
    }

    return NextResponse.json({ url: approveLink.href });

  } catch (error) {
    console.error('[PayPal] Create Subscription Exception:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}