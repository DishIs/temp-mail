// components/ScalarPlaygroundFooter.tsx
"use client";

/**
 * Footer injected via Scalar's content.end plugin view.
 * Must use inline styles — runs inside Scalar's Vue context, no Tailwind access.
 * Mirrors the Firecrawl grid-table pattern from PlaygroundFooter.
 */

const FOOTER_COLS = [
  {
    heading: "Product",
    links: [
      { label: "Pricing",  href: "/pricing"  },
      { label: "FAQ",      href: "/faq"      },
      { label: "API",      href: "/api"      },
      { label: "Feedback", href: "/feedback" },
      { label: "Blog",     href: "/blog"     },
    ],
  },
  {
    heading: "Developers",
    links: [
      { label: "API Overview",  href: "/api"               },
      { label: "Documentation", href: "/api/docs"          },
      { label: "FCE AI",         href: "/ai"                },
      { label: "Pricing",       href: "/api/pricing"       },
      { label: "Status",        href: "https://status.freecustom.email", external: true },
      { label: "Changelog",     href: "/api/docs/changelog"},
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy Policy",   href: "/policies/privacy" },
      { label: "Cookie Policy",    href: "/policies/cookie"  },
      { label: "Terms of Service", href: "/policies/terms"   },
      { label: "Refund Policy",    href: "/policies/refund"  },
    ],
  },
  {
    heading: "Support",
    links: [
      { label: "Contact", href: "/contact"                                   },
      { label: "Discord", href: "https://discord.com/invite/Ztp7kT2QBz",     external: true },
      { label: "Reddit",  href: "https://www.reddit.com/r/FreeCustomEmail/", external: true },
      { label: "GitHub",  href: "https://github.com/DishIs/temp-mail",       external: true },
    ],
  },
];

// CSS vars that Scalar exposes — fall back to sensible defaults
const VAR = {
  border:  "var(--scalar-border-color, hsl(0 0% 88%))",
  fg:      "var(--scalar-color-1, hsl(0 0% 9%))",
  muted:   "var(--scalar-color-2, hsl(0 0% 45%))",
  bg:      "var(--scalar-background-1, hsl(0 0% 100%))",
};

export function ScalarPlaygroundFooter() {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <footer style={{
      borderTop: `1px solid ${VAR.border}`,
      backgroundColor: VAR.bg,
      marginTop: "2rem",
      fontFamily: "inherit",
    }}>

      {/* ── columns grid ─────────────────────────────────────────── */}
      <div style={{
        borderBottom: `1px solid ${VAR.border}`,
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
      }}>
        {FOOTER_COLS.map(({ heading, links }, colI) => (
          <div key={heading} style={{
            padding: "2.5rem 2rem",
            borderLeft: colI > 0 ? `1px solid ${VAR.border}` : "none",
          }}>
            {/* Heading row */}
            <div style={{
              borderBottom: `1px solid ${VAR.border}`,
              paddingBottom: "1rem",
              marginBottom: "0.5rem",
              fontSize: "11px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: VAR.fg,
            }}>
              {heading}
            </div>

            {/* Link rows */}
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {links.map(({ label, href, external }: any, i: number) => (
                <li key={label} style={{
                  borderTop: i > 0 ? `1px solid ${VAR.border}` : "none",
                }}>
                  <a
                    href={external ? href : `${baseUrl}${href}`}
                    target={external ? "_blank" : undefined}
                    rel={external ? "noopener noreferrer" : undefined}
                    style={{
                      display: "block",
                      padding: "0.65rem 0",
                      fontSize: "13px",
                      color: VAR.muted,
                      textDecoration: "none",
                      transition: "color 0.15s",
                    }}
                    onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.color = VAR.fg; }}
                    onMouseOut={(e)  => { (e.currentTarget as HTMLElement).style.color = VAR.muted; }}
                  >
                    {label}{external ? " ↗" : ""}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* ── bottom bar ───────────────────────────────────────────── */}
      <div style={{
        borderBottom: `1px solid ${VAR.border}`,
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
      }}>
        {/* Copyright */}
        <div style={{ padding: "1.25rem 2rem", display: "flex", alignItems: "center" }}>
          <span style={{ fontSize: "12px", color: VAR.muted }}>
            © {new Date().getFullYear()} DishIs Technologies
          </span>
        </div>

        {/* Bottom legal links */}
        {[
          { label: "Terms of Service", href: "/policies/terms"   },
          { label: "Privacy Policy",   href: "/policies/privacy" },
          { label: "Report Abuse",     href: "/contact"          },
        ].map(({ label, href }, i) => (
          <div key={label} style={{
            padding: "1.25rem 2rem",
            display: "flex",
            alignItems: "center",
            borderLeft: `1px solid ${VAR.border}`,
          }}>
            <a
              href={`${baseUrl}${href}`}
              style={{ fontSize: "12px", color: VAR.muted, textDecoration: "none" }}
              onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.color = VAR.fg; }}
              onMouseOut={(e)  => { (e.currentTarget as HTMLElement).style.color = VAR.muted; }}
            >
              {label}
            </a>
          </div>
        ))}
      </div>

    </footer>
  );
}