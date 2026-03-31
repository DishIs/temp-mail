// components/app-footer.tsx
"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import Script from "next/script";
import { Gift, ExternalLink, Clock } from "lucide-react";
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
      { label: "Pricing",   href: "/pricing",   external: false },
      { label: "FAQ",       href: "/faq",        external: false },
      { label: "API",       href: "/api",        external: false },
      { label: "Updates",   href: null,          external: false, action: "changelog" },
      { label: "Feedback",  href: "/feedback",   external: false },
      { label: "Blog",      href: "/blog",       external: false },
    ],
  },
  {
    heading: "Developers",
    links: [
      { label: "API Overview",   href: "/api",                  external: false },
      { label: "FCE AI",         href: "/ai",                   external: false },
      { label: "Documentation",  href: "/api/docs",             external: false },
      { label: "CLI Tool",       href: "/api/cli",              external: false },
      { label: "API Pricing",    href: "/api/pricing",          external: false },
      { label: "Playground",     href: "/api/playground",       external: false },
      { label: "Status",         href: "https://status.freecustom.email", external: true },
      { label: "Changelog",      href: "/api/docs/changelog",  external: false },
      { label: "Open Source",    href: "/open-source",         external: false },
    ],
  },
  {
    heading: "Automation",
    links: [
      { label: "Automation Hub", href: "/api/automation",         external: false },
      { label: "OpenClaw",       href: "/api/automation/openclaw", external: false },
      { label: "n8n",            href: "/api/automation/n8n",     external: false },
      { label: "Make",           href: "/api/automation/make",    external: false, soon: true },
      { label: "Zapier",         href: "/api/automation/zapier",  external: false, soon: true },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy Policy",      href: "/policies/privacy",      external: false },
      { label: "Do Not Sell My Info", href: "/policies/do-not-sell",  external: false },
      { label: "Cookie Policy",       href: "/policies/cookie",       external: false },
      { label: "Terms of Service",    href: "/policies/terms",        external: false },
      { label: "Refund Policy",       href: "/policies/refund",       external: false },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "Contact", href: "/contact",                                    external: false },
      { label: "Discord", href: "https://discord.com/invite/Ztp7kT2QBz",      external: true },
      { label: "Reddit",  href: "https://www.reddit.com/r/FreeCustomEmail/",   external: true },
      { label: "GitHub",  href: "https://github.com/DishIs",                   external: true },
    ],
  },
];

const PAYMENT_METHODS = [
  { icon: SiVisa,           label: "Visa"       },
  { icon: SiMastercard,     label: "Mastercard" },
  { icon: SiAmericanexpress,label: "Amex"       },
  { icon: SiPaypal,         label: "PayPal"     },
  { icon: SiApplepay,       label: "Apple Pay"  },
  { icon: SiGooglepay,      label: "Google Pay" },
];

const SOCIAL_LINKS = [
  { icon: SiGithub,  href: "https://github.com/DishIs/temp-mail",              label: "GitHub"  },
  { icon: SiReddit,  href: "https://www.reddit.com/r/FreeCustomEmail/",        label: "Reddit"  },
  { icon: SiDiscord, href: "https://discord.com/invite/Ztp7kT2QBz",            label: "Discord" },
];

const BOTTOM_LINKS = [
  { label: "Terms of Service", href: "/policies/terms"   },
  { label: "Privacy Policy",   href: "/policies/privacy" },
  { label: "Report Abuse",     href: "/contact"          },
];

