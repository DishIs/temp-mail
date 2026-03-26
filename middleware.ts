import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { LANDING_PAGE_SLUGS } from '@/lib/landing-pages-config';
import { getToken } from 'next-auth/jwt';

const i18nMiddleware = createMiddleware(routing);

export default async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // -- BAN CHECK IN MIDDLEWARE --
  // If user is banned, prevent access to protected routes
  const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });
  const isBanned = token?.banStatus && token.banStatus !== 'none' && token.banStatus !== 'warned';

  if (isBanned) {
    if (path.startsWith('/api/user/')) {
      return NextResponse.json(
        { success: false, message: 'Account is banned.' },
        { status: 403 }
      );
    }
    // Protect dashboard and settings pages from server-side bypass
    if (path.includes('/dashboard') || path === '/' || path.startsWith('/api/automation') || path.startsWith('/api/playground')) {
      return NextResponse.redirect(new URL('/account-banned', request.url));
    }
  }

  let cookieId = request.cookies.get('fp_id')?.value ?? crypto.randomUUID();
  let response: NextResponse;

  // 1. REDIRECT LOCALE-PREFIXED LANDING PAGES TO ROOT
  const segments = path.split('/').filter(Boolean);
  if (segments.length === 2) {
    const [possibleLocale, possibleSlug] = segments;
    // @ts-ignore
    if (routing.locales.includes(possibleLocale) && LANDING_PAGE_SLUGS.includes(possibleSlug)) {
      response = NextResponse.redirect(new URL(`/${possibleSlug}`, request.url), 301);
      response.cookies.set('fp_id', cookieId, {
        httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 365,
      });
      return response;
    }
  }

  // 2. REWRITE LANDING PAGES (bypass i18n entirely)
  const isLandingPage = LANDING_PAGE_SLUGS.includes(path.substring(1));
  if (isLandingPage) {
    response = NextResponse.rewrite(new URL(`/landing${path}`, request.url));
    response.cookies.set('fp_id', cookieId, {
      httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 365,
    });
    return response; // ← early return prevents i18n from overwriting this
  }

  // 3. BYPASS NEXT-INTL FOR SPECIFIC ROUTES
  const shouldBypassI18n =
    path.startsWith('/api') ||
    path === '/blog' ||
    path.startsWith('/blog/') ||
    path === '/docs' ||
    path === '/auth' ||
    path.startsWith('/auth/') ||
    path === '/contact' ||
    path === '/feedback' ||
    path.startsWith('/payment/') ||
    path.startsWith('/policies/') ||
    path === '/account-deletion-scheduled' ||
    path === '/account-deleted' ||
    path === '/account-banned' ||
    path === '/account-warned' ||
    path === '/open-source' ||
    path.startsWith('/landing');

  // 4. LET NEXT-INTL HANDLE EVERYTHING ELSE
  response = shouldBypassI18n ? NextResponse.next() : i18nMiddleware(request);

  response.cookies.set('fp_id', cookieId, {
    httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 365,
  });

  return response;
}

export const config = {
  matcher: ['/((?!_next|_vercel|.*\\..*).*)']
};