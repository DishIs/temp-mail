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
      <div className="min-h-screen max-w-[100vw] bg-background">
        <AppHeader initialSession={session} />

        <main className="max-w-5xl mx-auto px-6 py-16">

          {/* ── Page header ─────────────────────────── */}
          <div className="mb-12">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3">
              Dashboard
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-2">
              {t("title")}
            </h1>
            <p className="text-sm text-muted-foreground">
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
          <div className="grid gap-12 lg:grid-cols-2">

            {/* Left: Custom Domains */}
            <div className="space-y-4">
              <CustomDomainManager
                initialDomains={data.customDomains}
                isPro={isPro}
              />
              {(!data.customDomains || data.customDomains.length === 0) && (
                <p className="text-xs text-muted-foreground">
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

            {/* Right: Mute list + promo */}
            <div className="space-y-8">
              <MuteListManager
                initialSenders={data.mutedSenders}
                isPro={isPro}
              />

              {!isPro && (
                <div className="rounded-lg border border-border bg-muted/20 p-5 space-y-3">
                  <p className="text-sm font-medium text-foreground">
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
            <div className="mt-20">
              <div className="border-t border-border mb-12" />

              <div className="mb-10">
                <h2 className="text-xl font-semibold tracking-tight text-foreground mb-3">
                  {t("info_title")}
                </h2>
                <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
                  {t("info_p1")}
                </p>
              </div>

              <div className="grid gap-px bg-border rounded-lg overflow-hidden md:grid-cols-3">
                {[
                  {
                    icon: <Globe className="w-4 h-4 text-muted-foreground mb-3" />,
                    title: t("info_card_1_title"),
                    desc: t("info_card_1_desc"),
                  },
                  {
                    icon: <ShieldCheck className="w-4 h-4 text-muted-foreground mb-3" />,
                    title: t("info_card_2_title"),
                    desc: t("info_card_2_desc"),
                  },
                  {
                    icon: <Zap className="w-4 h-4 text-muted-foreground mb-3" />,
                    title: t("info_card_3_title"),
                    desc: t("info_card_3_desc"),
                  },
                ].map((card) => (
                  <div key={card.title} className="bg-background px-6 py-6">
                    {card.icon}
                    <p className="text-sm font-medium text-foreground mb-1.5">{card.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{card.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>
      </div>
    </ThemeProvider>
  );
}