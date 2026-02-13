export interface LandingPageConfig {
  slug: string;
  translationKey: string;
  priority: 'high' | 'medium' | 'low';
}

export const LANDING_PAGES: LandingPageConfig[] = [
  // 1. Core Authority Pages
  { slug: 'temp-mail', translationKey: 'tempMail', priority: 'high' },
  { slug: 'free-temp-mail', translationKey: 'freeTempMail', priority: 'high' },
  { slug: 'temporary-email', translationKey: 'temporaryEmail', priority: 'high' },
  { slug: 'disposable-email', translationKey: 'disposableEmail', priority: 'high' },
  { slug: 'anonymous-email', translationKey: 'anonymousEmail', priority: 'high' },

  // 2. Feature-Based Pages
  { slug: 'custom-temp-mail', translationKey: 'customTempMail', priority: 'high' },
  { slug: 'temp-mail-no-ads', translationKey: 'tempMailNoAds', priority: 'medium' },
  { slug: 'temp-mail-with-custom-domain', translationKey: 'tempMailCustomDomain', priority: 'medium' },
  { slug: 'temp-mail-api', translationKey: 'tempMailApi', priority: 'medium' },
  { slug: 'temp-mail-for-developers', translationKey: 'tempMailDevelopers', priority: 'medium' },

  // 3. Use-Case Pages
  { slug: 'temp-mail-for-testing', translationKey: 'tempMailTesting', priority: 'medium' },
  { slug: 'temp-mail-for-signups', translationKey: 'tempMailSignups', priority: 'medium' },
  { slug: 'temp-mail-for-otp', translationKey: 'tempMailOtp', priority: 'medium' },
  { slug: 'temp-mail-for-verification', translationKey: 'tempMailVerification', priority: 'medium' },
  { slug: 'temp-mail-for-privacy', translationKey: 'tempMailPrivacy', priority: 'medium' },

  // 4. Competitor / Comparison Pages
  { slug: '10minmail-alternative', translationKey: 'tenMinMailAlternative', priority: 'medium' },
  { slug: 'guerrillamail-alternative', translationKey: 'guerrillaMailAlternative', priority: 'medium' },
  { slug: 'temp-mail-alternative', translationKey: 'tempMailAlternative', priority: 'medium' },
  { slug: 'best-temp-mail-services', translationKey: 'bestTempMailServices', priority: 'medium' },

  // 5. Platform-Based Pages
  { slug: 'temp-mail-for-facebook', translationKey: 'tempMailFacebook', priority: 'low' },
  { slug: 'temp-mail-for-twitter', translationKey: 'tempMailTwitter', priority: 'low' },
  { slug: 'temp-mail-for-discord', translationKey: 'tempMailDiscord', priority: 'low' },
  { slug: 'temp-mail-for-instagram', translationKey: 'tempMailInstagram', priority: 'low' },
  { slug: 'temp-mail-for-reddit', translationKey: 'tempMailReddit', priority: 'low' },
  { slug: 'temp-mail-for-telegram', translationKey: 'tempMailTelegram', priority: 'low' },

  // 6. Long-Tail High-Intent Pages
  { slug: 'instant-temp-mail', translationKey: 'instantTempMail', priority: 'low' },
  { slug: 'fast-temp-mail', translationKey: 'fastTempMail', priority: 'low' },
  { slug: 'secure-temp-mail', translationKey: 'secureTempMail', priority: 'low' },
  { slug: 'private-temp-mail', translationKey: 'privateTempMail', priority: 'low' },
  { slug: 'temporary-email-generator', translationKey: 'temporaryEmailGenerator', priority: 'low' },
];

export const LANDING_PAGE_SLUGS = LANDING_PAGES.map(p => p.slug);

export function getPageConfig(slug: string): LandingPageConfig | undefined {
  return LANDING_PAGES.find(p => p.slug === slug);
}