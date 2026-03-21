// components/AwardsSection.tsx
// UI REDESIGN — Aligned with dashboard + pricing design language:
//  - DOT_BG dot pattern background
//  - Column guides (same calc as pricing/dashboard)
//  - SectionMarker-style mono label
//  - gap-px bg-border grid for award cards
//  - Seamlessly connects to AppFooter (no redundant border-b)
//  - All existing award data and links preserved exactly

const DOT_BG = {
  backgroundImage:
    'radial-gradient(circle at 1px 1px, hsl(0 0% 50% / 0.11) 1px, transparent 0)',
  backgroundSize: '28px 28px',
} as const;

export function AwardsSection() {
  const awards = [
    {
      href: 'https://www.goodfirms.co/email-management-software/',
      title: 'Top Email Marketing Software',
      src: 'https://assets.goodfirms.co/static/goodfirms.svg',
      alt: 'Top Email Marketing Software — GoodFirms',
    },
    {
      href: 'https://www.scamadviser.com/check-website/freecustom.email',
      title: '100 Trust Score on ScamAdviser',
      src: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT0mijE9pPNHQ8e4QAlvEpWQTuDeR-hfL95Uw&s',
      alt: 'Trusted — ScamAdviser',
    },
    {
      href: 'https://www.producthunt.com/products/fce?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-fce',
      title: 'Featured on Product Hunt',
      src: 'https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1079765&theme=light&t=1771253835806',
      alt: 'Featured — Product Hunt',
    },
    {
      href: 'https://startupfound.com/s/freecustomemail',
      title: 'Listed on StartupFound',
      src: 'https://startupfound.com/badges/badge-light.svg',
      alt: 'Listed — StartupFound',
    },
    {
      href: 'https://yo.directory/',
      title: 'Listed on Yo Directory',
      src: 'https://cdn.prod.website-files.com/65c1546fa73ea974db789e3d/65e1e171f89ebfa7bd0129ac_yodirectory-featured.png',
      alt: 'Featured — Yo Directory',
    },
    {
      href: 'https://startupfa.me/s/freecustomemail?utm_source=www.freecustom.email',
      title: 'Listed on Startup Fame',
      src: 'https://startupfa.me/badges/featured-badge.webp',
      alt: 'FreeCustom.Email - Featured on Startup Fame',
    },
    {
      href: 'https://twelve.tools',
      title: 'Listed on Twelve Tools',
      src: 'https://twelve.tools/badge0-light.svg',
      alt: 'Featured on Twelve Tools',
    },
    {
      href: 'https://wired.business',
      title: 'Listed on Wired Business',
      src: 'https://wired.business/badge0-light.svg',
      alt: 'Featured on Wired Business',
    },
    {
      href: 'https://turbo0.com/item/freecustomemail',
      title: 'Listed on Turbo0',
      src: 'https://img.turbo0.com/badge-listed-light.svg',
      alt: 'Listed on Turbo0',
    },
    {
      href: 'https://viesearch.com/',
      title: 'Listed on Viesearch - The Human-curated Search Engine',
      src: 'https://viesearch.com/blue.png',
      alt: 'Listed on Viesearch - The Human-curated Search Engine',
    },
    {
      href: 'https://fazier.com',
      title: 'Featured on Fazier',
      src: 'https://fazier.com/api/v1//public/badges/launch_badges.svg?badge_type=featured&theme=light',
      alt: 'Fazier badge',
    },
    {
      href: 'https://auraplusplus.com/projects/freecustom-email-disposable-temp-mail',
      title: 'Featured on Aura++',
      src: 'https://auraplusplus.com/images/badges/featured-on-light.svg',
      alt: 'Aura++ badge',
    },
    {
      href: 'https://indiehunt.io/project/temp-mail-free-temporary-email-address-no-signup-no-ads',
      title: 'Featured on IndieHunt',
      src: 'https://indiehunt.io/badges/indiehunt-badge-light.svg',
      alt: 'IndieHunt badge',
    },
    {
      href: 'https://earlyhunt.com/project/freecustom-email-disposable-email',
      title: 'Featured on EarlyHunt',
      src: 'https://earlyhunt.com/badges/earlyhunt-badge-light.svg',
      alt: 'EarlyHunt badge',
    },
  ];

  return (
    // border-t only (no border-b) — footer provides the bottom boundary
    <section
      className="relative border-t border-border px-4 sm:px-6 py-16 sm:py-20"
      style={DOT_BG}
    >
      {/* Column guides — matching pricing/dashboard exactly */}
      <div
        className="absolute inset-y-0 left-[max(0px,calc(50%-40rem))] w-px bg-border/60"
        aria-hidden
      />
      <div
        className="absolute inset-y-0 right-[max(0px,calc(50%-40rem))] w-px bg-border/60"
        aria-hidden
      />

      <div className="relative z-10 max-w-5xl mx-auto">

        {/* Section marker — same [ XX / XX ] · LABEL pattern as rest of site */}
        <div className="flex items-center gap-2 mb-10">
          <div className="w-0.5 h-4 bg-border" aria-hidden />
          {/* Note: no index numbers here since this sits outside the main
              section count — keeping it as a standalone trust strip */}
          <span className="font-mono text-xs text-foreground font-semibold">
            Trust &amp; Recognition
          </span>
          <span className="text-muted-foreground/50 text-xs">·</span>
          <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Recognised by the community
          </span>
        </div>

        {/* Awards grid — gap-px bg-border pattern from dashboard manager grid */}
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="grid gap-px bg-border grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {awards.map(({ href, title, src, alt }) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                title={title}
                className="group bg-background flex items-center justify-center px-4 py-5 transition-colors hover:bg-muted/20 min-h-[72px]"
              >
                <img
                  src={src}
                  alt={alt}
                  loading="lazy"
                  width={130}
                  height={44}
                  className="h-7 w-auto max-w-[120px] object-contain opacity-50 transition-opacity group-hover:opacity-90"
                />
              </a>
            ))}
          </div>
        </div>

        {/* code.market verified widget */}
        <div
          data-codemarket-widget="temp-mail-free-temporary-email-no-signup-freecustomemail"
          data-theme-bg="#ffffff"
          data-theme-text="slate-600"
          data-layout="grid"
          data-show-branding="false"
          className="mt-6"
        >
          <a
            href="https://code.market?code.market=verified"
            target="_blank"
            rel="noopener noreferrer"
            title="ai tools code.market"
          >
            <img
              src="https://code.market/assets/manage-product/featured-logo-bright.svg"
              alt="ai tools code.market"
              loading="lazy"
            />
          </a>
        </div>

        {/* Footnote — same text-[11px] font-mono muted style as table footnote in pricing */}
        <p className="mt-4 text-[11px] text-muted-foreground font-mono">
          Independently verified trust scores and directory listings.
        </p>

      </div>
    </section>
  );
}