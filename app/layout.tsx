import { GoogleAnalytics } from '@next/third-parties/google';
import "@/styles/global.css";
import Providers from "@/components/Providers";
import NextTopLoader from 'nextjs-toploader';
import { PaddleInit } from '@/components/paddle-init';

const BASE_URL = 'https://www.freecustom.email';

export const metadata = {
  metadataBase: new URL(BASE_URL),

  title: 'Custom Temp Mail – Fastest Ad‑Free Disposable Email',
  description: 'Generate a custom temp mail address instantly—choose from multiple domains, no registration, no ads, forever free.',
  keywords: 'temp mail, disposable email, custom mail, fake email, temporary inbox, no ads email, 10minmail, email privacy, free temp mail',
  alternates: {
    canonical: '/en',
  },

  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      {
        url: '/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        url: '/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],

    apple: '/apple-touch-icon.png',
    shortcut: '/favicon.ico',
  },

  manifest: '/site.webmanifest',

  openGraph: {
    title: 'Custom Temp Mail – Fastest Ad‑Free Disposable Email',
    description: 'Generate a custom temp mail address instantly—choose from multiple domains, no registration, no ads, forever free.',
    url: 'https://www.freecustom.email/',
    images: [
      {
        url: 'https://www.freecustom.email/logo.webp',
        alt: 'FreeCustom.Email Logo',
      },
    ],
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <GoogleAnalytics gaId="G-RXTEEVC8C4" />
        <meta
          name="impact-site-verification"
          content="7df37ce6-8617-4606-8ba2-9a78bf367429"
        />
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