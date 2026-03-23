import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { LANDING_PAGE_SLUGS } from '@/lib/landing-pages-config';

const i18nMiddleware = createMiddleware(routing);

export default async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

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
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};