export function AppFooter() {
  const [isWhatsNewOpen, setIsWhatsNewOpen] = useState(false);
  const [hasSeenLatest, setHasSeenLatest]   = useState(true);

  useEffect(() => {
    const seen = localStorage.getItem("seenChangelogVersion");
    if (seen !== LATEST_CHANGELOG_VERSION) setHasSeenLatest(false);
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

        {/* 5-column link grid */}
        <div className="border-b border-border">
          <div className="max-w-[90rem] mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-x divide-border">
            {FOOTER_COLS.map(({ heading, links }) => (
              <div key={heading} className="px-8 py-10">
                {/* Column heading */}
                <div className="border-b border-border pb-4 mb-2">
                  <p className="text-xs font-semibold uppercase tracking-widest text-foreground">
                    {heading}
                  </p>
                </div>

                {/* Link rows */}
                <ul className="divide-y divide-border">
                  {(links as any[]).map(({ label, href, external, action, soon }) => {
                    const cls =
                      "flex items-center justify-between py-3 text-sm text-muted-foreground hover:text-foreground transition-colors group";

                    // changelog button
                    if (action === "changelog") {
                      return (
                        <li key={label}>
                          <button onClick={openChangelog} className={`${cls} w-full text-left`}>
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

                    // external link
                    if (external) {
                      return (
                        <li key={label}>
                          <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
                            {label}
                            <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-40 transition-opacity" />
                          </a>
                        </li>
                      );
                    }

                    // "coming soon" badge
                    if (soon) {
                      return (
                        <li key={label}>
                          <Link href={href} className={cls}>
                            <span>{label}</span>
                            <span className="flex items-center gap-0.5 font-mono text-[9px] uppercase tracking-wider text-amber-600/70 border border-amber-500/20 rounded px-1 py-px opacity-0 group-hover:opacity-100 transition-opacity">
                              <Clock className="h-2 w-2" />
                              soon
                            </span>
                          </Link>
                        </li>
                      );
                    }

                    // regular internal link
                    return (
                      <li key={label}>
                        <Link href={href} className={cls}>
                          {label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* ── brand + status + payments row ───────────────────────────── */}
        <div className="border-b border-border">
          <div className="max-w-[90rem] mx-auto grid grid-cols-2 sm:grid-cols-4 divide-x divide-border">

            {/* Brand */}
            <div className="px-8 py-8 col-span-2 sm:col-span-1 space-y-4">
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

            {/* Status */}
            <div className="px-8 py-8 col-span-2 sm:col-span-1 flex items-start gap-3">
              <span className="relative mt-[3px] flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
              </span>
              <div>
                <p className="text-sm text-foreground font-medium leading-none mb-1.5">
                  All systems normal
                </p>
                <a href="https://status.freecustom.email" target="_blank" rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4 decoration-border">
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
          <div className="px-8 py-5 col-span-2 sm:col-span-1 flex items-center">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} DishIs Technologies
            </p>
          </div>
          {BOTTOM_LINKS.map(({ label, href }) => (
            <div key={label} className="px-8 py-5 flex items-center">
              <Link href={href} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                {label}
              </Link>
            </div>
          ))}
        </div>

        {/* ── buy me a coffee ─────────────────────────────────────────── */}
        <div className="max-w-[90rem] mx-auto px-8 py-5 flex items-center gap-4">
          <div className="postman-run-button"
            data-postman-action="collection/fork"
            data-postman-visibility="public"
            data-postman-var-1="53581811-ebb488ee-fc2a-4234-b518-21d857d472b7"
            data-postman-collection-url="entityId=53581811-ebb488ee-fc2a-4234-b518-21d857d472b7&entityType=collection&workspaceId=47981c31-02fb-4453-8b8c-734d70d4bc9a" />
          <Script id="postman-run-button-script-footer" strategy="lazyOnload">
            {`
              (function (p,o,s,t,m,a,n) {
                !p[s] && (p[s] = function () { (p[t] || (p[t] = [])).push(arguments); });
                !o.getElementById(s+t) && o.getElementsByTagName("head")[0].appendChild((
                  (n = o.createElement("script")),
                  (n.id = s+t), (n.async = 1), (n.src = m), n
                ));
              }(window, document, "_pm", "PostmanRunObject", "https://run.pstmn.io/button.js"));
            `}
          </Script>
        </div>

      </footer>

      <WhatsNewModal isOpen={isWhatsNewOpen} onClose={() => setIsWhatsNewOpen(false)} />
    </>
  );
}