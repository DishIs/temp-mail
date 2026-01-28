import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const i18nMiddleware = createMiddleware(routing);

export default async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (path === '/blog' || path.startsWith('/blog/') || path === '/docs' || path === '/pricing' || path === '/auth') {
    return NextResponse.next(); // skip next-intl redirect for blog
  }

  return i18nMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
