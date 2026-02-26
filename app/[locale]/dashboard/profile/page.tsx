// app/dashboard/profile/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
    Mail, Calendar, CreditCard, Loader2, Zap, ExternalLink,
    CheckCircle2, History, AlertCircle, RefreshCw, Clock, Ban,
    PauseCircle, TriangleAlert, RotateCcw
} from "lucide-react";
import { FaGoogle, FaGithub } from "react-icons/fa";
import { format, parseISO, formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UpsellModal } from "@/components/upsell-modal";
import { AppHeader } from "@/components/nLHeader";
import { ThemeProvider } from "@/components/theme-provider";
import { Session } from "next-auth";

interface ScheduledChange {
    action: string;
    effective_at: string;
    resume_at?: string;
}

interface SubscriptionData {
    provider: "paypal" | "paddle" | "manual";
    subscriptionId: string;
    planId?: string;
    status: "TRIALING" | "ACTIVE" | "SUSPENDED" | "CANCELLED" | "EXPIRED" | "APPROVAL_PENDING";
    startTime: string;
    payerEmail?: string;
    payerName?: string;
    lastUpdated?: string;
    cancelAtPeriodEnd?: boolean;
    periodEnd?: string;
    canceledAt?: string;
    nextBilledAt?: string;
    scheduledChange?: ScheduledChange;
    pausedAt?: string;
}

interface UserProfile {
    wyiUserId: string;
    name: string;
    email: string;
    image?: string;
    plan: "free" | "pro";
    subscription?: SubscriptionData;
    createdAt?: string;
}

interface StorageStats {
    success: boolean;
    storageUsed: number;
    storageLimit: number;
    percentUsed: string;
    emailCount: number;
    storageUsedFormatted: string;
    storageLimitFormatted: string;
    storageRemaining: number;
    storageRemainingFormatted: string;
    message: string;
}

function safeFormat(dateStr?: string | null, fmt = "MMM d, yyyy"): string {
    if (!dateStr) return "N/A";
    try { return format(parseISO(dateStr), fmt); } catch { return "N/A"; }
}

function safeDistanceToNow(dateStr?: string | null): string {
    if (!dateStr) return "";
    try { return formatDistanceToNow(parseISO(dateStr), { addSuffix: true }); } catch { return ""; }
}

function statusBadgeProps(status: SubscriptionData["status"], cancelAtPeriodEnd?: boolean) {
    if (cancelAtPeriodEnd && status === "ACTIVE") {
        return { label: "Cancels soon", className: "bg-amber-500 text-white" };
    }
    switch (status) {
        case "ACTIVE":    return { label: "Active",     className: "bg-green-600 text-white" };
        case "TRIALING":  return { label: "Trial",      className: "bg-blue-600 text-white" };
        case "SUSPENDED": return { label: "Suspended",  className: "bg-amber-500 text-white" };
        case "CANCELLED": return { label: "Cancelled",  className: "bg-destructive text-white" };
        case "EXPIRED":   return { label: "Expired",    className: "bg-muted text-muted-foreground" };
        default:          return { label: status,       className: "bg-secondary" };
    }
}

// ── Cancel-at-period-end warning banner ───────────────────────────────────────
function CancelPeriodEndBanner({
    periodEnd, onManage, loading,
}: { periodEnd?: string; onManage: () => void; loading: boolean }) {
    const endDate  = safeFormat(periodEnd, "MMMM d, yyyy");
    const timeLeft = safeDistanceToNow(periodEnd);

    return (
        <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700 p-4 space-y-3">
            <div className="flex items-start gap-3">
                <TriangleAlert className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1 flex-1">
                    <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                        Your subscription is cancelled
                    </p>
                    <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
                        You still have <strong>full Pro access until {endDate}</strong>
                        {timeLeft ? ` (${timeLeft})` : ""}.
                        After that date your account will be downgraded to free and your older emails and attachments will be removed.
                    </p>
                </div>
            </div>
            <div className="ml-8 space-y-1 text-xs text-amber-700 dark:text-amber-400">
                {[
                    "Emails reduced to 20 most recent — older ones removed",
                    "Emails expire after 24 hours instead of being kept forever",
                    "Custom domain email routing will stop",
                    "OTP and verification link detection will be hidden",
                ].map(item => (
                    <div key={item} className="flex items-start gap-1.5">
                        <span className="mt-0.5">·</span>
                        <span>{item}</span>
                    </div>
                ))}
            </div>
            <div className="ml-8 flex flex-wrap gap-2 pt-1">
                <Button
                    size="sm"
                    onClick={onManage}
                    disabled={loading}
                    className="bg-amber-600 hover:bg-amber-700 text-white border-0"
                >
                    {loading
                        ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Opening...</>
                        : <><RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Reactivate subscription</>
                    }
                </Button>
                <Button
                    size="sm"
                    variant="outline"
                    onClick={onManage}
                    disabled={loading}
                    className="border-amber-400 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40"
                >
                    <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Manage on Paddle
                </Button>
            </div>
        </div>
    );
}

