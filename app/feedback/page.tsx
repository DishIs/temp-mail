"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Star, MessageSquarePlus } from "lucide-react";
import toast from "react-hot-toast";
import { AppHeader } from "@/components/nLHeader";
import { AppFooter } from "@/components/app-footer";
import { cn } from "@/lib/utils";
import { Turnstile } from "@marsidev/react-turnstile"; // Import Turnstile
import { useSession } from "next-auth/react";
import { ThemeProvider } from "@/components/theme-provider";

export default function FeedbackPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [rating, setRating] = useState(0);
  const [token, setToken] = useState<string | null>(null);
  const turnstileRef = useRef<any>(null);
  const {data: session} = useSession()

  const [formData, setFormData] = useState({
    type: "general",
    email: "",
    message: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
        toast.error("Please select a rating star.");
        return;
    }
    if (!token) {
        toast.error("Please complete the security check.");
        return;
    }
    
    setIsLoading(true);
    const toastId = toast.loading("Sending feedback...");

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, rating, token }), // Send token
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to send feedback");

      toast.success("Thank you for your feedback!", { id: toastId });
      setFormData({ type: "general", email: "", message: "" });
      setRating(0);
      setToken(null);
      turnstileRef.current?.reset();
    } catch (error: any) {
      toast.error(error.message || "Something went wrong.", { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  return (

    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen max-w-[100vw] bg-background">
              <AppHeader initialSession={session} />
      
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg border-muted shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
                <MessageSquarePlus className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">We value your opinion</CardTitle>
            <CardDescription>
              Help us improve FreeCustom.Email. Report bugs, suggest features, or rate your experience.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Rating */}
              <div className="flex flex-col items-center gap-2">
                <Label>Rate your experience</Label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="focus:outline-none transition-transform hover:scale-110"
                    >
                      <Star 
                        className={cn(
                          "h-8 w-8 transition-colors", 
                          star <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"
                        )} 
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Type Selection */}
              <div className="space-y-2">
                <Label htmlFor="type">Feedback Type</Label>
                <Select 
                    value={formData.type} 
                    onValueChange={(val) => setFormData({...formData, type: val})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Feedback</SelectItem>
                    <SelectItem value="bug">Report a Bug</SelectItem>
                    <SelectItem value="feature">Feature Request</SelectItem>
                    <SelectItem value="billing">Billing Issue</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label htmlFor="message">Your Feedback</Label>
                <Textarea 
                  id="message" 
                  placeholder="What's on your mind?" 
                  className="min-h-[120px]"
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  required 
                />
              </div>

              {/* Email (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="email">Email (Optional)</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="If you'd like a reply..." 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>

              {/* Cloudflare Turnstile Widget */}
              <div className="flex justify-center py-2">
                  <Turnstile 
                      ref={turnstileRef}
                      siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!} 
                      onSuccess={setToken}
                  />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Submit Feedback
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
      
      <AppFooter />
    </div>
    </ThemeProvider>
  );
}