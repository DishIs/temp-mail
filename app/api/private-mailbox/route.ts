// app/api/private-mailbox/route.ts
import { NextResponse } from 'next/server';
import { fetchFromServiceAPI } from '@/lib/api';
import { SignJWT } from 'jose';
import { rateLimit } from '@/lib/rate-limit';
import { auth } from '@/auth';

// ── Rate limiters — one per operation, separate counters ─────────────────────
//
// Limits here are the Next.js layer (per-user, in-process).
// The gateway layer enforces per-IP plan-aware limits on top.
// These exist so a single logged-in user can't hammer the backend even if
// they bypass nginx/gateway (e.g. direct Vercel/Cloudflare Workers calls).
//
// Pro gets 5× free — mirrors the gateway Redis limits.
const listLimiter   = rateLimit({ interval: 60_000, uniqueTokenPerInterval: 500 });
const deleteLimiter = rateLimit({ interval: 60_000, uniqueTokenPerInterval: 500 });

const jwtSecret = new TextEncoder().encode(process.env.JWT_SECRET);

const EXPIRY_WARN_DAYS = 30;
const DOMAIN_CACHE_TTL = 5 * 60 * 1000; // 5 min

interface DomainExpiry {
  domain: string;
  expires_at: string;
  expires_in_days: number;
  expiring_soon: boolean;
  expired: boolean;
}

let _domainCache: { data: DomainExpiry[]; fetchedAt: number } | null = null;

async function getDomainExpiryMap(token: string): Promise<Map<string, DomainExpiry>> {
  const now = Date.now();
  if (_domainCache && now - _domainCache.fetchedAt < DOMAIN_CACHE_TTL) {
    return new Map(_domainCache.data.map(d => [d.domain, d]));
  }
  try {
    const res = await fetchFromServiceAPI('/domains/expiry', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res?.success && Array.isArray(res.data)) {
      _domainCache = { data: res.data, fetchedAt: now };
      return new Map(res.data.map((d: DomainExpiry) => [d.domain, d]));
    }
  } catch {
    // non-fatal
  }
  return new Map();
}

async function signServiceToken(plan: string): Promise<string> {
  return new SignJWT({ plan })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(jwtSecret);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Returns a 429 response with proper JSON body and Retry-After header.
 * The frontend classifyApiError() reads `code` to decide which toast to show:
 *   RATE_LIMIT_FREE  → amber upgrade toast with /pricing link
 *   RATE_LIMIT_PRO   → plain "retry in Xs" toast, no upgrade CTA
 */
function rateLimitResponse(plan: string, retryAfterSec = 60) {
  const isPro = plan === 'pro';
  return NextResponse.json(
    {
      success: false,
      error:   'too_many_requests',
      code:    isPro ? 'RATE_LIMIT_PRO' : 'RATE_LIMIT_FREE',
      message: isPro
        ? `Rate limit exceeded. Retry in ${retryAfterSec}s.`
        : `Rate limit exceeded. Upgrade to Pro for higher limits. Retry in ${retryAfterSec}s.`,
      retryAfter: retryAfterSec,
    },
    {
      status:  429,
      headers: { 'Retry-After': String(retryAfterSec) },
    }
  );
}

/**
 * Passes backend errors through with the original status code and body,
 * so the frontend receives actionable error details rather than a generic 500.
 *
 * For 500+ backend errors we still return 500 (don't expose internals),
 * but we preserve the message if it's user-facing.
 */
function backendErrorResponse(status: number, message?: string) {
  const safeStatus = status >= 500 ? 500 : status;
  const safeMessage = status >= 500
    ? 'Service error. Please try again.'
    : (message || 'An error occurred.');

  return NextResponse.json(
    { success: false, error: 'service_error', message: safeMessage },
    { status: safeStatus }
  );
}

// ── GET ───────────────────────────────────────────────────────────────────────
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const { id: userId, plan = 'free' } = session.user as { id: string; plan?: string };
  const isPro = plan === 'pro';

  // Per-user rate limit (Next.js layer)
  // Pro: 300/min, Free: 60/min
  const listLimit = isPro ? 300 : 60;
  try {
    await listLimiter.check(listLimit, userId);
  } catch {
    return rateLimitResponse(plan, 60);
  }

  const signedToken = await signServiceToken(plan);

  const { searchParams } = new URL(request.url);
  const mailbox   = searchParams.get('fullMailboxId');
  const messageId = searchParams.get('messageId');

  if (!mailbox) return NextResponse.json({ error: 'Mailbox required' }, { status: 400 });

  try {
    const options = { headers: { Authorization: `Bearer ${signedToken}` } };

    if (messageId) {
      // Single message fetch — no expiry injection needed
      const data = await fetchFromServiceAPI(
        `/mailbox/${mailbox}/message/${messageId}`,
        options,
      );
      return NextResponse.json(data);
    }

    // Inbox list — inject domain expiry if near
    const data = await fetchFromServiceAPI(`/mailbox/${mailbox}`, options);

    const inboxDomain = mailbox.split('@')[1];
    if (inboxDomain && data?.success) {
      const expiryMap  = await getDomainExpiryMap(signedToken);
      const domainInfo = expiryMap.get(inboxDomain);
      if (domainInfo && (domainInfo.expiring_soon || domainInfo.expired)) {
        data.domain_expiry = {
          domain:          domainInfo.domain,
          expires_at:      domainInfo.expires_at,
          expires_in_days: domainInfo.expires_in_days,
          expiring_soon:   domainInfo.expiring_soon,
          expired:         domainInfo.expired,
        };
      }
    }

    return NextResponse.json(data);

  } catch (error: any) {
    // Pass 429 from backend through with correct code/plan info
    if (error.message === 'TOO_MANY_REQUESTS' || error.status === 429) {
      return rateLimitResponse(plan, 30);
    }
    const status  = error.status  || 500;
    const message = error.message || undefined;
    return backendErrorResponse(status, message);
  }
}

// ── DELETE ────────────────────────────────────────────────────────────────────
export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const { id: userId, plan = 'free' } = session.user as { id: string; plan?: string };
  const isPro = plan === 'pro';

  // Pro: 100 deletes/min, Free: 20/min
  const deleteLimit = isPro ? 100 : 20;
  try {
    await deleteLimiter.check(deleteLimit, `${userId}_del`);
  } catch {
    return rateLimitResponse(plan, 60);
  }

  const signedToken = await signServiceToken(plan);

  const { searchParams } = new URL(request.url);
  const mailbox   = searchParams.get('fullMailboxId');
  const messageId = searchParams.get('messageId');

  if (!mailbox || !messageId) {
    return NextResponse.json({ error: 'Params required' }, { status: 400 });
  }

  try {
    const data = await fetchFromServiceAPI(`/mailbox/${mailbox}/message/${messageId}`, {
      method:  'DELETE',
      headers: { Authorization: `Bearer ${signedToken}` },
    });
    return NextResponse.json(data);

  } catch (error: any) {
    if (error.message === 'TOO_MANY_REQUESTS' || error.status === 429) {
      return rateLimitResponse(plan, 30);
    }
    const status  = error.status  || 500;
    const message = error.message || undefined;
    return backendErrorResponse(status, message);
  }
}