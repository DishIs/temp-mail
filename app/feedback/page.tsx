// app/feedback/page.tsx
"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, Star } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { AppHeader } from "@/components/nLHeader";
import { AppFooter } from "@/components/app-footer";
import { cn } from "@/lib/utils";
import { Turnstile } from "@marsidev/react-turnstile";
import { useSession } from "next-auth/react";
import { ThemeProvider } from "@/components/theme-provider";

// ─── bg ────────────────────────────────────────────────────────────────────────
const ASCII_FRAGS = [
  { x: "2%",  y: "8%",  t: "EHLO api2.freecustom.email" },
  { x: "68%", y: "6%",  t: "250 2.1.0 Ok"               },
  { x: "1%",  y: "48%", t: "X-OTP: 847291"              },
  { x: "70%", y: "45%", t: "RCPT TO:<inbox@ditapi.info>" },
  { x: "2%",  y: "88%", t: "AUTH PLAIN"                  },
  { x: "68%", y: "86%", t: "MAIL FROM:<service@example.com>" },
];

const DOT_BG = {
  backgroundImage:
    "radial-gradient(circle at 1px 1px, hsl(0 0% 50% / 0.1) 1px, transparent 0)",
  backgroundSize: "28px 28px",
} as const;

const FEEDBACK_TYPES = [
  { value: "general", label: "General Feedback" },
  { value: "bug",     label: "Report a Bug"     },
  { value: "feature", label: "Feature Request"  },
  { value: "billing", label: "Billing Issue"    },
];

export default function FeedbackPage() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [rating,    setRating]    = useState(0);
  const [hovered,   setHovered]   = useState(0);
  const [token,     setToken]     = useState<string | null>(null);
  const turnstileRef = useRef<any>(null);

  const [formData, setFormData] = useState({
    type:    "general",
    email:   "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) { toast.error("Please select a star rating."); return; }
    if (!token)       { toast.error("Please complete the security check."); return; }
    setIsLoading(true);
    const tid = toast.loading("Sending feedback…");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, rating, token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send feedback");
      toast.success("Thank you for your feedback!", { id: tid });
      setFormData({ type: "general", email: "", message: "" });
      setRating(0);
      setToken(null);
      turnstileRef.current?.reset();
    } catch (err: any) {
      toast.error(err.message || "Something went wrong.", { id: tid });
    } finally { setIsLoading(false); }
  };

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen bg-background flex flex-col" style={DOT_BG}>
        {/* ASCII bg */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none select-none z-0" aria-hidden>
          {ASCII_FRAGS.map((f, i) => (
            <span key={i} className="absolute font-mono text-[10px] text-foreground whitespace-nowrap"
              style={{ left: f.x, top: f.y, opacity: 0.04 }}>{f.t}</span>
          ))}
        </div>
        <div className="fixed inset-y-0 left-[max(0px,calc(50%-40rem))] w-px bg-border/50 pointer-events-none z-0" aria-hidden />
        <div className="fixed inset-y-0 right-[max(0px,calc(50%-40rem))] w-px bg-border/50 pointer-events-none z-0" aria-hidden />

        <div className="relative z-10 flex flex-col min-h-screen">
          <AppHeader initialSession={session} />

          <main className="flex-1 flex items-center justify-center px-6 py-16 sm:py-24">
            <div className="w-full max-w-lg">

              {/* Section marker */}
              <div className="flex items-center gap-2 mb-10">
                <div className="w-0.5 h-4 bg-border" aria-hidden />
                <span className="font-mono text-xs text-foreground font-semibold">[ 01 / 01 ]</span>
                <span className="text-muted-foreground/50 text-xs">·</span>
                <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Feedback</span>
              </div>

              <h1 className="text-4xl font-bold tracking-tight text-foreground mb-2">
                We value your opinion
              </h1>
              <p className="text-sm text-muted-foreground mb-10 leading-relaxed">
                Report bugs, suggest features, or rate your experience — every word matters.
              </p>

              <div className="border-t border-border mb-10" />

              <form onSubmit={handleSubmit} className="space-y-7">
                {/* Star rating */}
                <div>
                  <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3">
                    Rate your experience
                  </p>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHovered(star)}
                        onMouseLeave={() => setHovered(0)}
                        className="focus:outline-none transition-transform hover:scale-110"
                      >
                        <Star
                          className={cn(
                            "h-7 w-7 transition-all duration-150",
                            star <= (hovered || rating)
                              ? "fill-foreground text-foreground"
                              : "text-border",
                          )}
                        />
                      </button>
                    ))}
                  </div>
                  {rating > 0 && (
                    <p className="mt-2 text-xs text-muted-foreground font-mono">
                      {["", "Poor", "Fair", "Good", "Great", "Excellent"][rating]} · {rating}/5
                    </p>
                  )}
                </div>

                {/* Type */}
                <div>
                  <label className="block text-xs font-medium uppercase tracking-widest text-muted-foreground mb-2">
                    Feedback type
                  </label>
                  <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {FEEDBACK_TYPES.map(({ value, label }) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-xs font-medium uppercase tracking-widest text-muted-foreground mb-2">
                    Your feedback
                  </label>
                  <Textarea
                    placeholder="What's on your mind?"
                    className="min-h-[130px] resize-none font-mono text-sm bg-background"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                  />
                </div>

                {/* Email optional */}
                <div>
                  <label className="block text-xs font-medium uppercase tracking-widest text-muted-foreground mb-2">
                    Email{" "}
                    <span className="normal-case text-[10px] text-muted-foreground/60 tracking-normal">
                      (optional — if you'd like a reply)
                    </span>
                  </label>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    className="bg-background"
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                {/* Turnstile */}
                <div className="flex justify-center rounded-lg border border-border bg-muted/20 p-3">
                  <Turnstile
                    ref={turnstileRef}
                    siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                    onSuccess={setToken}
                    options={{ theme: "auto", size: "flexible" }}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit Feedback
                </Button>
              </form>
            </div>
          </main>

          <AppFooter />
        </div>
      </div>
    </ThemeProvider>
  );
}