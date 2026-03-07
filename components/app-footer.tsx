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

// ── link data ─────────────────────────────────────────────────────────────
const FOOTER_COLS = [
  {
    heading: "Products",
    links: [
      { label: "Pricing",    href: "/pricing",    external: false },
      { label: "FAQ",        href: "/faq",         external: false },
      { label: "API",        href: "/api",         external: false },
      { label: "Updates",    href: null,           external: false, action: "changelog" },
      { label: "Feedback",   href: "/feedback",   external: false },
      { label: "Blog",       href: "/blog",        external: false },
    ],
  },
  {
    heading: "Developers",
    links: [
      { label: "API Overview",   href: "/api",                 external: false },
      { label: "Documentation",  href: "/api/docs",            external: false },
      { label: "API Pricing",    href: "/api/pricing",         external: false },
      { label: "Status",         href: "https://status.freecustom.email", external: true },
      { label: "Changelog",      href: "/api/docs/changelog",  external: false },
      { label: "Open Source",    href: "/open-source",         external: false },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy Policy",      href: "/policies/privacy",    external: false },
      { label: "Do Not Sell My Info", href: "/policies/do-not-sell", external: false },
      { label: "Cookie Policy",       href: "/policies/cookie",     external: false },
      { label: "Terms of Service",    href: "/policies/terms",      external: false },
      { label: "Refund Policy",       href: "/policies/refund",     external: false },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "Contact",  href: "/contact",                                          external: false },
      { label: "Discord",  href: "https://discord.com/invite/Ztp7kT2QBz",             external: true  },
      { label: "Reddit",   href: "https://www.reddit.com/r/FreeCustomEmail/",         external: true  },
      { label: "GitHub",   href: "https://github.com/DishIs",                         external: true  },
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

const SOCIAL_LINKS = [
  { icon: SiGithub,  href: "https://github.com/DishIs/temp-mail",             label: "GitHub"  },
  { icon: SiReddit,  href: "https://www.reddit.com/r/FreeCustomEmail/",        label: "Reddit"  },
  { icon: SiDiscord, href: "https://discord.com/invite/Ztp7kT2QBz",            label: "Discord" },
];

const BOTTOM_LINKS = [
  { label: "Terms of Service", href: "/policies/terms"    },
  { label: "Privacy Policy",   href: "/policies/privacy"  },
  { label: "Report Abuse",     href: "/contact"           },
];

export function AppFooter() {
  const [isWhatsNewOpen, setIsWhatsNewOpen] = useState(false);
  const [hasSeenLatest,  setHasSeenLatest]  = useState(true);
  const [theme, setThemeState]              = useState("light");

  useEffect(() => {
    const seen = localStorage.getItem("seenChangelogVersion");
    if (seen !== LATEST_CHANGELOG_VERSION) setHasSeenLatest(false);
  }, []);

  useEffect(() => {
    const update = () =>
      setThemeState(document.documentElement.classList.contains("dark") ? "dark" : "light");
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
      {/* ── main footer grid ─────────────────────────────────────────── */}
      <footer className="border-t border-border bg-background text-foreground">

        {/* Firecrawl-style grid: full-width columns separated by borders */}
        <div className="border-b border-border">
          <div className="max-w-[90rem] mx-auto grid grid-cols-2 sm:grid-cols-4 divide-x divide-border">
            {FOOTER_COLS.map(({ heading, links }) => (
              <div key={heading} className="px-8 py-10">
                {/* Column heading row */}
                <div className="border-b border-border pb-4 mb-2">
                  <p className="text-xs font-semibold uppercase tracking-widest text-foreground">
                    {heading}
                  </p>
                </div>

                {/* Link rows — each separated by a border */}
                <ul className="divide-y divide-border">
                  {links.map(({ label, href, external, action }: any) => {
                    const cls = "flex items-center justify-between py-3 text-sm text-muted-foreground hover:text-foreground transition-colors group";

                    if (action === "changelog") {
                      return (
                        <li key={label}>
                          <button onClick={openChangelog} className={`${cls} w-full text-left relative`}>
                            <span className="flex items-center gap-2">
                              <Gift className="h-3.5 w-3.5 opacity-50 group-hover:opacity-100 transition-opacity" />
                              {label}
                            </span>
                            {!hasSeenLatest && (
                              <span className="relative flex h-1.5 w-1.5 shrink-0">
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
                            <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-40 transition-opacity" />
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

        {/* ── brand + status row ──────────────────────────────────────── */}
        <div className="border-b border-border">
          <div className="max-w-[90rem] mx-auto grid grid-cols-2 sm:grid-cols-4 divide-x divide-border">

            {/* Brand */}
            <div className="px-8 py-8 col-span-2 sm:col-span-1 border-r border-border space-y-4">
              <p className="text-sm font-semibold tracking-tight text-foreground">FreeCustom.Email</p>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-[180px]">
                Disposable email with smart features. Private, fast, and free.
              </p>
              <div className="flex items-center gap-3">
                {SOCIAL_LINKS.map(({ icon: Icon, href, label }) => (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
                    className="text-muted-foreground/60 hover:text-foreground transition-colors">
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* ── Status ── */}
            <div className="px-8 py-8 col-span-2 sm:col-span-1 flex items-start gap-3">
              {/*
                Pinging dot:
                - `relative flex` wrapper gives the ping a positional context
                - `mt-[3px]` nudges it down to optically align with the
                  cap-height of the 14px "All systems normal" text next to it
              */}
              <span className="relative mt-[3px] flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
              </span>

              <div>
                <p className="text-sm text-foreground font-medium leading-none mb-1.5">
                  All systems normal
                </p>
                <a
                  href="https://status.freecustom.email"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4 decoration-border"
                >
                  status.freecustom.email
                </a>
              </div>
            </div>

            {/* Payment methods */}
            <div className="px-8 py-8 col-span-2 sm:col-span-2 border-l border-border space-y-3">
              <p className="text-xs text-muted-foreground">Secure checkout · 200+ countries</p>
              <div className="flex flex-wrap gap-1.5">
                {PAYMENT_METHODS.map(({ icon: Icon, label }) => (
                  <span key={label} title={label}
                    className="flex items-center justify-center rounded border border-border bg-muted/20 px-2 py-1.5 text-muted-foreground/70 hover:text-muted-foreground transition-colors">
                    <Icon className="h-4 w-auto" />
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── bottom bar ──────────────────────────────────────────────── */}
        <div className="max-w-[90rem] mx-auto grid grid-cols-2 sm:grid-cols-4 divide-x divide-border border-b border-border">
          {/* Copyright */}
          <div className="px-8 py-5 col-span-2 sm:col-span-1 flex items-center">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} DishIs Technologies
            </p>
          </div>

          {/* Bottom nav links */}
          {BOTTOM_LINKS.map(({ label, href }) => (
            <div key={label} className="px-8 py-5 flex items-center">
              <Link href={href} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                {label}
              </Link>
            </div>
          ))}
        </div>

        {/* ── buy me a coffee ─────────────────────────────────────────── */}
        <div className="max-w-[90rem] mx-auto px-8 py-5">
          <a href="https://www.buymeacoffee.com/dishantsinghdev" target="_blank" rel="noopener noreferrer">
            <img
              src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png"
              alt="Buy Me A Coffee"
              className="h-7 w-auto"
            />
          </a>
        </div>

      </footer>

      <WhatsNewModal isOpen={isWhatsNewOpen} onClose={() => setIsWhatsNewOpen(false)} />
    </>
  );
}