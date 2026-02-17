import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: [
    'en',
    'de',
    'ru',
    'zh',
    'es',
    'fr',
    'pt', // Portuguese (high traffic)
    'tr', // Turkish
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
