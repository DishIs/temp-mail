// app/[locale]/dashboard/page.tsx
import { CustomDomainManager } from "@/components/dashboard/CustomDomainManager";
import { MuteListManager } from "@/components/dashboard/MuteListManager";
import { fetchFromServiceAPI } from "@/lib/api";
import { ThemeProvider } from "@/components/theme-provider";
import { AppHeader } from "@/components/app-header";
import { Globe, Zap, ShieldCheck, ExternalLink } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import Link from "next/link";

// ── Affiliate link ─────────────────────────────────────────────────────────
const DOMAIN_AFFILIATE_URL = "https://namecheap.pxf.io/c/7002059/408750/5618";

// ── ASCII fragments (matching api/profile pages) ──────────────────────────
const ASCII_FRAGS = [
  { x: "2%",  y: "5%",  t: "EHLO api2.freecustom.email" },
  { x: "67%", y: "3%",  t: "250 2.1.0 Ok" },
  { x: "78%", y: "11%", t: "From: noreply@service.com" },
  { x: "1%",  y: "21%", t: "RCPT TO:<inbox@ditapi.info>" },
  { x: "71%", y: "27%", t: "Message-ID: <abc123@fce.email>" },
  { x: "4%",  y: "37%", t: "Content-Type: text/plain; charset=utf-8" },
  { x: "1%",  y: "51%", t: "X-OTP: 847291" },
  { x: "69%", y: "57%", t: "SMTP 220 mail.freecustom.email" },
  { x: "3%",  y: "67%", t: "Date: Thu, 4 Mar 2026 09:55:00 +0000" },
  { x: "72%", y: "73%", t: "250-STARTTLS" },
  { x: "2%",  y: "83%", t: "AUTH PLAIN" },
  { x: "67%", y: "87%", t: "MAIL FROM:<service@example.com>" },
  { x: "4%",  y: "93%", t: "Subject: Your verification code is 847291" },
];

const DOT_BG = {
  backgroundImage:
    "radial-gradient(circle at 1px 1px, hsl(0 0% 50% / 0.11) 1px, transparent 0)",
  backgroundSize: "28px 28px",
} as const;

// ── Column guides (matching api page) ────────────────────────────────────
function Cols() {
  return (
    <>
      <div className="absolute inset-y-0 left-[max(0px,calc(50%-40rem))] w-px bg-border/60" aria-hidden />
      <div className="absolute inset-y-0 right-[max(0px,calc(50%-40rem))] w-px bg-border/60" aria-hidden />
    </>
  );
}

interface DashboardData {
  customDomains: any[];
  mutedSenders: string[];
}

