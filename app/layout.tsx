import { GoogleAnalytics } from '@next/third-parties/google';
import "@/styles/global.css";
import Providers from "@/components/Providers";
import { getServerSession } from "next-auth"; 
import NextTopLoader from 'nextjs-toploader';

export const metadata = {
  title: 'Custom Temp Mail – Fastest Ad‑Free Disposable Email',
  description: 'Generate a custom temp mail address instantly—choose from multiple domains, no registration, no ads, forever free.',
  keywords: 'temp mail, disposable email, custom mail, fake email, temporary inbox, no ads email, 10minmail, email privacy, free temp mail',
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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(); 

  return (
    <html lang="en">
      <head>
        <GoogleAnalytics gaId="G-RXTEEVC8C4" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        <NextTopLoader 
          color="#2299DD"
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          crawl={true}
          showSpinner={false}
          easing="ease"
          speed={200}
          shadow="0 0 10px #2299DD,0 0 5px #2299DD"
        />
        <Providers session={session}>
          {children}
        </Providers>
      </body>
    </html>
  );
}