import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { LANDING_PAGE_SLUGS } from '@/lib/landing-pages-config';

const i18nMiddleware = createMiddleware(routing);

export default async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // 0. REDIRECT LOCALE-PREFIXED LANDING PAGES TO ROOT
  // If user visits /en/temp-mail or /fr/temp-mail -> Redirect to /temp-mail
  const segments = path.split('/').filter(Boolean); // e.g. ['en', 'temp-mail']
  
  if (segments.length === 2) {
    const [possibleLocale, possibleSlug] = segments;
    
    // @ts-ignore - Check if segment 1 is a valid locale and segment 2 is a landing page
    if (routing.locales.includes(possibleLocale) && LANDING_PAGE_SLUGS.includes(possibleSlug)) {
      // 301 Permanent Redirect for SEO juice
      return NextResponse.redirect(new URL(`/${possibleSlug}`, request.url), 301);
    }
  }

  // 1. REWRITE LANDING PAGES
  // Check if the current URL matches one of our keyword slugs (e.g., /temp-mail)
  const isLandingPage = LANDING_PAGE_SLUGS.includes(path.substring(1));
  
  if (isLandingPage) {
    // Secretly route to app/landing/[slug] without changing the user's URL bar
    return NextResponse.rewrite(new URL(`/landing${path}`, request.url));
  }

  // 2. BYPASS NEXT-INTL FOR SPECIFIC ROUTES
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
    return NextResponse.next();
  }

  // 3. LET NEXT-INTL HANDLE EVERYTHING ELSE (like /en, /fr)
  return i18nMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};