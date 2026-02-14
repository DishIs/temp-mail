import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: [
    'en',
    'de',
    'zh',
    'fr',
    'pt', // Portuguese (high traffic)
    'id'  // Indonesian
  ],
  defaultLocale: 'en',
  pathnames: {
    '/': '/',
    '/blog': '/blog',              // no locale prefix
    '/blog/[slug]': '/blog/[slug]',
    '/docs': '/docs'
  }
});
