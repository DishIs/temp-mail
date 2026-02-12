// app/dashboard/profile/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  Mail, Calendar, CreditCard, Download, 
  Loader2, Zap, ExternalLink, 
  CheckCircle2, History, ShieldCheck, AlertCircle
} from "lucide-react";
import { FaGoogle, FaGithub } from "react-icons/fa";
import { format } from "date-fns";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UpsellModal } from "@/components/upsell-modal";
import { AppHeader } from "@/components/nLHeader"; 
import { ThemeProvider } from "@/components/theme-provider";

// Interfaces based on your MongoDB structure
interface SubscriptionData {
  provider: "paypal" | "paddle";
  subscriptionId: string;
  status: "ACTIVE" | "CANCELLED" | "SUSPENDED" | "EXPIRED";
  startTime: string;
  planId?: string;
  payerEmail?: string;
}

interface UserProfile {
  wyiUserId: string;
  name: string;
  email: string;
  image?: string;
  plan: "free" | "pro";
  storageUsage?: number; // In bytes
  subscription?: SubscriptionData;
  createdAt?: string;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserProfile | null>(null);
  
  // State for upsell
  const [isUpsellOpen, setIsUpsellOpen] = useState(false);
  const [upsellFeature, setUpsellFeature] = useState("Pro Plan");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchUserData();
    }
  }, [status]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/user/me');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch profile");
      }

      if (data.success && data.user) {
        setUserData(data.user);
      } else {
        toast.error("Could not retrieve user data");
      }
    } catch (error) {
      console.error("Failed to load profile data", error);
      toast.error("Failed to load profile details");
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = () => {
    const subId = userData?.subscription?.subscriptionId;
    if (subId) {
        // Direct link to PayPal Autopay management
        window.open(`https://www.paypal.com/myaccount/autopay/connect/${subId}`, '_blank');
    } else {
        router.push('/pricing');
    }
  };

  // Helper: Identify login method based on image URL or provider data
  const getProviderDetails = (user: UserProfile | null) => {
    if (!user) return { label: "Unknown", icon: <ShieldCheck className="w-4 h-4" /> };
    
    if (user.image?.includes("googleusercontent.com")) {
      return { label: "Google", icon: <FaGoogle className="w-4 h-4 text-blue-500" /> };
    }
    if (user.image?.includes("githubusercontent.com")) {
      return { label: "GitHub", icon: <FaGithub className="w-4 h-4" /> };
    }
    return { label: "Email / Standard", icon: <ShieldCheck className="w-4 h-4 text-green-600" /> };
  };

  // Helper: Formatting Storage
  const formatStorage = (bytes: number = 0) => {
    if (bytes === 0) return "0 MB";
    const mb = bytes / (1024 * 1024);
    if (mb > 1000) return `${(mb / 1024).toFixed(2)} GB`;
    return `${mb.toFixed(1)} MB`;
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse">Loading profile data...</p>
        </div>
      </div>
    );
  }

  const isPro = userData?.plan === "pro";
  const provider = getProviderDetails(userData);
  const subStatus = userData?.subscription?.status || "NONE";

  // Calculate usage percentage (Pro: 5GB, Free: 500MB approx)
  const maxStorage = isPro ? 5 * 1024 * 1024 * 1024 : 500 * 1024 * 1024; 
  const currentStorage = userData?.storageUsage || 0;
  const storagePercent = Math.min((currentStorage / maxStorage) * 100, 100);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen bg-muted/10">
        <AppHeader initialSession={session} />

        <div className="container max-w-6xl mx-auto py-10 px-4 sm:px-6">
          
          {/* Header Section */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
              <p className="text-muted-foreground mt-1">Manage your profile, subscription, and billing history.</p>
            </div>
            {!isPro && (
                <Button 
                    onClick={() => router.push('/pricing')} 
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0"
                >
                    <Zap className="mr-2 h-4 w-4 fill-current" /> Upgrade to Pro
                </Button>
            )}
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="bg-background border">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="billing">Billing & Invoices</TabsTrigger>
              <TabsTrigger value="settings">Preferences</TabsTrigger>
            </TabsList>

            {/* OVERVIEW TAB */}
            <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* User Profile Card */}
                    <Card className="md:col-span-2">
                        <CardHeader className="flex flex-row items-center gap-4">
                            <Avatar className="h-16 w-16 border-2 border-primary/10">
                                <AvatarImage src={userData?.image || ""} />
                                <AvatarFallback className="text-lg bg-primary/5">{userData?.name?.charAt(0) || "U"}</AvatarFallback>
                            </Avatar>
                            <div>
                                <CardTitle>{userData?.name}</CardTitle>
                                <CardDescription className="flex items-center gap-2 mt-1">
                                    <Mail className="h-3.5 w-3.5" /> {userData?.email}
                                </CardDescription>
                            </div>
                            <div className="ml-auto">
                                <Badge variant={isPro ? "default" : "secondary"} className="uppercase tracking-wider">
                                    {isPro ? "Pro Plan" : "Free Plan"}
                                </Badge>
                            </div>
                        </CardHeader>
                        <Separator />
                        <CardContent className="pt-6 grid gap-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">User ID</p>
                                    <p className="text-sm font-mono bg-muted inline-block px-2 py-1 rounded select-all truncate max-w-full" title={userData?.wyiUserId}>
                                        {userData?.wyiUserId || "N/A"}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">Member Since</p>
                                    <p className="text-sm">
                                        {userData?.createdAt 
                                            ? format(new Date(userData.createdAt), "MMMM d, yyyy") 
                                            : "N/A"}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">Login Method</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        {provider.icon}
                                        <span className="text-sm font-medium">{provider.label}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Stats / Limits */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Usage Limits</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Storage Used</span>
                                    <span className="font-medium">{storagePercent.toFixed(1)}%</span>
                                </div>
                                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-primary rounded-full transition-all duration-500" 
                                        style={{ width: `${storagePercent}%` }} 
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground text-right">
                                    {formatStorage(currentStorage)} of {isPro ? "5 GB" : "500 MB"}
                                </p>
                            </div>
                             <div className="space-y-2 pt-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Daily Emails</span>
                                    <span className="font-medium">Unlimited</span>
                                </div>
                            </div>
                        </CardContent>
                        {!isPro && (
                            <CardFooter>
                                <p className="text-xs text-muted-foreground">
                                    <span className="text-amber-500 font-medium">Note:</span> Emails auto-delete after 24h on Free plan.
                                </p>
                            </CardFooter>
                        )}
                    </Card>
                </div>
            </TabsContent>

            {/* BILLING TAB */}
            <TabsContent value="billing" className="space-y-6">
              
              {/* Subscription Status Card */}
              <Card className={isPro ? "border-primary/20 bg-primary/5" : ""}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" /> Subscription Details
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Current Plan</p>
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-2xl font-bold capitalize">{userData?.plan} Plan</h3>
                            {isPro && (
                                <Badge variant={subStatus === "ACTIVE" ? "default" : "destructive"} className={subStatus === "ACTIVE" ? "bg-green-600" : ""}>
                                    {subStatus}
                                </Badge>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {isPro ? "Premium features unlocked" : "Basic features only"}
                        </p>
                    </div>

                    {isPro && userData?.subscription && (
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-lg font-semibold">
                                    {userData.subscription.startTime 
                                        ? format(new Date(userData.subscription.startTime), "MMMM d, yyyy") 
                                        : "N/A"}
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                Payment via {userData.subscription.provider === 'paypal' ? <span className="font-bold text-blue-600">PayPal</span> : 'Paddle'}
                            </p>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="bg-muted/30 flex flex-col sm:flex-row gap-3 border-t">
                    {isPro && subStatus === "ACTIVE" ? (
                        <>
                            <Button variant="outline" onClick={handleManageSubscription}>
                                <ExternalLink className="mr-2 h-4 w-4" /> Manage Subscription
                            </Button>
                        </>
                    ) : (
                        <Button onClick={() => router.push('/pricing')} className="w-full sm:w-auto">
                            Upgrade to Pro
                        </Button>
                    )}
                </CardFooter>
              </Card>

              {/* Transaction History Note: Since the backend stores logs in 'payment_logs' but doesn't expose them in /user/profile yet, we show a placeholder or status */}
              <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <History className="h-5 w-5" /> Transaction Status
                    </CardTitle>
                    <CardDescription>
                        Payment records are processed securely via {userData?.subscription?.provider || "PayPal"}.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
                        {isPro ? (
                            <>
                                <div className="bg-green-100 dark:bg-green-900/20 p-3 rounded-full">
                                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                                </div>
                                <h3 className="text-lg font-medium">Subscription is Active</h3>
                                <p className="text-muted-foreground max-w-md">
                                    Your last payment was successful. For detailed invoices, please check your 
                                    {userData?.subscription?.provider === 'paypal' ? " PayPal " : " Payment Provider "} 
                                    dashboard.
                                </p>
                                <Button variant="outline" size="sm" onClick={handleManageSubscription} className="mt-2">
                                    View Invoices on PayPal
                                </Button>
                            </>
                        ) : (
                            <>
                                <div className="bg-muted p-3 rounded-full">
                                    <AlertCircle className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <h3 className="text-lg font-medium">No Recent Transactions</h3>
                                <p className="text-muted-foreground">
                                    You are currently on the Free plan. Upgrade to Pro to unlock features.
                                </p>
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
                        <CardTitle>Security & Privacy</CardTitle>
                        <CardDescription>Manage your account security settings.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="space-y-0.5">
                                <h4 className="font-medium text-sm">Two-Factor Authentication</h4>
                                <p className="text-xs text-muted-foreground">Add an extra layer of security.</p>
                            </div>
                            <Button variant="outline" size="sm" disabled>Coming Soon</Button>
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded-lg border-destructive/20 bg-destructive/5">
                            <div className="space-y-0.5">
                                <h4 className="font-medium text-sm text-destructive">Delete Account</h4>
                                <p className="text-xs text-destructive/80">Permanently remove your data and emails.</p>
                            </div>
                            <Button variant="destructive" size="sm">Delete Account</Button>
                        </div>
                    </CardContent>
                 </Card>
            </TabsContent>

          </Tabs>

        </div>
        
        {/* Modals */}
        <UpsellModal 
            isOpen={isUpsellOpen} 
            onClose={() => setIsUpsellOpen(false)} 
            featureName={upsellFeature} 
        />
      </div>
    </ThemeProvider>
  );
}