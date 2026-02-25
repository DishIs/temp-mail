// app/api/ws-ticket/route.ts
import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { auth } from '@/auth';

const jwtSecret = new TextEncoder().encode(process.env.JWT_SECRET);

export async function POST(request: Request) {
  const session = await auth();

  // Allow unauthenticated users too (public mailboxes) — just don't embed plan info
  const plan = (session?.user as any)?.plan ?? 'free';
  const userId = session?.user?.id ?? 'anonymous';

  const { mailbox } = await request.json();
  if (!mailbox) return NextResponse.json({ error: 'Mailbox required' }, { status: 400 });

  const token = await new SignJWT({ mailbox, plan, sub: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('60s') // Only needs to last long enough to open the socket
    .sign(jwtSecret);

  return NextResponse.json({ token });
}