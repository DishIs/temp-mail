import { verify, sign } from '@/lib/jwt';
import crypto from 'crypto';
import { headers as nextHeaders, cookies as nextCookies } from 'next/headers';

// These environment variables point to your *SERVICE API*, not the Next.js app itself.
const SERVICE_API_URL = process.env.SERVICE_API_URL;
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;
const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET;

if (!SERVICE_API_URL || !INTERNAL_API_KEY || !INTERNAL_API_SECRET) {
    if (process.env.NODE_ENV === 'development') {
        console.warn("⚠️ SERVICE_API_URL, INTERNAL_API_KEY, or INTERNAL_API_SECRET missing in .env. Falling back to dummy values for development.");
    } else {
        throw new Error("SERVICE_API_URL, INTERNAL_API_KEY, and INTERNAL_API_SECRET must be defined in .env.local");
    }
}

const API_URL = SERVICE_API_URL || "http://localhost:3000";
const API_KEY = INTERNAL_API_KEY || "dummy_key";
const API_SECRET = INTERNAL_API_SECRET || "dummy_secret";

/**
 * Signs and executes a request to the Maildrop Internal API.
 * This should ONLY be called from server-side code (API routes, Server Actions, Middleware).
 */
// ADD THIS TYPE
type InternalCallOptions = {
  user?: { id?: string };
  systemCall?: boolean; // 👈 NEW (important)
};

export async function callInternalAPI(
  path: string,
  options: RequestInit = {},
  config: InternalCallOptions = {}
) {
  const { user, systemCall = false } = config;

  const url = `${API_URL}${path}`;
  const method = (options.method || 'GET').toUpperCase();

  // ─────────────────────────────────────────────
  // 1. Identity Context (SAFE for webhook)
  // ─────────────────────────────────────────────
  let cookieId = '';
  let ip = '127.0.0.1';
  let ua = 'system';
  let lang = 'en';
  let tz = 'UTC';
  let authHeader = '';

  if (!systemCall) {
    try {
      const h = await nextHeaders();
      const c = await nextCookies();

      cookieId = c.get('fp_id')?.value || h.get('x-cookie-id') || '';
      ip = h.get('cf-connecting-ip') || h.get('x-forwarded-for') || '127.0.0.1';
      ua = h.get('user-agent') || '';
      lang = h.get('accept-language') || '';
      tz = h.get('x-timezone') || '';
      authHeader = h.get('authorization') || '';
    } catch {}
  }

  // 🚨 CRITICAL: disable auth fallback for system calls
  if (!authHeader && !systemCall && !path.startsWith('/auth/') && !path.startsWith('/user/status')) {
    try {
      const { auth } = await import('@/auth');
      const session = await auth();
      if (session?.user) {
        const plan = (session.user as any).plan || 'free';
        const id = session.user.id;
        const token = await sign({ id, plan });
        authHeader = `Bearer ${token}`;
      }
    } catch {}
  }

  if (!cookieId) cookieId = crypto.randomUUID();

  // ─────────────────────────────────────────────
  // 2. Fingerprint (safe defaults for webhook)
  // ─────────────────────────────────────────────
  const fpString = `${cookieId}|${ip}|${ua}|${tz}|${lang}`;
  const fp = crypto.createHash('sha256').update(fpString).digest('hex');

  // ─────────────────────────────────────────────
  // 3. Signature (UNCHANGED – keep working logic)
  // ─────────────────────────────────────────────
  const timestamp = Date.now().toString();
  const nonce = crypto.randomUUID();

  const bodyStr = options.body
    ? typeof options.body === 'string'
      ? options.body
      : JSON.stringify(options.body)
    : '';

  const payload = `${timestamp}.${method}.${path}.${bodyStr}`;

  const signature = crypto
    .createHmac('sha256', API_SECRET!)
    .update(payload)
    .digest('hex');

  // ─────────────────────────────────────────────
  // 4. Headers
  // ─────────────────────────────────────────────
  const reqHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-internal-api-key': API_KEY!,
    'x-signature': signature,
    'x-timestamp': timestamp,
    'x-nonce': nonce,

    'x-fp': fp,
    'x-cookie-id': cookieId,
    'x-user-id': user?.id || '',
    'x-forwarded-for': ip,
    'user-agent': ua,
    'accept-language': lang,
    'x-timezone': tz,
  };

  if (authHeader) {
    reqHeaders['authorization'] = authHeader;
  }

  if (options.headers) {
    Object.entries(options.headers).forEach(([k, v]) => {
      reqHeaders[k.toLowerCase()] = String(v);
    });
  }

  // ─────────────────────────────────────────────
  // 5. Request
  // ─────────────────────────────────────────────
  try {
    const response = await fetch(url, {
      ...options,
      headers: reqHeaders,
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("❌ Backend error:", text);
      throw new Error(text);
    }

    if (response.status === 204) return { success: true };

    return await response.json();
  } catch (err) {
    console.error(`Internal API error (${path}):`, err);
    throw err;
  }
}

// update wrapper
export async function fetchFromServiceAPI(
  path: string,
  options: RequestInit = {},
  config?: InternalCallOptions
) {
  return callInternalAPI(path, options, config);
}

/**
 * Verifies the JWT from the user's browser.
 * This is used to protect the Next.js API routes themselves.
 */
export async function authenticateRequest(request: Request): Promise<any | null> {
    let token = request.headers.get('Authorization')?.split('Bearer ')[1];

    if (!token) {
        return null;
    }

    try {
        return await verify(token);
    } catch (error) {
        console.error('Failed to verify token:', error);
        return null;
    }
}
