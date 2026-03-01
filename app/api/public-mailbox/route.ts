// app/api/public-mailbox/route.ts
import { NextResponse } from 'next/server';
import { fetchFromServiceAPI, authenticateRequest } from '@/lib/api';
import { headers } from 'next/headers';
import { rateLimit, isValidPublicRequest } from '@/lib/rate-limit';
import { SignJWT } from 'jose';

const limiter = rateLimit({
  interval: 60 * 1000,
  uniqueTokenPerInterval: 500,
});

const jwtSecret = new TextEncoder().encode(process.env.JWT_SECRET);

async function signServiceToken(plan: string): Promise<string> {
  return new SignJWT({ plan })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(jwtSecret);
}

export async function GET(request: Request) {
  const reqHeaders = await headers();
  const ip = reqHeaders.get('x-forwarded-for') || 'guest';

  // ── 1. Reject requests not coming through your own frontend ──────────────
  if (!isValidPublicRequest(reqHeaders as any)) {
    return NextResponse.json({ error: 'Unauthorized source' }, { status: 403 });
  }

  // ── 2. Require a valid client-issued JWT (from /api/auth) ────────────────
  //    This blocks any caller that hasn't gone through your app first.
  //    No session check — just proof the request came from your frontend.
  const clientPayload = await authenticateRequest(request);
  if (!clientPayload) {
    return NextResponse.json({ error: 'Missing or invalid token' }, { status: 401 });
  }

  // ── 3. Rate-limit per IP as a secondary layer ────────────────────────────
  try {
    await limiter.check(20, ip);
  } catch {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  // ── 4. Sign a downstream service token (no auth() call needed anymore) ───
  //    Plan is always 'free' for unauthenticated public requests.
  const signedToken = await signServiceToken('free');

  const { searchParams } = new URL(request.url);
  const mailbox = searchParams.get('fullMailboxId');
  const messageId = searchParams.get('messageId');

  if (!mailbox) {
    return NextResponse.json({ error: 'Mailbox required' }, { status: 400 });
  }

  try {
    const options = { headers: { Authorization: `Bearer ${signedToken}` } };
    const data = messageId
      ? await fetchFromServiceAPI(`/mailbox/${mailbox}/message/${messageId}`, options)
      : await fetchFromServiceAPI(`/mailbox/${mailbox}`, options);

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Service error' }, { status: 500 });
  }
}