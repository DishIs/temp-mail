import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: [
    'en',
    'de',
    'zh',
    'es',
    'hi',
    'fr',
    'ru',
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
