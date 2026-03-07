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

const jwtSecret = new TextEncoder().encode(process.env.JWT_SECRET);
const limiter = rateLimit({ interval: 60 * 1000, uniqueTokenPerInterval: 500 });

async function signServiceToken(plan: string): Promise<string> {
  return new SignJWT({ plan })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(jwtSecret);
}

export async function GET(request: Request) {
  // 1. Anti-Scraping check: Require the custom header from your frontend
  if (request.headers.get('x-fce-client') !== 'web-client') {
    return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 });
  }

  const session = await auth();
  const plan    = (session?.user as any)?.plan ?? 'free';
  const userId  = session?.user?.id ?? 'anonymous';

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

    // 2. Prevent search engines from indexing this JSON
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');

    // 3. Fix the CDN caching leak
    // We tell the CDN: "If the user has a different Cookie, give them a different cached version"
    response.headers.set('Vary', 'Cookie, Authorization');

    if (plan === 'pro') {
      // Pro users get PRIVATE cache. Only their specific browser caches it. 
      // The CDN will NEVER cache this for other users.
      response.headers.set('Cache-Control', 'private, max-age=300, stale-while-revalidate=60');
    } else {
      // Free users get PUBLIC cache, so the CDN can absorb the heavy traffic of anonymous users.
      response.headers.set('Cache-Control', 'public, max-age=300, s-maxage=300, stale-while-revalidate=60');
    }

    return response;
  } catch {
    return NextResponse.json({ error: 'Service error' }, { status: 500 });
  }
}