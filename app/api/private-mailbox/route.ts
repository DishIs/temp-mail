// app/api/private-mailbox/route.ts
import { NextResponse } from 'next/server';
import { fetchFromServiceAPI } from '@/lib/api';
import { SignJWT } from 'jose';
import { rateLimit } from '@/lib/rate-limit';
import { getToken } from '@/lib/session';

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
  const token = await getToken(request);

  if (!token?.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const userId = token.id;
  const plan = token.plan || 'free';
  const limit = plan === 'pro' ? 300 : 60;

  try {
    await limiter.check(limit, userId);
  } catch {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

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

export async function DELETE(request: Request) {
  const token = await getToken(request);

  if (!token?.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const plan = token.plan || 'free';

  try {
    await limiter.check(plan === 'pro' ? 100 : 20, token.id + '_DELETE');
  } catch {
    return NextResponse.json({ error: 'Action limit exceeded' }, { status: 429 });
  }

  const signedToken = await signServiceToken(plan);

  const { searchParams } = new URL(request.url);
  const mailbox = searchParams.get('fullMailboxId');
  const messageId = searchParams.get('messageId');

  if (!mailbox || !messageId) return NextResponse.json({ error: 'Params required' }, { status: 400 });

  try {
    const data = await fetchFromServiceAPI(`/mailbox/${mailbox}/message/${messageId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${signedToken}` },
    });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}