// app/dashboard/profile/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  User, Mail, Calendar, CreditCard, Download, 
  Loader2, Shield, Zap, ExternalLink, AlertTriangle, 
  CheckCircle2, XCircle, History
} from "lucide-react";
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
import { AppHeader } from "@/components/nLHeader"; // Assuming you have this
import { ThemeProvider } from "@/components/theme-provider";

// --- TYPES ---

interface Transaction {
  id: string;
  date: string;
  amount: string;
  currency: string;
  status: "COMPLETED" | "PENDING" | "FAILED" | "REFUNDED";
  description: string;
  invoiceId?: string;
  paymentMethod: "PAYPAL" | "PADDLE";
}

interface SubscriptionDetails {
  plan: "free" | "pro";
  status: "active" | "canceled" | "past_due" | "none";
  nextBillingDate?: string;
  amount?: string;
  interval?: "month" | "year";
  paypalSubscriptionId?: string;
}

// --- COMPONENT ---

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // State
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null);
  
  // Upsell State
  const [isUpsellOpen, setIsUpsellOpen] = useState(false);
  const [upsellFeature, setUpsellFeature] = useState("Pro Plan");

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth");
    }
  }, [status, router]);

  // Fetch Data (Simulating Backend Call to PayPal wrapper)
  useEffect(() => {
    if (status === "authenticated") {
      fetchUserData();
    }
  }, [status]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Subscription Details
      // In a real app, calls /api/user/subscription
      // which calls PayPal GET /v1/billing/subscriptions/{id}
      
      // Mocking Response delay
      await new Promise(r => setTimeout(r, 800));

      // MOCK DATA based on session plan
      const isPro = session?.user?.plan === 'pro';
      
      setSubscription({
        plan: isPro ? "pro" : "free",
        status: isPro ? "active" : "none",
        nextBillingDate: isPro ? new Date(Date.now() + 86400000 * 15).toISOString() : undefined, // 15 days from now
        amount: isPro ? "3.99" : "0.00",
        interval: "month",
        paypalSubscriptionId: isPro ? "I-BW452HL" : undefined
      });

      // 2. Fetch Transactions
      // In a real app, calls /api/user/transactions
      // which calls PayPal GET /v1/billing/subscriptions/{id}/transactions
      
      if (isPro) {
        setTransactions([
          {
            id: "TXN-98213",
            date: new Date().toISOString(),
            amount: "3.99",
            currency: "USD",
            status: "COMPLETED",
            description: "Pro Plan - Monthly",
            paymentMethod: "PAYPAL"
          },
          {
            id: "TXN-12345",
            date: new Date(Date.now() - 86400000 * 30).toISOString(), // 30 days ago
            amount: "3.99",
            currency: "USD",
            status: "COMPLETED",
            description: "Pro Plan - Monthly",
            paymentMethod: "PAYPAL"
          }
        ]);
      } else {
        setTransactions([]);
      }

    } catch (error) {
      console.error("Failed to load profile data", error);
      toast.error("Failed to load subscription details");
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = () => {
    if (subscription?.paypalSubscriptionId) {
        // In reality, redirect to your /api/paypal/manage endpoint or PayPal portal
        window.open(`https://www.paypal.com/myaccount/autopay/connect/${subscription.paypalSubscriptionId}`, '_blank');
    } else {
        router.push('/pricing');
    }
  };

  const downloadInvoice = (txnId: string) => {
    toast.success(`Downloading invoice ${txnId}...`);
    // Implement PDF generation logic here
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

  const user = session?.user;
  const isPro = subscription?.plan === "pro";

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
                                <AvatarImage src={user?.image || ""} />
                                <AvatarFallback className="text-lg bg-primary/5">{user?.name?.charAt(0) || "U"}</AvatarFallback>
                            </Avatar>
                            <div>
                                <CardTitle>{user?.name}</CardTitle>
                                <CardDescription className="flex items-center gap-2 mt-1">
                                    <Mail className="h-3.5 w-3.5" /> {user?.email}
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">User ID</p>
                                    <p className="text-sm font-mono bg-muted inline-block px-2 py-1 rounded select-all">
                                        {user?.id || "uid_123456789"}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">Member Since</p>
                                    <p className="text-sm">{format(new Date(), "MMMM d, yyyy")}</p>
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
                                    <span className="font-medium">{isPro ? "12%" : "45%"}</span>
                                </div>
                                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                    <div className="h-full bg-primary w-[12%] rounded-full" />
                                </div>
                                <p className="text-xs text-muted-foreground text-right">
                                    {isPro ? "600MB of 5GB" : "Temporary Storage"}
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
                        <CreditCard className="h-5 w-5" /> Subscription Plan
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Current Plan</p>
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-2xl font-bold capitalize">{subscription?.plan}</h3>
                            <Badge variant={subscription?.status === "active" ? "default" : "outline"} className={subscription?.status === "active" ? "bg-green-600" : ""}>
                                {subscription?.status}
                            </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {isPro ? `$${subscription?.amount} per ${subscription?.interval}` : "Free tier"}
                        </p>
                    </div>

                    {isPro && (
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">Next Billing Date</p>
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-lg font-semibold">
                                    {subscription?.nextBillingDate ? format(new Date(subscription.nextBillingDate), "MMMM d, yyyy") : "N/A"}
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Auto-renews via PayPal
                            </p>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="bg-muted/30 flex flex-col sm:flex-row gap-3 border-t">
                    {isPro ? (
                        <>
                            <Button variant="outline" onClick={handleManageSubscription}>
                                <ExternalLink className="mr-2 h-4 w-4" /> Manage on PayPal
                            </Button>
                            <Button variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                Cancel Subscription
                            </Button>
                        </>
                    ) : (
                        <Button onClick={() => router.push('/pricing')} className="w-full sm:w-auto">
                            Upgrade to Pro
                        </Button>
                    )}
                </CardFooter>
              </Card>

              {/* Transaction History */}
              <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <History className="h-5 w-5" /> Transaction History
                    </CardTitle>
                    <CardDescription>
                        Recent payments made to FreeCustom.Email via PayPal/Paddle.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead className="text-right">Invoice</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactions.length > 0 ? (
                                transactions.map((txn) => (
                                    <TableRow key={txn.id}>
                                        <TableCell className="font-medium">
                                            {format(new Date(txn.date), "MMM d, yyyy")}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span>{txn.description}</span>
                                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                   {txn.paymentMethod === 'PAYPAL' ? 'PayPal' : 'Card'} • {txn.id}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {txn.status === "COMPLETED" ? (
                                                <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 flex w-fit items-center gap-1">
                                                    <CheckCircle2 className="h-3 w-3" /> Paid
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
                                                    {txn.status}
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {txn.amount} {txn.currency}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => downloadInvoice(txn.id)}>
                                                <Download className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                        No transaction history found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
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