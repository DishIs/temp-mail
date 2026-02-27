// components/app-footer.tsx
"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Gift, ExternalLink } from "lucide-react";
import {
  SiVisa, SiMastercard, SiAmericanexpress,
  SiPaypal, SiApplepay, SiGooglepay,
  SiGithub, SiReddit, SiDiscord,
} from "react-icons/si";
import { LATEST_CHANGELOG_VERSION } from "@/lib/changelog";
import { WhatsNewModal } from "./WhatsNewModal";

const FOOTER_LINKS = [
  {
    heading: "Product",
    links: [
      { label: "Pricing",          href: "/pricing",            external: false },
      { label: "API",              href: "https://rapidapi.com/dishis-technologies-maildrop/api/temp-mail-maildrop1", external: true },
      { label: "Updates",          href: null,                  external: false, action: "changelog" },
      { label: "Feedback",         href: "/feedback",           external: false },
      { label: "Blog",             href: "/blog",               external: false },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy Policy",   href: "/policies/privacy",  external: false },
      { label: "Cookie Policy",    href: "/policies/cookie",   external: false }, // ← added
      { label: "Terms of Service", href: "/policies/terms",    external: false },
      { label: "Refund Policy",    href: "/policies/refund",   external: false },
    ],
  },
  {
    heading: "Support",
    links: [
      { label: "Contact",          href: "/contact",            external: false },
      { label: "Discord",          href: "https://discord.com/invite/Ztp7kT2QBz",                    external: true },
      { label: "Reddit",           href: "https://www.reddit.com/r/FreeCustomEmail/",                external: true },
      { label: "GitHub",           href: "https://github.com/DishIs/temp-mail",                      external: true },
    ],
  },
];

const PAYMENT_METHODS = [
  { icon: SiVisa,            label: "Visa"       },
  { icon: SiMastercard,      label: "Mastercard" },
  { icon: SiAmericanexpress, label: "Amex"       },
  { icon: SiPaypal,          label: "PayPal"     },
  { icon: SiApplepay,        label: "Apple Pay"  },
  { icon: SiGooglepay,       label: "Google Pay" },
];

export function AppFooter() {
  const [isWhatsNewOpen, setIsWhatsNewOpen] = useState(false);
  const [hasSeenLatest, setHasSeenLatest]   = useState(true);
  const [theme, setTheme]                   = useState("light");

  useEffect(() => {
    const seenVersion = localStorage.getItem("seenChangelogVersion");
    if (seenVersion !== LATEST_CHANGELOG_VERSION) setHasSeenLatest(false);
  }, []);

  useEffect(() => {
    const update = () =>
      setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
    update();
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  const openChangelog = () => {
    setIsWhatsNewOpen(true);
    localStorage.setItem("seenChangelogVersion", LATEST_CHANGELOG_VERSION);
    setHasSeenLatest(true);
  };

  return (
    <>
      <footer className="border-t border-border bg-muted/30">

        {/* ── Trust / payment bar ── */}
        <div className="border-b border-border/60 py-4">
          <div className="container mx-auto flex flex-col items-center gap-3 px-4 sm:flex-row sm:justify-between">
            <p className="text-[11px] font-medium text-muted-foreground">
              Secure checkout · 200+ countries · All major cards &amp; wallets
            </p>
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {PAYMENT_METHODS.map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  title={label}
                  className="flex items-center justify-center rounded border border-border/70 bg-background px-2 py-1 text-muted-foreground/70 transition-colors hover:text-muted-foreground"
                >
                  <Icon className="h-4 w-auto" />
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Main footer grid ── */}
        <div className="container mx-auto px-4 py-10">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">

            {/* Brand column */}
            <div className="col-span-2 sm:col-span-1 space-y-4">
              <p className="text-sm font-bold tracking-tight">FreeCustom.Email</p>
              <p className="text-xs leading-relaxed text-muted-foreground max-w-[180px]">
                Disposable email with smart features. Private, fast, and free.
              </p>

              {/* Social icons */}
              <div className="flex items-center gap-3">
                {[
                  { icon: SiGithub,  href: "https://github.com/DishIs/temp-mail",              label: "GitHub"  },
                  { icon: SiReddit,  href: "https://www.reddit.com/r/FreeCustomEmail/",         label: "Reddit"  },
                  { icon: SiDiscord, href: "https://discord.com/invite/Ztp7kT2QBz",             label: "Discord" },
                ].map(({ icon: Icon, href, label }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="text-muted-foreground/60 transition-colors hover:text-foreground"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>

              {/* Status badge */}
              <iframe
                src={`https://status.freecustom.email/badge?theme=${theme}`}
                width="190"
                height="30"
                frameBorder="0"
                scrolling="no"
                style={{ colorScheme: "normal" }}
                title="Service status"
              />
            </div>

            {/* Link columns */}
            {FOOTER_LINKS.map(({ heading, links }) => (
              <div key={heading} className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  {heading}
                </p>
                <ul className="space-y-2">
                  {links.map(({ label, href, external, action }) => {
                    const cls =
                      "text-sm text-muted-foreground transition-colors hover:text-foreground flex items-center gap-1";

                    if (action === "changelog") {
                      return (
                        <li key={label}>
                          <button onClick={openChangelog} className={`${cls} relative`}>
                            <Gift className="h-3 w-3" />
                            {label}
                            {!hasSeenLatest && (
                              <span className="absolute -top-0.5 -right-2 flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-blue-500" />
                              </span>
                            )}
                          </button>
                        </li>
                      );
                    }

                    return (
                      <li key={label}>
                        {external ? (
                          <a href={href!} target="_blank" rel="noopener noreferrer" className={cls}>
                            {label}
                            <ExternalLink className="h-2.5 w-2.5 opacity-50" />
                          </a>
                        ) : (
                          <Link href={href!} className={cls}>
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

        {/* ── Bottom bar ── */}
        <div className="border-t border-border/60 py-4">
          <div className="container mx-auto flex flex-col items-center justify-between gap-3 px-4 sm:flex-row">
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

      <WhatsNewModal isOpen={isWhatsNewOpen} onClose={() => setIsWhatsNewOpen(false)} />
    </>
  );
}