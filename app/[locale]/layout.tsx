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

// static locale pages
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// global metadata per locale
export async function generateMetadata(props: Omit<Props, 'children'>) {
  const { locale } = await props.params;

  const t = await getTranslations({ locale, namespace: 'Metadata' });

  // hreflang map
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
      canonical: `/${locale}`,
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
          alt: t('openGraph.alt'),
        },
      ],
      locale,
      type: 'website',
    },

    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // enable static rendering per locale
  setRequestLocale(locale);

  return (
    <NextIntlClientProvider>
      {children}
    </NextIntlClientProvider>
  );
}
