// app/api/public-mailbox/route.ts
import { NextResponse } from 'next/server';
import { fetchFromServiceAPI } from '@/lib/api';
import { headers } from 'next/headers';
import { rateLimit, isValidPublicRequest } from '@/lib/rate-limit';
import { SignJWT } from 'jose';
import { auth } from '@/auth';

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

  if (!isValidPublicRequest(reqHeaders as any)) {
    return NextResponse.json({ error: 'Unauthorized source' }, { status: 403 });
  }

  try {
    await limiter.check(20, ip);
  } catch {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  // auth() returns null for unauthenticated users — safe to call here
  const session = await auth();
  const plan = session?.user?.plan ?? 'free';

  const signedToken = await signServiceToken(plan);

  const { searchParams } = new URL(request.url);
  const mailbox = searchParams.get('fullMailboxId');
  const messageId = searchParams.get('messageId');

  if (!mailbox) return NextResponse.json({ error: 'Mailbox required' }, { status: 400 });

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