export default async function DashboardPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const session = await auth();
  const t = await getTranslations("Dashboard");
  const isPro = session?.user?.plan === "pro";

  let data: DashboardData = { customDomains: [], mutedSenders: [] };

  if (isPro && session?.user?.id) {
    try {
      data = await fetchFromServiceAPI(`/user/${session.user.id}/dashboard-data`);
    } catch (e) {
      console.error("Failed to fetch dashboard data", e);
      data = { customDomains: [], mutedSenders: [] };
    }
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen max-w-[100vw] bg-background text-foreground overflow-x-hidden" style={DOT_BG}>

        {/* ASCII background layer */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none select-none z-0" aria-hidden>
          {ASCII_FRAGS.map((f, i) => (
            <span
              key={i}
              className="absolute font-mono text-[10px] text-foreground whitespace-nowrap"
              style={{ left: f.x, top: f.y, opacity: 0.035 }}
            >
              {f.t}
            </span>
          ))}
        </div>

        <AppHeader/>

        <main className="relative z-10 max-w-5xl mx-auto px-6 py-16">

          {/* ── Page header ─────────────────────────── */}
          <div className="mb-12">
            {/* Section marker — same pattern as api page */}
            <div className="flex items-center gap-2 mb-6">
              <div className="w-0.5 h-4 bg-border" aria-hidden />
              <span className="font-mono text-xs text-foreground font-semibold">
                [ 01 / 02 ]
              </span>
              <span className="text-muted-foreground/50 text-xs">·</span>
              <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                Dashboard
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-2">
              {t("title")}
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {isPro ? t("subtitle_pro") : t("subtitle_free")}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              <Link
                href="/api/dashboard"
                className="underline underline-offset-4 decoration-border hover:text-foreground hover:decoration-foreground transition-colors"
              >
                API Dashboard
              </Link>
              {" "}· Manage keys, usage, and billing for the developer API.
            </p>
          </div>

          <div className="border-t border-border mb-12" />

          {/* ── Managers grid ───────────────────────── */}
          <div className="grid gap-px bg-border lg:grid-cols-2 rounded-lg overflow-hidden mb-12">
            {/* Left: Custom Domains */}
            <div className="bg-background px-8 py-10 space-y-4">
              <CustomDomainManager
                initialDomains={data.customDomains}
                isPro={isPro}
              />
              {(!data.customDomains || data.customDomains.length === 0) && (
                <p className="text-xs text-muted-foreground pt-2">
                  Don&apos;t own a domain yet?{" "}
                  <a
                    rel="sponsored"
                    href={DOMAIN_AFFILIATE_URL}
                    target="_blank"
                    className="text-foreground underline underline-offset-4 decoration-border hover:decoration-foreground transition-colors inline-flex items-center gap-1"
                  >
                    Register one instantly from Namecheap →
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </p>
              )}
            </div>

            {/* Right: Mute list */}
            <div className="bg-background px-8 py-10 space-y-8">
              <MuteListManager
                initialSenders={data.mutedSenders}
                isPro={isPro}
              />

              {!isPro && (
                <div className="rounded-lg border border-border bg-muted/20 p-5 space-y-3">
                  <p className="text-sm font-semibold text-foreground">
                    Own your email permanently
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Get a domain + private email in 2 minutes. Stop losing access to important messages when temp addresses expire.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                    <a
                      rel="sponsored"
                      href={DOMAIN_AFFILIATE_URL}
                      target="_blank"
                      className="inline-flex items-center gap-1.5 text-xs font-medium bg-foreground text-background px-3 py-1.5 rounded-md hover:opacity-90 transition-opacity"
                    >
                      Find your domain name today from Namecheap →
                    </a>
                    <span className="text-[10px] text-muted-foreground">Save big on your first domain</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Informational section (free users) ── */}
          {!isPro && (
            <section className="relative border-t border-border pt-16">
              {/* Section marker */}
              <div className="flex items-center gap-2 mb-10">
                <div className="w-0.5 h-4 bg-border" aria-hidden />
                <span className="font-mono text-xs text-foreground font-semibold">
                  [ 02 / 02 ]
                </span>
                <span className="text-muted-foreground/50 text-xs">·</span>
                <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  {t("info_title")}
                </span>
              </div>

              <p className="text-sm text-muted-foreground max-w-xl leading-relaxed mb-14">
                {t("info_p1")}
              </p>

              <div className="grid gap-px bg-border rounded-lg overflow-hidden md:grid-cols-3">
                {[
                  {
                    icon: <Globe className="w-4 h-4 text-muted-foreground" />,
                    title: t("info_card_1_title"),
                    desc: t("info_card_1_desc"),
                    index: "01",
                  },
                  {
                    icon: <ShieldCheck className="w-4 h-4 text-muted-foreground" />,
                    title: t("info_card_2_title"),
                    desc: t("info_card_2_desc"),
                    index: "02",
                  },
                  {
                    icon: <Zap className="w-4 h-4 text-muted-foreground" />,
                    title: t("info_card_3_title"),
                    desc: t("info_card_3_desc"),
                    index: "03",
                  },
                ].map((card) => (
                  <div
                    key={card.title}
                    className="bg-background px-6 py-8 h-full hover:bg-muted/10 transition-colors duration-200"
                  >
                    <p className="font-mono text-xs text-muted-foreground mb-3">{card.index}</p>
                    <div className="mb-3">{card.icon}</div>
                    <p className="text-sm font-semibold text-foreground mb-2">{card.title}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{card.desc}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

        </main>
      </div>
    </ThemeProvider>
  );
}