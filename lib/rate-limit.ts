// lib/rate-limit.ts

interface RateLimitConfig {
  interval: number; // in milliseconds
  uniqueTokenPerInterval: number; // Max number of unique keys (IPs/UserIDs) to track
}

export function rateLimit(options: RateLimitConfig) {
  const tokenCache = new Map();

  return {
    check: (limit: number, token: string) =>
      new Promise<void>((resolve, reject) => {
        const now = Date.now();
        const tokenCount = tokenCache.get(token) || [0];
        
        // Reset if interval passed
        if (tokenCount[1] && now - tokenCount[1] > options.interval) {
             tokenCount[0] = 0;
             tokenCount[1] = now;
        }

        if (tokenCount[0] === 0) {
          tokenCache.set(token, tokenCount);
        }
        
        tokenCount[0] += 1;
        tokenCount[1] = now;

        const currentUsage = tokenCount[0];
        const isRateLimited = currentUsage >= limit;

        if (isRateLimited) {
          reject();
        } else {
          resolve();
        }
      }),
  };
}

// Security Check for Public Endpoints
export function isValidPublicRequest(reqHeaders: Headers): boolean {
  const referer = reqHeaders.get('referer');
  const origin = reqHeaders.get('origin');
  const customHeader = reqHeaders.get('x-fce-client');
  
  // 1. Check Custom Header
  if (customHeader !== 'web-client') return false;

  // 2. Check Origin/Referer
  const allowedHost = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'https://shiny-carnival-5659pvv7pwg27wgj-3000.app.github.dev';
  
  const validOrigin = origin ? origin.includes(allowedHost) : true; 
  const validReferer = referer ? referer.includes(allowedHost) : false;

  return validOrigin && validReferer;
}