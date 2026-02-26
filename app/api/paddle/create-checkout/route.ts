// app/api/paddle/create-checkout/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { fetchFromServiceAPI } from '@/lib/api';

type BillingCycle = 'monthly' | 'monthly_no_trial' | 'yearly';

// Map your Paddle Price IDs from the Paddle dashboard.
// Each price should be a recurring subscription price.
const PADDLE_PRICES: Record<BillingCycle, string> = {
  monthly: process.env.PADDLE_PRICE_MONTHLY_W_TRIAL!,
  monthly_no_trial: process.env.PADDLE_PRICE_MONTHLY_W_NO_TRIAL!,
  yearly: process.env.PADDLE_PRICE_YEARLY!,
};

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    let { cycle } = await request.json() as { cycle: BillingCycle };

    const { data: userData } = await fetchFromServiceAPI('/user/status', {
      method: 'POST',
      body: JSON.stringify({ userId: session.user.id }),
    });

    if (cycle === 'monthly' && userData.hadTrial) cycle = 'monthly_no_trial'

    if (!cycle || !['monthly_no_trial', 'monthly', 'yearly'].includes(cycle)) {
      return NextResponse.json({ error: 'Invalid billing cycle' }, { status: 400 });
    }

    const allowed: BillingCycle[] = ['monthly', 'monthly_no_trial', 'yearly'];
    if (!allowed.includes(cycle)) {
      return NextResponse.json({ error: 'Invalid billing cycle' }, { status: 400 });
    }

    const priceId = PADDLE_PRICES[cycle];
    if (!priceId) {
      console.error('[Paddle] Missing price ID for', cycle);
      return NextResponse.json({ error: 'Price configuration error' }, { status: 500 });
    }

    return NextResponse.json({ priceId, cycle });
  } catch (error) {
    console.error('[Paddle] create-checkout error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}