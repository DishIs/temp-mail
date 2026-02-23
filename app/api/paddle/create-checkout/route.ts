// app/api/paddle/create-checkout/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/auth';

type BillingCycle = 'weekly' | 'monthly' | 'yearly';

// Map your Paddle Price IDs from the Paddle dashboard.
// Each price should be a recurring subscription price.
const PADDLE_PRICES: Record<BillingCycle, string> = {
  weekly:  process.env.PADDLE_PRICE_WEEKLY!,
  monthly: process.env.PADDLE_PRICE_MONTHLY!,
  yearly:  process.env.PADDLE_PRICE_YEARLY!,
};

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { cycle } = await request.json() as { cycle: BillingCycle };

    if (!cycle || !['weekly', 'monthly', 'yearly'].includes(cycle)) {
      return NextResponse.json({ error: 'Invalid billing cycle' }, { status: 400 });
    }

    const priceId = PADDLE_PRICES[cycle];
    if (!priceId) {
      console.error(`[Paddle] Missing price ID for cycle: ${cycle}`);
      return NextResponse.json(
        { error: 'Server configuration error: Paddle Price ID missing' },
        { status: 500 }
      );
    }

    // Return the priceId for client-side Paddle.js overlay checkout.
    // The client-side token is set once when Paddle.js initialises (see layout/script).
    // We do NOT need to create a server-side transaction for overlay checkout —
    // Paddle.js handles it with the client-side token + price ID.
    return NextResponse.json({
      priceId,
      // Pass back the cycle too so the client can display it if needed
      cycle,
    });
  } catch (error) {
    console.error('[Paddle] create-checkout error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}