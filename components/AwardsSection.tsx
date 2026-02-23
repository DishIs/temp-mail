export function AwardsSection() {
  const awards = [
    {
      href: "https://www.goodfirms.co/email-management-software/",
      title: "Top Email Marketing Software",
      src: "https://assets.goodfirms.co/static/goodfirms.svg",
      alt: "Top Email Marketing Software — GoodFirms",
    },
    {
      href: "https://www.scamadviser.com/check-website/freecustom.email",
      title: "100 Trust Score on ScamAdviser",
      src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT0mijE9pPNHQ8e4QAlvEpWQTuDeR-hfL95Uw&s",
      alt: "Trusted — ScamAdviser",
    },
    {
      href: "https://www.producthunt.com/products/fce?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-fce",
      title: "Featured on Product Hunt",
      src: "https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1079765&theme=light&t=1771253835806",
      alt: "Featured — Product Hunt",
    },
    {
      href: "https://startupfound.com/s/freecustomemail",
      title: "Listed on StartupFound",
      src: "https://startupfound.com/badges/badge-light.svg",
      alt: "Listed — StartupFound",
    },
    {
      href: "https://yo.directory/",
      title: "Listed on Yo Directory",
      src: "https://cdn.prod.website-files.com/65c1546fa73ea974db789e3d/65e1e171f89ebfa7bd0129ac_yodirectory-featured.png",
      alt: "Featured — Yo Directory",
    },
    {
      href: "https://startupfa.me/s/freecustomemail?utm_source=www.freecustom.email",
      title: "Listed on Startup Fame",
      src: "https://startupfa.me/badges/featured-badge.webp",
      alt: "FreeCustom.Email - Featured on Startup Fame",
    },
    {
      href: "https://twelve.tools",
      title: "Listed on Twelve Tools",
      src: "https://twelve.tools/badge0-light.svg",
      alt: "Featured on Twelve Tools",
    },
    {
      href: "https://wired.business",
      title: "Listed on Wired Business",
      src: "https://wired.business/badge0-light.svg",
      alt: "Featured on Wired Business",
    },
    {
      href: "https://turbo0.com/item/freecustomemail",
      title: "Listed on Turbo0",
      src: "https://img.turbo0.com/badge-listed-light.svg",
      alt: "Listed on Turbo0",
    },
  ];
  return (
    <section className="border-t border-border bg-muted/20 py-10">
      <div className="container mx-auto px-4">

        {/* Heading */}
        <div className="mb-7 text-center space-y-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Trust &amp; Recognition
          </p>
          <h2 className="text-lg font-semibold text-foreground">
            Recognised by the community
          </h2>
        </div>

        {/* Badge strip */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {awards.map(({ href, title, src, alt }) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              title={title}
              className="group flex items-center justify-center rounded-lg border border-border/60 bg-background px-3 py-2 shadow-sm transition-all duration-150 hover:border-primary/40 hover:shadow-md"
            >
              <img
                src={src}
                alt={alt}
                loading="lazy"
                width={130}
                height={44}
                className="h-9 w-auto object-contain opacity-80 transition-opacity duration-150 group-hover:opacity-100"
              />
            </a>
          ))}
        </div>

      </div>
    </section>
  );
}