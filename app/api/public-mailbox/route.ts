// app/api/public-mailbox/route.ts
import { NextResponse } from 'next/server';
import { callInternalAPI, authenticateRequest } from '@/lib/api';
import { headers } from 'next/headers';
import { rateLimit, isValidPublicRequest } from '@/lib/rate-limit';
import { SignJWT } from 'jose';

// Guest users: 20 req/min per IP — tighter since they're unauthenticated
const limiter = rateLimit({ interval: 60_000, uniqueTokenPerInterval: 500 });

const jwtSecret = new TextEncoder().encode(process.env.JWT_SECRET);

async function signServiceToken(plan: string): Promise<string> {
  return new SignJWT({ plan })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(jwtSecret);
}

function rateLimitResponse(retryAfterSec = 60) {
  return NextResponse.json(
    {
      success:    false,
      error:      'too_many_requests',
      code:       'RATE_LIMIT_FREE',
      message:    `Rate limit exceeded. Sign in or upgrade to Pro for higher limits. Retry in ${retryAfterSec}s.`,
      retryAfter: retryAfterSec,
    },
    {
      status:  429,
      headers: { 'Retry-After': String(retryAfterSec) },
    }
  );
}

export async function GET(request: Request) {
  const reqHeaders = await headers();
  const ip = reqHeaders.get('cf-connecting-ip') || reqHeaders.get('x-forwarded-for') || 'guest';

  // 1. Reject requests not coming from the frontend
  if (!isValidPublicRequest(reqHeaders as any)) {
    return NextResponse.json({ error: 'Unauthorized source' }, { status: 403 });
  }

  // 2. Require a valid client-issued JWT (issued by /api/auth)
  const clientPayload = await authenticateRequest(request);
  if (!clientPayload) {
    return NextResponse.json({ error: 'Missing or invalid token' }, { status: 401 });
  }

  // 3. Rate-limit per IP — 20 req/min for guests
  try {
    await limiter.check(20, ip);
  } catch {
    return rateLimitResponse(60);
  }

  // 4. Sign downstream service token as free tier
  const signedToken = await signServiceToken('free');

  const { searchParams } = new URL(request.url);
  const mailbox   = searchParams.get('fullMailboxId');
  const messageId = searchParams.get('messageId');

  if (!mailbox) {
    return NextResponse.json({ error: 'Mailbox required' }, { status: 400 });
  }

  try {
    const options = {
      method:  'GET',
      headers: { Authorization: `Bearer ${signedToken}` },
    };

    const path = messageId
      ? `/mailbox/${mailbox}/message/${messageId}`
      : `/mailbox/${mailbox}`;

    const data = await callInternalAPI(request, path, options);
    return NextResponse.json(data);

  } catch (error: any) {
    if (error.message === 'TOO_MANY_REQUESTS' || error.status === 429) {
      return rateLimitResponse(30);
    }
    return NextResponse.json(
      { success: false, error: 'service_error', message: 'Service error. Please try again.' },
      { status: 500 }
    );
  }
}