// ── Post-downgrade banner (free plan, previously Paddle Pro) ─────────────────
function PostDowngradeBanner({
    sub, onManage, loading,
}: { sub: SubscriptionData; onManage: () => void; loading: boolean }) {
    return (
        <div className="rounded-lg border border-dashed border-muted p-4 space-y-3 bg-muted/30">
            <div className="flex items-start gap-3">
                <History className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">Previous Pro subscription</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        Your subscription ended on{" "}
                        <strong>{safeFormat(sub.canceledAt ?? sub.periodEnd, "MMMM d, yyyy")}</strong>.
                        You can still view your billing history and past invoices on the Paddle customer portal.
                    </p>
                </div>
            </div>
            <div className="ml-8 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={onManage} disabled={loading}>
                    {loading
                        ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Opening...</>
                        : <><History className="mr-1.5 h-3.5 w-3.5" /> View billing history</>
                    }
                </Button>
                <Button
                    size="sm"
                    onClick={() => window.location.href = '/pricing'}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0"
                >
                    <Zap className="mr-1.5 h-3.5 w-3.5 fill-current" /> Upgrade again
                </Button>
            </div>
        </div>
    );
}

// ── Paddle subscription detail grid ──────────────────────────────────────────
function PaddleSubscriptionDetails({ sub }: { sub: SubscriptionData }) {
    const badge = statusBadgeProps(sub.status, sub.cancelAtPeriodEnd);

    const rows: { icon: React.ReactNode; label: string; value: React.ReactNode }[] = [
        {
            icon: <CreditCard className="h-4 w-4 text-muted-foreground" />,
            label: "Subscription ID",
            value: (
                <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded select-all">
                    {sub.subscriptionId}
                </span>
            ),
        },
        {
            icon: <Calendar className="h-4 w-4 text-muted-foreground" />,
            label: "Started",
            value: safeFormat(sub.startTime, "MMMM d, yyyy"),
        },
        ...(sub.nextBilledAt && !sub.cancelAtPeriodEnd ? [{
            icon: <RefreshCw className="h-4 w-4 text-muted-foreground" />,
            label: "Next Billing Date",
            value: safeFormat(sub.nextBilledAt, "MMMM d, yyyy"),
        }] : []),
        ...(sub.cancelAtPeriodEnd && sub.periodEnd ? [{
            icon: <Ban className="h-4 w-4 text-amber-500" />,
            label: "Pro access until",
            value: <span className="text-amber-600 font-semibold">{safeFormat(sub.periodEnd, "MMMM d, yyyy")}</span>,
        }] : []),
        ...(sub.payerEmail ? [{
            icon: <Mail className="h-4 w-4 text-muted-foreground" />,
            label: "Billing Email",
            value: sub.payerEmail,
        }] : []),
        ...(sub.planId ? [{
            icon: <Zap className="h-4 w-4 text-muted-foreground" />,
            label: "Price ID",
            value: (
                <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded select-all">
                    {sub.planId}
                </span>
            ),
        }] : []),
        ...(sub.pausedAt ? [{
            icon: <PauseCircle className="h-4 w-4 text-amber-500" />,
            label: "Paused At",
            value: <span className="text-amber-600 font-medium">{safeFormat(sub.pausedAt, "MMM d, yyyy · h:mm a")}</span>,
        }] : []),
        ...(sub.lastUpdated ? [{
            icon: <Clock className="h-4 w-4 text-muted-foreground" />,
            label: "Last Updated",
            value: safeFormat(sub.lastUpdated, "MMM d, yyyy · h:mm a"),
        }] : []),
    ];

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
                <Badge className={badge.className}>{badge.label}</Badge>
                <Badge variant="outline" className="text-emerald-600 border-emerald-300 font-semibold">Paddle</Badge>
                {sub.status === "TRIALING" && (
                    <span className="text-xs text-muted-foreground">
                        Trial ends {sub.nextBilledAt ? `on ${safeFormat(sub.nextBilledAt)}` : "soon"} — no charge until then
                    </span>
                )}
            </div>
            <div className="grid gap-3">
                {rows.map(({ icon, label, value }) => (
                    <div key={label} className="flex items-center justify-between gap-4 text-sm py-1.5 border-b border-dashed border-muted last:border-0">
                        <span className="flex items-center gap-2 text-muted-foreground shrink-0">{icon} {label}</span>
                        <span className="text-right font-medium">{value}</span>
                    </div>
                ))}
            </div>
            {sub.scheduledChange && sub.scheduledChange.action !== 'cancel' && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 mt-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                    <div className="text-sm">
                        <p className="font-medium text-amber-800 dark:text-amber-300 capitalize">
                            Scheduled {sub.scheduledChange.action}
                        </p>
                        <p className="text-amber-700 dark:text-amber-400 text-xs mt-0.5">
                            Effective {safeFormat(sub.scheduledChange.effective_at, "MMMM d, yyyy")}
                            {sub.scheduledChange.resume_at && <> · Resumes {safeFormat(sub.scheduledChange.resume_at, "MMMM d, yyyy")}</>}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ProfilePage() {
    const { data: session, status } = useSession();
    const router   = useRouter();
    const t        = useTranslations("Profile");

    const [loading, setLoading]             = useState(true);
    const [userData, setUserData]           = useState<UserProfile | null>(null);
    const [storageData, setStorageData]     = useState<StorageStats | null>(null);
    const [portalLoading, setPortalLoading] = useState(false);
    const [isUpsellOpen, setIsUpsellOpen]   = useState(false);
    const [upsellFeature]                   = useState("Pro Plan");

    useEffect(() => {
        if (status === "unauthenticated") router.push("/auth");
    }, [status, router]);

    useEffect(() => {
        if (status === "authenticated") { fetchUserData(); fetchStorageData(); }
    }, [status]);

    const fetchUserData = async () => {
        try {
            const res  = await fetch('/api/user/me');
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to fetch profile");
            if (data.success && data.user) setUserData(data.user);
            else toast.error(t('toasts.fetch_error'));
        } catch (error) {
            console.error("Failed to load profile data", error);
            toast.error(t('toasts.load_error'));
        }
    };

    const fetchStorageData = async () => {
        try {
            const res  = await fetch('/api/user/storage');
            const data = await res.json();
            if (data.success) setStorageData(data);
        } catch (error) {
            console.error("Failed to load storage stats", error);
        } finally {
            setLoading(false);
        }
    };

    const handleManageSubscription = async () => {
        const sub = userData?.subscription;
        const hasPaddleSub = sub?.provider === 'paddle' ||
            (!isPro && sub?.subscriptionId && sub?.status === 'CANCELLED');

        if (hasPaddleSub) {
            setPortalLoading(true);
            try {
                const res  = await fetch('/api/paddle/portal-session', { method: 'POST' });
                const data = await res.json();
                if (!res.ok || !data.url) { toast.error('Could not open billing portal. Please try again.'); return; }
                window.open(data.url, '_blank');
            } catch {
                toast.error('Could not open billing portal. Please try again.');
            } finally {
                setPortalLoading(false);
            }
        } else if (sub?.provider === 'paypal') {
            window.open(`https://www.paypal.com/myaccount/autopay/connect/${sub.subscriptionId}`, '_blank');
        } else {
            router.push('/pricing');
        }
    };

    const getProviderDetails = (session: Session) => {
        if (!session.user) return { label: "Unknown", icon: null };
        const image = session.user.image || "";
        if (image.includes("googleusercontent.com")) return { label: "Google", icon: <FaGoogle className="w-5 h-5 text-blue-500" /> };
        if (image.includes("githubusercontent.com"))  return { label: "GitHub", icon: <FaGithub className="w-5 h-5 text-gray-700 dark:text-white" /> };
        return { label: "Email", icon: <Mail className="h-5 w-5" /> };
    };

    if (status === "loading" || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-3 text-muted-foreground text-sm">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <p>{t('loading')}</p>
                </div>
            </div>
        );
    }

    const isPro                   = userData?.plan === "pro";
    const sub                     = userData?.subscription;
    const subStatus               = sub?.status ?? "NONE";
    const isCancellingButStillPro = isPro && sub?.cancelAtPeriodEnd === true;
    const isDowngradedFromPaddle  = !isPro && sub?.provider === 'paddle' && sub?.status === 'CANCELLED';
    const isActiveOrTrialing      = (subStatus === "ACTIVE" || subStatus === "TRIALING") && !isCancellingButStillPro;
    const paymentProviderName     = sub?.provider === 'paypal' ? 'PayPal' : sub?.provider === 'paddle' ? 'Paddle' : 'N/A';
    const providerDetails         = getProviderDetails(session);
    const percentUsed             = storageData ? parseFloat(storageData.percentUsed) : 0;
    const usageText               = storageData
        ? `${storageData.storageUsedFormatted || storageData.message} / ${storageData.storageLimitFormatted || storageData.message}`
        : "Loading...";

    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <div className="min-h-screen bg-muted/10">
                <AppHeader initialSession={session} />

                <div className="container max-w-6xl mx-auto py-10 px-4 sm:px-6">

                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
                            <p className="text-muted-foreground mt-1">{t('subtitle')}</p>
                        </div>
                        {!isPro && (
                            <Button
                                onClick={() => router.push('/pricing')}
                                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0"
                            >
                                <Zap className="mr-2 h-4 w-4 fill-current" /> {t('upgrade_btn')}
                            </Button>
                        )}
                    </div>

                    <Tabs defaultValue="overview" className="space-y-6">
                        <TabsList className="bg-background border">
                            <TabsTrigger value="overview">{t('tabs.overview')}</TabsTrigger>
                            <TabsTrigger value="billing" className="relative">
                                {t('tabs.billing')}
                                {isCancellingButStillPro && (
                                    <span className="ml-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 inline-block" />
                                )}
                            </TabsTrigger>
                            <TabsTrigger value="settings">{t('tabs.settings')}</TabsTrigger>
                        </TabsList>

                        {/* OVERVIEW TAB */}
                        <TabsContent value="overview" className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <Card className="md:col-span-2">
                                    <CardHeader className="flex flex-row items-center gap-4">
                                        <Avatar className="h-16 w-16 border-2 border-primary/10">
                                            <AvatarImage src={session?.user?.image || ""} />
                                            <AvatarFallback className="text-lg bg-primary/5">{userData?.name?.charAt(0) || "U"}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <CardTitle>{userData?.name}</CardTitle>
                                            <CardDescription className="flex items-center gap-2 mt-1">
                                                <Mail className="h-3.5 w-3.5" /> {userData?.email}
                                            </CardDescription>
                                        </div>
                                        <div className="ml-auto flex flex-col items-end gap-1.5">
                                            <Badge variant={isPro ? "default" : "secondary"} className="uppercase tracking-wider">
                                                {isPro ? t('overview.plan_pro') : t('overview.plan_free')}
                                            </Badge>
                                            {isCancellingButStillPro && (
                                                <span className="text-xs text-amber-600 font-medium">
                                                    Cancels {safeFormat(sub?.periodEnd)}
                                                </span>
                                            )}
                                        </div>
                                    </CardHeader>
                                    <Separator />
                                    <CardContent className="pt-6 grid gap-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium text-muted-foreground">{t('overview.user_id')}</p>
                                                <p className="text-sm font-mono bg-muted inline-block px-2 py-1 rounded select-all truncate max-w-full" title={userData?.wyiUserId}>
                                                    {userData?.wyiUserId || "N/A"}
                                                </p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium text-muted-foreground">{t('overview.member_since')}</p>
                                                <p className="text-sm">{safeFormat(userData?.createdAt, "MMMM d, yyyy")}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium text-muted-foreground">{t('overview.login_method')}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    {providerDetails.icon}
                                                    <span className="text-sm font-medium">{providerDetails.label}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base">{t('overview.usage_title')}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-muted-foreground">{t('overview.storage_used')}</span>
                                                <span className="font-medium">{percentUsed.toFixed(2)}%</span>
                                            </div>
                                            <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                                <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${percentUsed}%` }} />
                                            </div>
                                            <p className="text-xs text-muted-foreground text-right">{usageText}</p>
                                        </div>
                                        <div className="space-y-2 pt-2">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-muted-foreground">Emails Stored</span>
                                                <span className="font-medium">{storageData?.emailCount ?? 0}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-muted-foreground">{t('overview.daily_emails')}</span>
                                                <span className="font-medium">{t('overview.unlimited')}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                    {!isPro && (
                                        <CardFooter>
                                            <p className="text-xs text-muted-foreground">
                                                <span className="text-amber-500 font-medium">{t('overview.note_label')}</span> {t('overview.note_text')}
                                            </p>
                                        </CardFooter>
                                    )}
                                </Card>
                            </div>
                        </TabsContent>

                        {/* BILLING TAB */}
                        <TabsContent value="billing" className="space-y-6">
                            <Card className={isPro && !isCancellingButStillPro ? "border-primary/20 bg-primary/5" : ""}>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <CreditCard className="h-5 w-5" /> {t('billing.sub_title')}
                                    </CardTitle>
                                </CardHeader>

                                <CardContent className="space-y-6">
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <h3 className="text-2xl font-bold capitalize">{t('billing.plan_display', { plan: userData?.plan })}</h3>
                                        {sub && (
                                            <Badge className={statusBadgeProps(sub.status, sub.cancelAtPeriodEnd).className}>
                                                {statusBadgeProps(sub.status, sub.cancelAtPeriodEnd).label}
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground -mt-4">
                                        {isPro ? t('billing.feat_unlocked') : t('billing.feat_basic')}
                                    </p>

                                    {/* Cancel-at-period-end warning */}
                                    {isCancellingButStillPro && (
                                        <CancelPeriodEndBanner
                                            periodEnd={sub?.periodEnd}
                                            onManage={handleManageSubscription}
                                            loading={portalLoading}
                                        />
                                    )}

                                    {/* Paddle detail grid */}
                                    {isPro && sub?.provider === 'paddle' && (
                                        <>
                                            <Separator />
                                            <PaddleSubscriptionDetails sub={sub} />
                                        </>
                                    )}

                                    {/* PayPal detail */}
                                    {isPro && sub?.provider === 'paypal' && (
                                        <>
                                            <Separator />
                                            <div className="grid gap-3 text-sm">
                                                <div className="flex items-center justify-between py-1.5 border-b border-dashed border-muted">
                                                    <span className="flex items-center gap-2 text-muted-foreground"><CreditCard className="h-4 w-4" /> Subscription ID</span>
                                                    <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded select-all">{sub.subscriptionId}</span>
                                                </div>
                                                <div className="flex items-center justify-between py-1.5 border-b border-dashed border-muted">
                                                    <span className="flex items-center gap-2 text-muted-foreground"><Calendar className="h-4 w-4" /> Started</span>
                                                    <span className="font-medium">{safeFormat(sub.startTime, "MMMM d, yyyy")}</span>
                                                </div>
                                                {sub.payerEmail && (
                                                    <div className="flex items-center justify-between py-1.5">
                                                        <span className="flex items-center gap-2 text-muted-foreground"><Mail className="h-4 w-4" /> PayPal Email</span>
                                                        <span className="font-medium">{sub.payerEmail}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}

                                    {/* Already downgraded from Paddle */}
                                    {isDowngradedFromPaddle && sub && (
                                        <>
                                            <Separator />
                                            <PostDowngradeBanner sub={sub} onManage={handleManageSubscription} loading={portalLoading} />
                                        </>
                                    )}
                                </CardContent>

                                <CardFooter className="bg-muted/30 flex flex-col sm:flex-row gap-3 border-t">
                                    {isPro && isActiveOrTrialing ? (
                                        <Button variant="outline" onClick={handleManageSubscription} disabled={portalLoading}>
                                            {portalLoading
                                                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Opening...</>
                                                : <><ExternalLink className="mr-2 h-4 w-4" /> {t('billing.manage_btn')}</>
                                            }
                                        </Button>
                                    ) : !isPro && !isDowngradedFromPaddle ? (
                                        <Button onClick={() => router.push('/pricing')} className="w-full sm:w-auto">
                                            {t('billing.upgrade_btn')}
                                        </Button>
                                    ) : null}
                                </CardFooter>
                            </Card>

                            {/* Transaction History */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <History className="h-5 w-5" /> {t('billing.trans_title')}
                                    </CardTitle>
                                    <CardDescription>
                                        {t('billing.trans_desc', { provider: paymentProviderName })}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
                                        {isPro || isDowngradedFromPaddle ? (
                                            <>
                                                <div className={`p-3 rounded-full ${isDowngradedFromPaddle ? 'bg-muted' : 'bg-green-100 dark:bg-green-900/20'}`}>
                                                    {isDowngradedFromPaddle
                                                        ? <History className="h-8 w-8 text-muted-foreground" />
                                                        : <CheckCircle2 className="h-8 w-8 text-green-600" />
                                                    }
                                                </div>
                                                <h3 className="text-lg font-medium">
                                                    {isDowngradedFromPaddle ? 'Past subscription' : t('billing.active_title')}
                                                </h3>
                                                <p className="text-muted-foreground max-w-md">
                                                    {isDowngradedFromPaddle
                                                        ? 'Your invoices and payment history are available on the Paddle customer portal.'
                                                        : t('billing.active_desc', { provider: paymentProviderName })}
                                                </p>
                                                <Button variant="outline" size="sm" onClick={handleManageSubscription} disabled={portalLoading}>
                                                    {portalLoading
                                                        ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Opening...</>
                                                        : isDowngradedFromPaddle
                                                            ? <><History className="mr-2 h-4 w-4" /> View billing history</>
                                                            : <><ExternalLink className="mr-2 h-4 w-4" />{sub?.provider === 'paddle' ? 'Manage on Paddle →' : t('billing.view_invoice', { provider: 'PayPal' })}</>
                                                    }
                                                </Button>
                                            </>
                                        ) : (
                                            <>
                                                <div className="bg-muted p-3 rounded-full">
                                                    <AlertCircle className="h-8 w-8 text-muted-foreground" />
                                                </div>
                                                <h3 className="text-lg font-medium">{t('billing.no_trans_title')}</h3>
                                                <p className="text-muted-foreground">{t('billing.no_trans_desc')}</p>
                                            </>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* SETTINGS TAB */}
                        <TabsContent value="settings">
                            <Card>
                                <CardHeader>
                                    <CardTitle>{t('settings.sec_title')}</CardTitle>
                                    <CardDescription>{t('settings.sec_desc')}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="space-y-0.5">
                                            <h4 className="font-medium text-sm">{t('settings.2fa_title')}</h4>
                                            <p className="text-xs text-muted-foreground">{t('settings.2fa_desc')}</p>
                                        </div>
                                        <Button variant="outline" size="sm" disabled>{t('settings.coming_soon')}</Button>
                                    </div>
                                    <div className="flex items-center justify-between p-3 border rounded-lg border-destructive/20 bg-destructive/5">
                                        <div className="space-y-0.5">
                                            <h4 className="font-medium text-sm text-destructive">{t('settings.del_title')}</h4>
                                            <p className="text-xs text-destructive/80">{t('settings.del_desc')}</p>
                                        </div>
                                        <Button variant="destructive" size="sm">{t('settings.del_btn')}</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>

                <UpsellModal isOpen={isUpsellOpen} onClose={() => setIsUpsellOpen(false)} featureName={upsellFeature} />
            </div>
        </ThemeProvider>
    );
}