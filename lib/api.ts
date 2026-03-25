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
export async function callInternalAPI(
    pathOrReq: string | Request,
    pathOrOptions?: string | RequestInit,
    optionsOrUser?: RequestInit | { id?: string },
    userParam?: { id?: string }
) {
    let path: string;
    let options: RequestInit;
    let user: { id?: string } | undefined;

    if (typeof pathOrReq !== 'string') {
        // Style: callInternalAPI(req, path, options, user)
        path = pathOrOptions as string;
        options = (optionsOrUser as RequestInit) || {};
        user = userParam;
    } else {
        // Style: callInternalAPI(path, options, user)
        path = pathOrReq;
        options = (pathOrOptions as RequestInit) || {};
        user = optionsOrUser as { id?: string };
    }

    const url = `${API_URL}${path}`;
    const method = (options.method || 'GET').toUpperCase();
    
    // 1. Extract Identity Context from incoming request
    let cookieId = '';
    let ip = 'unknown-ip';
    let ua = '';
    let lang = '';
    let tz = '';
    let authHeader = '';

    try {
        const h = await nextHeaders();
        const c = await nextCookies();
        cookieId = c.get('fp_id')?.value || h.get('x-cookie-id') || '';
        ip = h.get('cf-connecting-ip') || h.get('x-forwarded-for') || 'unknown-ip';
        ua = h.get('user-agent') || '';
        lang = h.get('accept-language') || '';
        tz = h.get('x-timezone') || '';
        
        // Forward the Authorization JWT (for Gateway Plan Detection)
        authHeader = h.get('authorization') || '';
    } catch (e) {
        // May fail if called outside of request context (e.g., static generation)
        console.warn(`[InternalAPI] Calling ${path} without request context. Defaulting to system-level routing.`);
    }

    // Fallback: If no authorization header was passed but we have a NextAuth session, generate a JWT
    if (!authHeader) {
        try {
            const { auth } = await import('@/auth');
            const session = await auth();
            if (session?.user) {
                const plan = session.user.plan || 'free';
                const id = session.user.id;
                const token = await sign({ id, plan });
                authHeader = `Bearer ${token}`;
            }
        } catch (e) {
            // Ignore auth import/session errors in edge cases or static generation
        }
    }

    if (!cookieId) {
        cookieId = crypto.randomUUID();
    }

    // 2. Generate Fingerprint
    // hash(cookieId + ip_prefix + ua + tz + lang)
    // We mask the IP to a /24 subnet (e.g., 192.168.1.0)
    let ipPrefix = 'unknown-ip';
    if (ip !== 'unknown-ip') {
        if (ip.includes('.')) {
            // IPv4: 1.2.3.4 -> 1.2.3.0
            ipPrefix = ip.split('.').slice(0, 3).join('.') + '.0';
        } else if (ip.includes(':')) {
            // IPv6: mask to /48 or something similar. For simplicity, we'll just take the first 3 groups.
            ipPrefix = ip.split(':').slice(0, 3).join(':') + '::';
        }
    }

    const fpString = `${cookieId}|${ipPrefix}|${ua}|${tz}|${lang}`;
    const fp = crypto.createHash('sha256').update(fpString).digest('hex');

    // 3. Prepare for Signing
    const timestamp = Date.now().toString();
    const nonce = crypto.randomUUID();
    const bodyStr = options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : '';
    
    // Format: timestamp.METHOD.path.body
    const payload = `${timestamp}.${method}.${path}.${bodyStr}`;
    const signature = crypto.createHmac('sha256', API_SECRET!)
        .update(payload)
        .digest('hex');

    // 4. Prepare Headers
    const reqHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        // Authentication
        'x-internal-api-key': API_KEY!,
        'x-signature': signature,
        'x-timestamp': timestamp,
        'x-nonce': nonce,
        
        // Identity & Context (for backend-side fingerprinting)
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
        Object.entries(options.headers).forEach(([key, val]) => {
            reqHeaders[key.toLowerCase()] = String(val);
        });
    }

    try {
        const response = await fetch(url, {
            ...options,
            headers: reqHeaders,
            // Account for Progressive Friction (latency up to 1.5s usually, so 5-10s is safe)
            signal: AbortSignal.timeout(10000),
        });

        if (response.status === 429) {
            throw new Error('TOO_MANY_REQUESTS');
        }
        
        // Handle non-ok responses
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'An unknown API error occurred.' }));
            throw new Error(errorData.message || `Service API request failed with status ${response.status}`);
        }
        
        // Handle successful but empty responses
        if (response.status === 204 || response.headers.get('content-length') === '0') {
            return { success: true };
        }

        return await response.json();
    } catch (error) {
        console.error(`Internal API call error for ${path}:`, error);
        throw error instanceof Error ? error : new Error('A network or parsing error occurred.');
    }
}

/**
 * Legacy support for fetchFromServiceAPI, now routed through callInternalAPI.
 */
export async function fetchFromServiceAPI(path: string, options: RequestInit = {}, user?: { id?: string }) {
    return callInternalAPI(path, options, user);
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
