/** @type {import('next-sitemap').IConfig} */

const LOCALES = ['/en', '/de', '/id', '/fr', '/pt', '/tr', '/zh', '/ru', '/es'];

// ─── 30 Landing Pages ────────────────────────────────────────────────────────
const LANDING_PAGES = [
  // Core Authority
  { slug: 'temp-mail',                      priority: 0.90 },
  { slug: 'free-temp-mail',                 priority: 0.90 },
  { slug: 'temporary-email',                priority: 0.90 },
  { slug: 'disposable-email',               priority: 0.90 },
  { slug: 'anonymous-email',                priority: 0.90 },
  // Feature-Based
  { slug: 'custom-temp-mail',               priority: 0.80 },
  { slug: 'temp-mail-no-ads',               priority: 0.80 },
  { slug: 'temp-mail-with-custom-domain',   priority: 0.80 },
  { slug: 'temp-mail-api',                  priority: 0.80 },
  { slug: 'temp-mail-for-developers',       priority: 0.80 },
  // Use-Case
  { slug: 'temp-mail-for-testing',          priority: 0.75 },
  { slug: 'temp-mail-for-signups',          priority: 0.75 },
  { slug: 'temp-mail-for-otp',              priority: 0.75 },
  { slug: 'temp-mail-for-verification',     priority: 0.75 },
  { slug: 'temp-mail-for-privacy',          priority: 0.75 },
  // Competitor / Comparison
  { slug: '10minmail-alternative',          priority: 0.75 },
  { slug: 'guerrillamail-alternative',      priority: 0.75 },
  { slug: 'temp-mail-alternative',          priority: 0.75 },
  { slug: 'best-temp-mail-services',        priority: 0.75 },
  // Platform
  { slug: 'temp-mail-for-facebook',         priority: 0.65 },
  { slug: 'temp-mail-for-twitter',          priority: 0.65 },
  { slug: 'temp-mail-for-discord',          priority: 0.65 },
  { slug: 'temp-mail-for-instagram',        priority: 0.65 },
  { slug: 'temp-mail-for-reddit',           priority: 0.65 },
  { slug: 'temp-mail-for-telegram',         priority: 0.65 },
  // Long-Tail High-Intent
  { slug: 'instant-temp-mail',              priority: 0.65 },
  { slug: 'fast-temp-mail',                 priority: 0.65 },
  { slug: 'secure-temp-mail',               priority: 0.65 },
  { slug: 'private-temp-mail',              priority: 0.65 },
  { slug: 'temporary-email-generator',      priority: 0.65 },
];

