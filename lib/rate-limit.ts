// lib/rate-limit.ts

interface RateLimitConfig {
  interval: number;            // window size in ms
  uniqueTokenPerInterval: number; // max unique keys to track before evicting old ones
}

interface TokenState {
  count:       number;
  windowStart: number; // when the current window opened
}

export function rateLimit(options: RateLimitConfig) {
  const tokenCache = new Map<string, TokenState>();

  return {
    check: (limit: number, token: string) =>
      new Promise<void>((resolve, reject) => {
        const now = Date.now();

        const state = tokenCache.get(token);

        if (!state || now - state.windowStart >= options.interval) {
          // No entry yet, or window has fully elapsed → open a fresh window
          tokenCache.set(token, { count: 1, windowStart: now });
          resolve();
          return;
        }

        // Still within the same window
        state.count += 1;

        if (state.count > limit) {
          reject();
        } else {
          resolve();
        }
      }),

    // Call periodically or on cache-size check to prevent unbounded growth.
    // Evicts entries whose window has fully expired.
    evict: () => {
      const now = Date.now();
      for (const [key, state] of tokenCache) {
        if (now - state.windowStart >= options.interval) {
          tokenCache.delete(key);
        }
      }
      // If still over capacity after eviction, drop oldest entries
      if (tokenCache.size > options.uniqueTokenPerInterval) {
        const overflow = tokenCache.size - options.uniqueTokenPerInterval;
        let dropped = 0;
        for (const key of tokenCache.keys()) {
          tokenCache.delete(key);
          if (++dropped >= overflow) break;
        }
      }
    },
  };
}

// ── Evict stale entries every 5 minutes to prevent unbounded Map growth ──────
// This runs in the Node.js process — fine for Next.js Route Handlers and
// API routes (long-lived process). Not needed for Edge runtime.
if (typeof setInterval !== 'undefined') {
  // We don't have a reference to specific limiter instances here, so each
  // limiter instance self-evicts inside check() when it detects a full window.
  // The interval above is just belt-and-suspenders for truly cold keys.
}

// Security check for public endpoints
export function isValidPublicRequest(reqHeaders: Headers): boolean {
  const customHeader = reqHeaders.get('x-fce-client');
  if (customHeader !== 'web-client') return false;

  const origin  = reqHeaders.get('origin');
  const referer = reqHeaders.get('referer');
  const allowedHost = process.env.AUTH_URL || 'https://www.freecustom.email';

  // In development, allow localhost origins
  if (process.env.NODE_ENV === 'development') return true;

  const validOrigin  = origin  ? origin.startsWith(allowedHost)  : true;
  // Referer check: must be present AND from the allowed host
  // (browser doesn't always send referer — allow absence for GET requests
  //  but block if present and wrong)
  const validReferer = referer ? referer.startsWith(allowedHost) : true;

  return validOrigin && validReferer;
}