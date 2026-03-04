"use client";

/**
 * Footer component for Scalar API Playground, injected via Scalar's content.end plugin view.
 * Uses plain <a> tags so navigation works when rendered inside Scalar's Vue context.
 */
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

export function ScalarPlaygroundFooter() {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <footer
      style={{
        marginTop: "2rem",
        paddingTop: "1.5rem",
        borderTop: "1px solid var(--scalar-border-color, #e5e7eb)",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
        gap: "1.5rem 2rem",
        fontSize: "13px",
        color: "var(--scalar-color-2, #6b7280)",
      }}
    >
      {FOOTER_LINKS.map(({ heading, links }) => (
        <div key={heading}>
          <div
            style={{
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: "0.5rem",
              color: "var(--scalar-color-1, #374151)",
            }}
          >
            {heading}
          </div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {links.map(({ label, href, external }) => (
              <li key={label} style={{ marginBottom: "0.25rem" }}>
                <a
                  href={external ? href : `${baseUrl}${href}`}
                  target={external ? "_blank" : undefined}
                  rel={external ? "noopener noreferrer" : undefined}
                  style={{
                    color: "inherit",
                    textDecoration: "none",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.textDecoration = "underline";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.textDecoration = "none";
                  }}
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <div style={{ gridColumn: "1 / -1", marginTop: "0.5rem", fontSize: "12px" }}>
        © {new Date().getFullYear()} DishIs Technologies. All rights reserved.
      </div>
    </footer>
  );
}
