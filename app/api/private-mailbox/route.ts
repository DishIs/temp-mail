// app/api/private-mailbox/route.ts  (updated — domain expiry injection)
// ─────────────────────────────────────────────────────────────────────────────
//  Changes from previous version:
//    • On list requests (no messageId) the response is augmented with a
//      `domain_expiry` field whenever the inbox's domain is within
//      EXPIRY_WARN_DAYS days of expiring.  The EmailBox component uses this
//      to show a transfer nudge without a separate API call.
//    • Domain expiry is fetched from the backend /domains/expiry endpoint and
//      cached in memory for DOMAIN_CACHE_TTL ms to avoid per-request overhead.
// ─────────────────────────────────────────────────────────────────────────────
import { NextResponse } from 'next/server';
import { fetchFromServiceAPI } from '@/lib/api';
import { SignJWT } from 'jose';
import { rateLimit } from '@/lib/rate-limit';
import { auth } from '@/auth';

const limiter   = rateLimit({ interval: 60 * 1000, uniqueTokenPerInterval: 500 });
const jwtSecret = new TextEncoder().encode(process.env.JWT_SECRET);

/** Days remaining before we start warning users. Must match backend constant. */
const EXPIRY_WARN_DAYS = 30;

// ─────────────────────────────────────────────────────────────────────────────
//  In-process domain expiry cache (per-process, resets on deploy — that's fine,
//  TTL is short enough).  Avoids a backend call on every mailbox list request.
// ─────────────────────────────────────────────────────────────────────────────
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
    // non-fatal — just return an empty map
  }

  return new Map();
}

// ─────────────────────────────────────────────────────────────────────────────
//  Token helper (unchanged from original)
// ─────────────────────────────────────────────────────────────────────────────
async function signServiceToken(plan: string): Promise<string> {
  return new SignJWT({ plan })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(jwtSecret);
}

// ─────────────────────────────────────────────────────────────────────────────
//  GET handler
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const { id: userId, plan = 'free' } = session.user as { id: string; plan?: string };
  const limit = plan === 'pro' ? 300 : 60;

  try {
    await limiter.check(limit, userId);
  } catch {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  const signedToken = await signServiceToken(plan);

  const { searchParams } = new URL(request.url);
  const mailbox   = searchParams.get('fullMailboxId');
  const messageId = searchParams.get('messageId');

  if (!mailbox) return NextResponse.json({ error: 'Mailbox required' }, { status: 400 });

  try {
    const options = { headers: { Authorization: `Bearer ${signedToken}` } };

    if (messageId) {
      // ── Single message — no expiry injection needed ──────────────────────
      const data = await fetchFromServiceAPI(
        `/mailbox/${mailbox}/message/${messageId}`,
        options,
      );
      return NextResponse.json(data);
    }

    // ── Inbox list — inject domain expiry if near ────────────────────────
    const data = await fetchFromServiceAPI(`/mailbox/${mailbox}`, options);

    const inboxDomain = mailbox.split('@')[1];
    if (inboxDomain && data?.success) {
      const expiryMap = await getDomainExpiryMap(signedToken);
      const domainInfo = expiryMap.get(inboxDomain);

      if (domainInfo && (domainInfo.expiring_soon || domainInfo.expired)) {
        // Only attach when actionable — keeps the payload lean for healthy domains
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
  } catch {
    return NextResponse.json({ error: 'Service error' }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  DELETE handler (unchanged)
// ─────────────────────────────────────────────────────────────────────────────
export async function DELETE(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const { id: userId, plan = 'free' } = session.user as { id: string; plan?: string };

  try {
    await limiter.check(plan === 'pro' ? 100 : 20, `${userId}_DELETE`);
  } catch {
    return NextResponse.json({ error: 'Action limit exceeded' }, { status: 429 });
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
      method: 'DELETE',
      headers: { Authorization: `Bearer ${signedToken}` },
    });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}