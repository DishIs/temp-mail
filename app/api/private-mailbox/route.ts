// app/api/private-mailbox/route.ts
import { NextResponse } from 'next/server';
import { fetchFromServiceAPI } from '@/lib/api';
import jwt from "jsonwebtoken";
import { rateLimit } from '@/lib/rate-limit';
import { getToken } from 'next-auth/jwt';

// Rate limiter instance
const limiter = rateLimit({
  interval: 60 * 1000,
  uniqueTokenPerInterval: 500,
});

export async function GET(request: Request) {
  // 1. Auth Check
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


  const userId = token?.id;
  // @ts-ignore
  const plan = token.plan || 'free';

  // 2. Tier-based Rate Limits
  const limit = plan === 'pro' ? 300 : 60; // 300 req/min for Pro, 60 for Free

  try {
    await limiter.check(limit, userId);
  } catch {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  // 3. Generate Auth Token
  const signedToken = jwt.sign(
    { plan },
    process.env.JWT_SECRET as string,
    { algorithm: "HS256", expiresIn: "15m" }
  );

  const { searchParams } = new URL(request.url);
  const mailbox = searchParams.get('fullMailboxId');
  const messageId = searchParams.get('messageId');

  if (!mailbox) return NextResponse.json({ error: 'Mailbox required' }, { status: 400 });

  try {
    let data;
    const options = { headers: { 'Authorization': `Bearer ${signedToken}` } };

    if (messageId) {
      data = await fetchFromServiceAPI(`/mailbox/${mailbox}/message/${messageId}`, options);
    } else {
      data = await fetchFromServiceAPI(`/mailbox/${mailbox}`, options);
    }
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Service error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
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


  // @ts-ignore
  const plan = token.plan || 'free';

  // Rate limit DELETE actions specifically if you want, or share the limit
  try {
    // Optional: Stricter delete limit?
    await limiter.check(plan === 'pro' ? 100 : 20, token.id + '_DELETE');
  } catch {
    return NextResponse.json({ error: 'Action limit exceeded' }, { status: 429 });
  }

  const signedToken = jwt.sign(
    { plan },
    process.env.NEXTAUTH_SECRET as string,
    { algorithm: "HS256", expiresIn: "15m" }
  );

  const { searchParams } = new URL(request.url);
  const mailbox = searchParams.get('fullMailboxId');
  const messageId = searchParams.get('messageId');

  if (!mailbox || !messageId) return NextResponse.json({ error: 'Params required' }, { status: 400 });

  try {
    const data = await fetchFromServiceAPI(`/mailbox/${mailbox}/message/${messageId}`, {
      method: "DELETE",
      headers: { 'Authorization': `Bearer ${signedToken}` }
    });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}