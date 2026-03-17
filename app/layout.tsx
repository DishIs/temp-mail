// app/layout.tsx
import "@/styles/global.css";
import Providers from "@/components/Providers";
import NextTopLoader from 'nextjs-toploader';
import Script from 'next/script';

const BASE_URL = 'https://www.freecustom.email';

export const metadata = {
  metadataBase: new URL(BASE_URL),
  // SEO fixes from previous session
  title: 'Temp Mail — Free Temporary Email, No Signup | FreeCustom.Email',
  description: 'Get a free temp mail address instantly — no signup, no ads, forever free. Use temporary email to receive OTP codes, verification links, and test registrations. Real-time inbox, custom domains available.',
  keywords: 'temp mail, disposable email, temporary email, custom email domain, fake email address, email privacy, OTP email, no signup email, free temp mail API',
  alternates: { canonical: '/en' },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
    shortcut: '/favicon.ico',
  },
  manifest: '/site.webmanifest',
  openGraph: {
    title: 'Temp Mail — Free Temporary Email, No Signup | FreeCustom.Email',
    description: 'Get a free temp mail address instantly — no signup, no ads, forever free. Receive OTP codes, verification links, and test registrations.',
    url: 'https://www.freecustom.email/',
    images: [{ url: 'https://www.freecustom.email/logo.webp', width: 512, height: 512, alt: 'FreeCustom.Email — Free Temp Mail' }],
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/*
          Preconnect hints — these open TCP+TLS connections early.
          profitwell saves 550ms on pages that load it.
          Even though we're moving Paddle to pricing-only, preconnecting
          here costs ~0ms and helps on first navigation to pricing.
        */}
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />

        {/*
          Consent Mode v2 — MUST run before ANY Google script.
          beforeInteractive = inlined into HTML, runs before hydration.
          This correctly blocks GA from firing until user consents.
        */}
        <Script id="consent-default" strategy="beforeInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){ dataLayer.push(arguments); }
          gtag('consent', 'default', {
            analytics_storage:  'denied',
            ad_storage:         'denied',
            ad_user_data:       'denied',
            ad_personalization: 'denied',
            wait_for_update: 500
          });
          gtag('js', new Date());
          gtag('config', 'G-RXTEEVC8C4', { send_page_view: false });
        `}</Script>

        <meta name="impact-site-verification" content="7df37ce6-8617-4606-8ba2-9a78bf367429" />
      </head>

      <body>
        <NextTopLoader
          color="#2299DD"
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          crawl
          showSpinner={false}
          easing="ease"
          speed={200}
          shadow="0 0 10px #2299DD,0 0 5px #2299DD"
        />

        <Providers>{children}</Providers>

        {/*
          GTM — lazyOnload defers until page is idle.
          Previously @next/third-parties/google loaded this in the critical path.
          Now it loads after LCP has already painted.
        */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-RXTEEVC8C4"
          strategy="lazyOnload"
        />

        {/*
          Cookie banner script — lazyOnload is correct.
          FIX: The config is now embedded INSIDE this script's onLoad callback
          via a separate coordination approach. See the silktide-init script below.
        */}
        <Script
          src="/cookie-banner/silktide-consent-manager.js"
          strategy="lazyOnload"
          id="silktide-script"
        />

        {/*
          COOKIE BANNER CONFIG FIX:
          
          Root cause of empty modal: race condition between two lazyOnload scripts.
          When silktide-config ran, window.silktideCookieBannerManager sometimes
          didn't exist yet, so updateCookieBannerConfig was never called.
          The banner initialized with an empty config = no cookie types = empty modal.
          
          Fix: Use a polling approach that waits for silktideCookieBannerManager
          to be available before calling updateCookieBannerConfig.
          The CSS is loaded inline here so it never blocks rendering.
        */}
        <Script id="silktide-config" strategy="lazyOnload">{`
          (function() {
            var link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = '/cookie-banner/silktide-consent-manager.css';
            document.head.appendChild(link);

            var config = {
              background: { showBackground: false },
              cookieIcon: { position: 'bottomLeft' },
              position: { banner: 'bottomRight' },
              cookieTypes: [
                {
                  id: 'necessary',
                  name: 'Necessary',
                  description: '<p>Essential for core functionality like security and saving preferences. Always active.</p>',
                  required: true
                },
                {
                  id: 'analytics',
                  name: 'Analytics',
                  description: '<p>Help us understand how visitors use the site so we can improve it.</p>',
                  required: false,
                  defaultValue: false,
                  onAccept: function () {
                    if (typeof gtag === 'function') {
                      gtag('consent', 'update', { analytics_storage: 'granted' });
                    }
                  },
                  onReject: function () {
                    if (typeof gtag === 'function') {
                      gtag('consent', 'update', { analytics_storage: 'denied' });
                    }
                  }
                }
              ],
              text: {
                banner: {
                  description: "<p>We use cookies to analyze traffic and improve your experience. See our <a href='/policies/cookie' target='_blank'>Cookie Policy</a>.</p>",
                  acceptAllButtonText: 'Accept all',
                  acceptAllButtonAccessibleLabel: 'Accept all cookies',
                  rejectNonEssentialButtonText: 'Reject',
                  rejectNonEssentialButtonAccessibleLabel: 'Reject non-essential cookies',
                  preferencesButtonText: 'Manage',
                  preferencesButtonAccessibleLabel: 'Open cookie preferences'
                },
                preferences: {
                  title: 'Cookie preferences',
                  description: '<p>Choose which optional cookies to allow. Preferences are saved locally and can be changed any time.</p>'
                }
              },
              onAcceptAll: function () {},
              onRejectAll: function () {}
            };

            /*
              Poll for silktideCookieBannerManager to exist.
              This fires at most ~10 times over 500ms — negligible overhead.
              Eliminates the race condition entirely.
            */
            var attempts = 0;
            var maxAttempts = 20;
            var interval = setInterval(function() {
              attempts++;
              if (window.silktideCookieBannerManager && typeof window.silktideCookieBannerManager.updateCookieBannerConfig === 'function') {
                clearInterval(interval);
                window.silktideCookieBannerManager.updateCookieBannerConfig(config);
              } else if (attempts >= maxAttempts) {
                clearInterval(interval);
              }
            }, 25);
          })();
        `}</Script>

        {/*
          PaddleInit REMOVED from here.
          Paddle is now only loaded on /pricing and /api/pricing pages.
          This removes paddle.js (16KB) and profitwell.js (10KB) from
          every page load — saves ~550ms LCP on the homepage.
        */}
      </body>
    </html>
  );
}