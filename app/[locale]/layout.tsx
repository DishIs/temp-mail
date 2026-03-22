// app/[locale]/layout.tsx
import { notFound } from 'next/navigation';
import { Locale, hasLocale, NextIntlClientProvider } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ReactNode } from 'react';
import { routing } from '@/i18n/routing';
import '@/styles/global.css';

type Props = {
  children: ReactNode;
  params: Promise<{ locale: Locale }>;
};

const BASE_URL = 'https://www.freecustom.email';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(props: Omit<Props, 'children'>) {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: 'Metadata' });

  const languages: Record<string, string> = {};
  routing.locales.forEach((loc) => {
    languages[loc] = `${BASE_URL}/${loc}`;
  });
  languages['x-default'] = `${BASE_URL}/en`;

  return {
    title: t('title'),
    description: t('description'),
    keywords: t('keywords'),

    metadataBase: new URL(BASE_URL),

    alternates: {
      // FIXED: absolute URL instead of relative `/${locale}`
      canonical: `${BASE_URL}/${locale}`,
      languages,
    },

    openGraph: {
      title: t('openGraph.title'),
      description: t('openGraph.description'),
      url: `${BASE_URL}/${locale}`,
      siteName: 'FreeCustom.Email',
      images: [
        {
          url: `${BASE_URL}/logo.webp`,
          width: 512,   // ADDED: required for proper OG rendering
          height: 512,  // ADDED
          alt: t('openGraph.alt'),
        },
      ],
      locale,
      type: 'website',
    },

    // ADDED: Twitter/X card — required for social sharing previews
    twitter: {
      card: 'summary_large_image',
      title: t('openGraph.title'),
      description: t('openGraph.description'),
      images: [`${BASE_URL}/logo.webp`],
    },

    robots: {
      index: true,
      follow: true,
      // ADDED: explicit googleBot directive — controls AI snippet extraction
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return (
    <NextIntlClientProvider locale={locale}>
      {children}
    </NextIntlClientProvider>
  );
}