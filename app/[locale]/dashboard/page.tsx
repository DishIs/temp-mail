import { CustomDomainManager } from "@/components/dashboard/CustomDomainManager";
import { MuteListManager } from "@/components/dashboard/MuteListManager";
import { fetchFromServiceAPI } from "@/lib/api";
import { ThemeProvider } from "@/components/theme-provider";
import { AppHeader } from "@/components/app-header";
import { EyeOff, ShieldCheck, Globe, Zap } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSession } from "@/lib/session";

interface DashboardData {
    customDomains: any[];
    mutedSenders: string[];
}

export default async function DashboardPage({
    params: { locale },
}: {
    params: { locale: string };
}) {
    const session = await getSession();
    const t = await getTranslations("Dashboard");
    const isPro = session?.plan === "pro";

    let data: DashboardData = { customDomains: [], mutedSenders: [] };

    if (isPro && session?.id) {
        try {
            data = await fetchFromServiceAPI(`/user/${session.id}/dashboard-data`);
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
                                <div className="w-full p-6 border border-dashed border-muted-foreground/30 rounded-lg bg-muted/20 text-center">
                                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground uppercase tracking-widest mb-2">
                                        <EyeOff className="w-4 h-4" /> {t('ad_label')}
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {t('ad_text')} <br/>
                                        <span className="font-semibold text-primary cursor-pointer hover:underline">
                                            {t('ad_upgrade')}
                                        </span>
                                    </p>
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