// ─── Blog Posts ───────────────────────────────────────────────────────────────
// Sourced from lib/blog-manifest.json — update here when adding new posts
const BLOG_POSTS = [
  { slug: 'new-evolution-of-temp-mail',                    date: '2025-08-12', priority: 0.75 },
  { slug: 'is-temp-mail-safe',                             date: '2025-07-30', priority: 0.75 },
  { slug: 'temp-mail-for-business',                        date: '2025-07-30', priority: 0.75 },
  { slug: 'temp-mail-for-facebook',                        date: '2025-07-30', priority: 0.70 },
  { slug: 'temp-mail-for-instagram',                       date: '2025-07-30', priority: 0.70 },
  { slug: 'end-of-third-party-cookies-and-email-identity', date: '2025-07-27', priority: 0.70 },
  { slug: 'the-ai-revolution-and-your-privacy',            date: '2025-07-27', priority: 0.70 },
  { slug: 'trend-and-digital-minimalism',                  date: '2025-07-27', priority: 0.65 },
  { slug: 'review-us-on-g2',                               date: '2025-07-19', priority: 0.50 },
  { slug: 'about-mail-security',                           date: '2025-07-18', priority: 0.70 },
  { slug: 'access-resources-without-work-email',           date: '2025-07-11', priority: 0.65 },
  { slug: 'introducing-ditmail',                           date: '2025-07-11', priority: 0.65 },
  { slug: 'introducing-more-new-domain-for-temp-mail',     date: '2025-07-11', priority: 0.60 },
  { slug: 'best-disposable-email-for-free-trials',         date: '2025-07-10', priority: 0.75 },
  { slug: 'get-otp-without-your-own-email',                date: '2025-07-10', priority: 0.75 },
  { slug: 'getting-around-work-email-req-ethically',       date: '2025-07-10', priority: 0.65 },
  { slug: 'use-cases-for-not-having-work-email',           date: '2025-07-10', priority: 0.65 },
  { slug: 'the-ai-paradox-and-your-privacy',               date: '2025-06-27', priority: 0.65 },
  { slug: 'the-creator-economy',                           date: '2025-06-26', priority: 0.60 },
  { slug: 'disposable-mail-as-marketer-tool',              date: '2025-06-13', priority: 0.65 },
  { slug: 'anonymous-file-transer',                        date: '2025-06-10', priority: 0.60 },
  { slug: 'build-your-own-temp-mail-website',              date: '2025-06-10', priority: 0.70 },
  { slug: 'forever-free-and-ad-free',                      date: '2025-06-10', priority: 0.70 },
  { slug: 'how-to-block-ads-with-temp-mail',               date: '2025-06-10', priority: 0.60 },
  { slug: 'private-domains-get-your-temp-mail',            date: '2025-06-10', priority: 0.70 },
  { slug: 'the-digital-detox',                             date: '2025-06-10', priority: 0.60 },
  { slug: 'the-git-economy',                               date: '2025-06-10', priority: 0.60 },
  { slug: 'the-metaverse-with-temp-mail',                  date: '2025-06-10', priority: 0.55 },
  { slug: 'the-tech-behind-temp-mail-in-depth',            date: '2025-06-10', priority: 0.70 },
  { slug: 'top-android-games-reg-with-temp-mail',          date: '2025-06-10', priority: 0.60 },
  { slug: 'privacy-policy',                                date: '2025-06-05', priority: 0.40 },
  { slug: 'terms-of-service',                              date: '2025-05-15', priority: 0.40 },
  { slug: 'how-temp-mail-works',                           date: '2025-05-01', priority: 0.80 },
  { slug: 'how-to-use-temp-mail',                          date: '2025-05-01', priority: 0.80 },
  { slug: 'online-privacy-tips',                           date: '2025-04-07', priority: 0.65 },
  { slug: 'future-of-email-privacy',                       date: '2023-10-01', priority: 0.60 },
  { slug: 'why-use-temp-mail',                             date: '2023-09-05', priority: 0.75 },
  { slug: 'how-to-access-old-temp-mail',                   date: '2023-08-28', priority: 0.65 },
  { slug: 'what-is-10-min-mail',                           date: '2023-08-25', priority: 0.70 },
  { slug: 'temp-mail-explained',                           date: '2023-08-20', priority: 0.75 },
  { slug: 'why-we-are-fastest',                            date: '2023-08-05', priority: 0.65 },
  { slug: 'the-ultimate-guide-to-temp-mail',               date: '2023-08-01', priority: 0.80 },
  { slug: 'how-long-does-temp-mail-lasts',                 date: '2023-07-25', priority: 0.70 },
  { slug: 'how-to-recover-temp-mail-account',              date: '2023-07-10', priority: 0.65 },
  { slug: 'how-to-create-temp-mail',                       date: '2023-07-05', priority: 0.75 },
  { slug: 'best-practices-for-using-temp-mail',            date: '2023-07-01', priority: 0.70 },
  { slug: 'temp-mail-vs-traditional-email',                date: '2023-06-15', priority: 0.70 },
  { slug: 'benefits-of-temporary-email',                   date: '2023-05-20', priority: 0.75 },
  { slug: 'introduction-to-temp-mail',                     date: '2023-05-15', priority: 0.70 },
];

module.exports = {
  siteUrl: 'https://www.freecustom.email',
  generateRobotsTxt: true,
  changefreq: 'weekly',
  priority: 0.7,
  sitemapSize: 7000,
  outDir: './public',

  // Prevent next-sitemap from auto-including locale roots since we
  // handle them manually in additionalPaths with correct priorities
  exclude: ['/en', '/de', '/id', '/fr', '/pt', '/tr', '/zh', '/ru', '/es'],

  additionalPaths: async (config) => {
    const now = new Date().toISOString();
    const entries = [];

    // ── 1. Locale homepages ────────────────────────────────────────────────
    for (const locale of LOCALES) {
      entries.push({
        loc: `/${locale}`,
        changefreq: 'daily',
        priority: locale === 'en' ? 1.0 : 0.85,
        lastmod: now,
      });
    }

    // ── 2. Landing pages ───────────────────────────────────────────────────
    for (const page of LANDING_PAGES) {
      // Canonical (no locale prefix) — highest priority for each page
      entries.push({
        loc: `/${page.slug}`,
        changefreq: 'weekly',
        priority: Math.min(page.priority + 0.05, 1.0),
        lastmod: now,
      });
      // Localised versions
      for (const locale of LOCALES) {
        entries.push({
          loc: `/${locale}/${page.slug}`,
          changefreq: 'weekly',
          priority: page.priority,
          lastmod: now,
        });
      }
    }

    // ── 3. Blog posts (English-only, no locale prefix) ─────────────────────
    for (const post of BLOG_POSTS) {
      entries.push({
        loc: `/blog/${post.slug}`,
        changefreq: 'monthly',
        priority: post.priority,
        lastmod: new Date(post.date).toISOString(),
      });
    }

    return entries;
  },
};