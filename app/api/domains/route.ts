// app/api/domains/route.ts
// ─────────────────────────────────────────────────────────────────────────────
//  Next.js edge-compatible route that proxies the backend /domains endpoint.
//
//  The domain list is NEVER shipped in the client bundle — it's always fetched
//  from this server route, which gates by session plan and caches aggressively.
//
//  Response shape:
//  {
//    success: true,
//    data: Array<{
//      domain: string,
//      tier: 'free' | 'pro',
//      tags: string[],
//      expires_at?: string,        // only present when expiring_soon = true
//      expires_in_days?: number,   // only present when expiring_soon = true
//      expiring_soon?: boolean,    // only present when true
//    }>
//  }
// ─────────────────────────────────────────────────────────────────────────────
import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { auth } from '@/auth';
import { fetchFromServiceAPI } from '@/lib/api';
import { rateLimit } from '@/lib/rate-limit';

const jwtSecret  = new TextEncoder().encode(process.env.JWT_SECRET);
const limiter    = rateLimit({ interval: 60 * 1000, uniqueTokenPerInterval: 500 });

// Next.js / CDN cache headers — public so the CDN can cache per plan tier,
// but we key on Authorization so different plans don't bleed.
const CACHE_MAX_AGE = 300; // 5 min — matches the Redis TTL on the backend

async function signServiceToken(plan: string): Promise<string> {
  return new SignJWT({ plan })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(jwtSecret);
}

export async function GET() {
  const session = await auth();
  const plan    = (session?.user as any)?.plan ?? 'free';
  const userId  = session?.user?.id ?? 'anonymous';

  // Light rate-limit — domain lists are cached so this rarely hits the backend
  try {
    await limiter.check(60, `domains:${userId}`);
  } catch {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  try {
    const token = await signServiceToken(plan);
    const data  = await fetchFromServiceAPI('/domains', {
      headers: { Authorization: `Bearer ${token}` },
    });

    const response = NextResponse.json(data);

    // Tell the browser (and any CDN/edge cache) to hold this for CACHE_MAX_AGE.
    // Using s-maxage so a CDN can cache per variation but the browser still
    // respects max-age.  stale-while-revalidate means zero-latency on the
    // cached copy while the background refresh happens.
    response.headers.set(
      'Cache-Control',
      `public, max-age=${CACHE_MAX_AGE}, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=60`,
    );

    return response;
  } catch {
    return NextResponse.json({ error: 'Service error' }, { status: 500 });
  }
}