import { GoogleAnalytics } from '@next/third-parties/google';
import "@/styles/global.css";
import Providers from "@/components/Providers";
import NextTopLoader from 'nextjs-toploader';
import { PaddleInit } from '@/components/paddle-init';
import Script from 'next/script';

const BASE_URL = 'https://www.freecustom.email';

export const metadata = {
  metadataBase: new URL(BASE_URL),
  title: 'Custom Temp Mail – Fastest Ad‑Free Disposable Email',
  description: 'Generate a custom temp mail address instantly—choose from multiple domains, no registration, no ads, forever free.',
  keywords: 'temp mail, disposable email, custom mail, fake email, temporary inbox, no ads email, 10minmail, email privacy, free temp mail',
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
    title: 'Custom Temp Mail – Fastest Ad‑Free Disposable Email',
    description: 'Generate a custom temp mail address instantly—choose from multiple domains, no registration, no ads, forever free.',
    url: 'https://www.freecustom.email/',
    images: [{ url: 'https://www.freecustom.email/logo.webp', alt: 'FreeCustom.Email Logo' }],
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* ── Consent Mode v2: deny by default BEFORE gtag loads ── */}
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
        `}</Script>

        {/* ── Google Analytics (respects consent state above) ── */}
        <GoogleAnalytics gaId="G-RXTEEVC8C4" />

        {/* ── Cookie banner styles ── */}
        <link rel="stylesheet" href="/cookie-banner/silktide-consent-manager.css" />

        {/* ── Cookie banner script ── */}
        <Script src="/cookie-banner/silktide-consent-manager.js" strategy="afterInteractive" />

        {/* ── Cookie banner config ── */}
        <Script id="silktide-config" strategy="afterInteractive">{`
window.addEventListener('load', function () {
  if (!window.silktideCookieBannerManager) return;

  silktideCookieBannerManager.updateCookieBannerConfig({

    // No backdrop — banner sits at the bottom without blocking the page
    background: { showBackground: false },

    // Cookie icon position (bottom-left is hardcoded in JS too)
    cookieIcon: { position: 'bottomLeft' },

    // Banner position — bottom-right corner, unobtrusive
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
          gtag('consent', 'update', { analytics_storage: 'granted' });
        },
        onReject: function () {
          gtag('consent', 'update', { analytics_storage: 'denied' });
        }
      }
    ],

    text: {
      banner: {
        description: "<p>We use cookies to analyze traffic and improve your experience. See our <a href='/policies/cookie' target='_blank'>Cookie Policy</a>.</p>",
        acceptAllButtonText:                   'Accept all',
        acceptAllButtonAccessibleLabel:        'Accept all cookies',
        rejectNonEssentialButtonText:          'Reject',
        rejectNonEssentialButtonAccessibleLabel: 'Reject non-essential cookies',
        preferencesButtonText:                 'Manage',
        preferencesButtonAccessibleLabel:      'Open cookie preferences'
      },
      preferences: {
        title:       'Cookie preferences',
        description: '<p>Choose which optional cookies to allow. Preferences are saved locally and can be changed any time.</p>'
      }
    },

    onAcceptAll: function () {},
    onRejectAll: function () {}
  });
});
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
        <PaddleInit />
      </body>
    </html>
  );
}