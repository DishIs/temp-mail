// /app/api/auth/route.ts
import { NextResponse } from 'next/server';
import { sign } from '@/lib/jwt';
import { headers } from 'next/headers';
import { rateLimit } from '@/lib/rate-limit';

const authLimiter = rateLimit({ interval: 60 * 1000, uniqueTokenPerInterval: 500 });

export async function POST() {
  const reqHeaders = await headers();
  const ip = reqHeaders.get('x-forwarded-for') || 'guest';

  try {
    await authLimiter.check(10, ip); // 10 token mints/min per IP
  } catch {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  try {
    const token = await sign({ authorized: true });
    return NextResponse.json({ token });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}