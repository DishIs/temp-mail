"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";

const FOOTER_LINKS = [
  {
    heading: "Product",
    links: [
      { label: "Pricing", href: "/pricing" },
      { label: "FAQ", href: "/faq" },
      { label: "API", href: "/api" },
      { label: "Feedback", href: "/feedback" },
      { label: "Blog", href: "/blog" },
    ],
  },
  {
    heading: "Developers",
    links: [
      { label: "API Overview", href: "/api" },
      { label: "Documentation", href: "/api/docs" },
      { label: "Pricing", href: "/api/pricing" },
      { label: "Status", href: "https://status.freecustom.email", external: true },
      { label: "Changelog", href: "/api/docs/changelog" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy Policy", href: "/policies/privacy" },
      { label: "Cookie Policy", href: "/policies/cookie" },
      { label: "Terms of Service", href: "/policies/terms" },
      { label: "Refund Policy", href: "/policies/refund" },
    ],
  },
  {
    heading: "Support",
    links: [
      { label: "Contact", href: "/contact" },
      { label: "Discord", href: "https://discord.com/invite/Ztp7kT2QBz", external: true },
      { label: "Reddit", href: "https://www.reddit.com/r/FreeCustomEmail/", external: true },
      { label: "GitHub", href: "https://github.com/DishIs/temp-mail", external: true },
    ],
  },
];

export function PlaygroundFooter() {
  return (
    <footer className="border-t border-border bg-muted/20 w-full shrink-0">
      <div className="container mx-auto max-w-4xl px-4 py-10">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-5">
          {FOOTER_LINKS.map(({ heading, links }) => (
            <div key={heading} className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {heading}
              </p>
              <ul className="space-y-2">
                {links.map(({ label, href, external }) => {
                  const cls =
                    "text-sm text-muted-foreground transition-colors hover:text-foreground flex items-center gap-1";
                  return (
                    <li key={label}>
                      {external ? (
                        <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
                          {label}
                          <ExternalLink className="h-2.5 w-2.5 opacity-50" />
                        </a>
                      ) : (
                        <Link href={href} className={cls}>
                          {label}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-border py-4">
        <div className="container mx-auto max-w-4xl flex flex-col items-center justify-between gap-3 px-4 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} DishIs Technologies. All rights reserved.
          </p>
          <a
            href="https://www.buymeacoffee.com/dishantsinghdev"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png"
              alt="Buy Me A Coffee"
              className="h-7 w-auto"
            />
          </a>
        </div>
      </div>
    </footer>
  );
}
