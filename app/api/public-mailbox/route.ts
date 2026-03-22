// app/api/public-mailbox/route.ts
import { NextResponse } from 'next/server';
import { callInternalAPI, authenticateRequest } from '@/lib/api';
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
  const ip = reqHeaders.get('cf-connecting-ip') || reqHeaders.get('x-forwarded-for') || 'guest';

  // ── 1. Reject requests not coming through your own frontend ──────────────
  if (!isValidPublicRequest(reqHeaders as any)) {
    return NextResponse.json({ error: 'Unauthorized source' }, { status: 403 });
  }

  // ── 2. Require a valid client-issued JWT (from /api/auth) ────────────────
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

  // ── 4. Sign a downstream service token ──────────────────────────────────
  const signedToken = await signServiceToken('free');

  const { searchParams } = new URL(request.url);
  const mailbox = searchParams.get('fullMailboxId');
  const messageId = searchParams.get('messageId');

  if (!mailbox) {
    return NextResponse.json({ error: 'Mailbox required' }, { status: 400 });
  }

  try {
    const options = { 
        method: 'GET',
        headers: { Authorization: `Bearer ${signedToken}` } 
    };
    
    const path = messageId
      ? `/mailbox/${mailbox}/message/${messageId}`
      : `/mailbox/${mailbox}`;

    // Proxies to internal backend with full security signatures
    const data = await callInternalAPI(request, path, options);

    return NextResponse.json(data);
  } catch (error: any) {
    if (error.message === 'TOO_MANY_REQUESTS') {
        return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }
    return NextResponse.json({ error: 'Service error' }, { status: 500 });
  }
}
