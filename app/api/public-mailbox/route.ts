// app/api/public-mailbox/route.ts
import { NextResponse } from 'next/server';
import { fetchFromServiceAPI } from '@/lib/api';
import jwt from "jsonwebtoken";
import { headers } from 'next/headers';
import { rateLimit, isValidPublicRequest } from '@/lib/rate-limit';

// Strict limits for guests (e.g., 20 requests per minute)
const limiter = rateLimit({
  interval: 60 * 1000, 
  uniqueTokenPerInterval: 500, 
});

export async function GET(request: Request) {
  const reqHeaders = await headers();
  const ip = reqHeaders.get('x-forwarded-for') || 'guest';

  // 1. Security Check (Anti-Bot / External Access)
  if (!isValidPublicRequest(reqHeaders as any)) {
    return NextResponse.json({ error: 'Unauthorized source' }, { status: 403 });
  }

  // 2. IP Rate Limit
  try {
    await limiter.check(20, ip);
  } catch {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  // 3. Generate Guest Token
  const signedToken = jwt.sign(
    { plan: 'guest' },
    process.env.JWT_SECRET as string,
    { algorithm: "HS256", expiresIn: "5m" }
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

// DELETE is not allowed for guests in public mailbox usually, 
// or you can implement it similarly if needed.