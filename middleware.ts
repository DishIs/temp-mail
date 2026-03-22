import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { LANDING_PAGE_SLUGS } from '@/lib/landing-pages-config';

const i18nMiddleware = createMiddleware(routing);

export default async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // 0. Ensure persistent fp_id cookie exists for backend fingerprinting
  let cookieId = request.cookies.get('fp_id')?.value;
  let response = NextResponse.next();

  if (!cookieId) {
    cookieId = crypto.randomUUID();
  }

  // 1. REDIRECT LOCALE-PREFIXED LANDING PAGES TO ROOT
  // If user visits /en/temp-mail or /fr/temp-mail -> Redirect to /temp-mail
  const segments = path.split('/').filter(Boolean); // e.g. ['en', 'temp-mail']
  
  if (segments.length === 2) {
    const [possibleLocale, possibleSlug] = segments;
    
    // @ts-ignore - Check if segment 1 is a valid locale and segment 2 is a landing page
    if (routing.locales.includes(possibleLocale) && LANDING_PAGE_SLUGS.includes(possibleSlug)) {
      // 301 Permanent Redirect for SEO juice
      response = NextResponse.redirect(new URL(`/${possibleSlug}`, request.url), 301);
    }
  }

  // 2. REWRITE LANDING PAGES
  // Check if the current URL matches one of our keyword slugs (e.g., /temp-mail)
  const isLandingPage = LANDING_PAGE_SLUGS.includes(path.substring(1));
  
  if (isLandingPage) {
    // Secretly route to app/landing/[slug] without changing the user's URL bar
    response = NextResponse.rewrite(new URL(`/landing${path}`, request.url));
  }

  // 3. BYPASS NEXT-INTL FOR SPECIFIC ROUTES
  if (
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
    path.startsWith('/landing') // Allow our rewritten landing pages to bypass i18n
  ) {
    // response is already NextResponse.next() or rewrite/redirect
  } else {
    // 4. LET NEXT-INTL HANDLE EVERYTHING ELSE (like /en, /fr)
    response = i18nMiddleware(request);
  }

  // Set the fp_id cookie on the final response if it's new or just to ensure it stays long-lived
  response.cookies.set('fp_id', cookieId, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });

  return response;
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};