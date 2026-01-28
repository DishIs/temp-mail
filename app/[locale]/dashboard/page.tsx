import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { CustomDomainManager } from "@/components/dashboard/CustomDomainManager";
import { MuteListManager } from "@/components/dashboard/MuteListManager";
import { fetchFromServiceAPI } from "@/lib/api";
import { ThemeProvider } from "@/components/theme-provider";
import { AppHeader } from "@/components/app-header";
import { EyeOff } from "lucide-react";

interface DashboardData {
    customDomains: any[];
    mutedSenders: string[];
}

const PrivacyAdBanner = () => (
    <div className="w-full max-w-4xl mx-auto mt-8 p-6 border border-dashed border-muted-foreground/30 rounded-lg bg-muted/20 text-center">
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground uppercase tracking-widest mb-2">
        <EyeOff className="w-4 h-4" /> Privacy-Safe Ad
      </div>
      <p className="text-sm text-muted-foreground">
        We rely on privacy-focused ads to keep the free tier running. <br/>
        <span className="font-semibold text-primary">Upgrade to Pro to support development and remove ads.</span>
      </p>
    </div>
);

export default async function DashboardPage({
    params,
}: {
    params: { locale: string };
}) {
    const session = await getServerSession(authOptions);
    const isPro = session?.user?.plan === "pro";

    let data: DashboardData = { customDomains: [], mutedSenders: [] };

    // Security: Only fetch actual user data if they are Pro.
    // Non-pro users get the UI but no data (and API endpoints will block them).
    if (isPro && session?.user?.id) {
        try {
            data = await fetchFromServiceAPI(`/user/${session.user.id}/dashboard-data`);
        } catch (e) {
            console.error("Failed to fetch dashboard data", e);
            // Fallback to empty data on error
            data = { customDomains: [], mutedSenders: [] };
        }
    }

    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <div className="min-h-screen max-w-[100vw] bg-background">
                <AppHeader initialSession={session} />
                
                <main className="container mx-auto px-4 py-8">
                    <div className="flex flex-col gap-2 mb-8 text-center">
                        <h1 className="text-3xl font-bold">Dashboard</h1>
                        <p className="text-muted-foreground">
                            {isPro 
                                ? "Manage your advanced privacy settings." 
                                : "Upgrade to Pro to unlock Custom Domains and Mute Lists."}
                        </p>
                    </div>

                    <div className="grid gap-8 max-w-6xl mx-auto">
                        <CustomDomainManager 
                            initialDomains={data.customDomains} 
                            isPro={isPro} 
                        />
                        <MuteListManager 
                            initialSenders={data.mutedSenders} 
                            isPro={isPro} 
                        />
                    </div>

                    {!isPro && <PrivacyAdBanner />}
                </main>
            </div>
        </ThemeProvider>
    );
}