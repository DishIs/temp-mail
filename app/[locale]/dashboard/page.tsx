import { CustomDomainManager } from "@/components/dashboard/CustomDomainManager";
import { MuteListManager } from "@/components/dashboard/MuteListManager";
import { fetchFromServiceAPI } from "@/lib/api";
import { ThemeProvider } from "@/components/theme-provider";
import { AppHeader } from "@/components/app-header";
import { EyeOff, ShieldCheck, Globe, Zap } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/auth";
import Link from "next/link";

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
                        <CustomDomainManager
                            initialDomains={data.customDomains}
                            isPro={isPro}
                        />
                        <div className="space-y-8">
                            <MuteListManager
                                initialSenders={data.mutedSenders}
                                isPro={isPro}
                            />

                            {!isPro && (
                                <div className="border border-dashed border-muted-foreground/30 rounded-lg bg-muted/20 text-center mb-6">
                                    <div className="flex justify-between px-2">
                                        <p className="px-1 text-[10px] justify-start">Sponsored</p>
                                        <Link href={'/pricing'} className="px-1 text-[10px] justify-start hover:text-yellow-500 transition-all duration-200">Remove Ads</Link>
                                    </div>
                                    <script async="async" data-cfasync="false" src="https://pl28737055.effectivegatecpm.com/4e07f31d89752ce266992c1cda339536/invoke.js"></script>
                                    <div id="container-4e07f31d89752ce266992c1cda339536"></div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Informational / Marketing Content */}
                    {!isPro && <div className="mt-16 max-w-5xl mx-auto space-y-8">
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
                    </div>}
                </main>
            </div>
        </ThemeProvider>
    );
}