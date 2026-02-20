import { CustomDomainManager } from "@/components/dashboard/CustomDomainManager";
import { MuteListManager } from "@/components/dashboard/MuteListManager";
import { fetchFromServiceAPI } from "@/lib/api";
import { ThemeProvider } from "@/components/theme-provider";
import { AppHeader } from "@/components/app-header";
import { ShieldCheck, Globe, Zap, ExternalLink } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/auth";
import Link from "next/link";

// ── Affiliate link ────────────────────────────────────────────────────────────
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

                <main className="container mx-auto px-4 py-8">
                    {/* Page Header */}
                    <div className="flex flex-col gap-2 mb-8 text-center max-w-2xl mx-auto">
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{t('title')}</h1>
                        <p className="text-muted-foreground text-lg">
                            {isPro ? t('subtitle_pro') : t('subtitle_free')}
                        </p>
                    </div>

                    {/* Functional Managers */}
                    <div className="grid gap-8 max-w-6xl mx-auto lg:grid-cols-2">

                        {/* ── Left column: Custom Domains + Placement 2 ── */}
                        <div className="space-y-3">
                            <CustomDomainManager
                                initialDomains={data.customDomains}
                                isPro={isPro}
                            />
                            {/* ── Placement 2: Below custom domain input — highest conversion ── */}
                            {!isPro && (
                                <p className="text-xs text-muted-foreground px-1">
                                    Don&apos;t own a domain yet?{" "}
                                    <a
                                        rel="sponsored"
                                        href={DOMAIN_AFFILIATE_URL}
                                        target="_blank"
                                        className="text-primary hover:underline font-medium inline-flex items-center gap-0.5"
                                    >
                                        Register one instantly
                                        <ExternalLink className="h-3 w-3" />
                                    </a>
                                </p>
                            )}
                        </div>

                        {/* ── Right column: Mute list + Placement 1 native card ── */}
                        <div className="space-y-6">
                            <MuteListManager
                                initialSenders={data.mutedSenders}
                                isPro={isPro}
                            />

                            {/* ── Placement 1: Native domain promo card (replaces ad) ── */}
                            {!isPro && (
                                <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Globe className="h-5 w-5 text-primary shrink-0" />
                                        <p className="text-sm font-semibold text-foreground">Own your email permanently</p>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Get a domain + private email in 2 minutes. Stop losing access to important messages when temp addresses expire.
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                                        <a
                                            rel="sponsored"
                                            href={DOMAIN_AFFILIATE_URL}
                                            target="_blank"
                                            className="inline-flex items-center gap-1.5 text-xs font-medium bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90 transition-colors"
                                        >
                                            Find your domain name today →
                                        </a>
                                        <span className="text-[10px] text-muted-foreground">Save big on your first domain</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Informational / Marketing Content */}
                    {!isPro && (
                        <div className="mt-16 max-w-5xl mx-auto space-y-8">
                            <div className="text-center space-y-4">
                                <h2 className="text-2xl font-bold">{t('info_title')}</h2>
                                <p className="text-muted-foreground max-w-2xl mx-auto">
                                    {t('info_p1')}
                                </p>
                            </div>

                            <div className="grid gap-6 md:grid-cols-3">
                                <Card className="bg-muted/5 border-muted">
                                    <CardHeader>
                                        <Globe className="w-8 h-8 text-primary mb-2" />
                                        <CardTitle className="text-lg">{t('info_card_1_title')}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-sm text-muted-foreground">
                                        {t('info_card_1_desc')}
                                    </CardContent>
                                </Card>

                                <Card className="bg-muted/5 border-muted">
                                    <CardHeader>
                                        <ShieldCheck className="w-8 h-8 text-primary mb-2" />
                                        <CardTitle className="text-lg">{t('info_card_2_title')}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-sm text-muted-foreground">
                                        {t('info_card_2_desc')}
                                    </CardContent>
                                </Card>

                                <Card className="bg-muted/5 border-muted">
                                    <CardHeader>
                                        <Zap className="w-8 h-8 text-primary mb-2" />
                                        <CardTitle className="text-lg">{t('info_card_3_title')}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-sm text-muted-foreground">
                                        {t('info_card_3_desc')}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </ThemeProvider>
    );
}