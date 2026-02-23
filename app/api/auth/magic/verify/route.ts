import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { randomBytes } from 'crypto';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!token) {
    return NextResponse.redirect(new URL('/auth?error=missing', req.url));
  }

  const ctx = await getCloudflareContext<{ AUTH_KV: KVNamespace }>();
  const kv = ctx.env.AUTH_KV;

  const email = await kv.get(`magic:${token}`);
  if (!email) {
    return NextResponse.redirect(new URL('/auth?error=expired', req.url));
  }

  // Consume the magic token immediately (one-time use)
  await kv.delete(`magic:${token}`);

  // Issue a short-lived exchange code (30s is plenty for the redirect)
  const code = randomBytes(16).toString('hex');
  await kv.put(`magic:exchange:${code}`, email, { expirationTtl: 60 });

  // Redirect to a Next.js page that will call signIn() as a Server Action
  return NextResponse.redirect(
    new URL(`/auth/magic-callback?code=${code}`, req.url)
  );
}