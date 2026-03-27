// app/contact/page.tsx
"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, Mail, MapPin } from "lucide-react";
import toast from "react-hot-toast";
import { AppHeader } from "@/components/nLHeader";
import { AppFooter } from "@/components/app-footer";
import { useSession } from "next-auth/react";
import { Turnstile } from "@marsidev/react-turnstile";
import { ThemeProvider } from "@/components/theme-provider";

const ASCII_FRAGS = [
  { x: "2%",  y: "10%", t: "EHLO api2.freecustom.email"     },
  { x: "68%", y: "8%",  t: "250 2.1.0 Ok"                   },
  { x: "1%",  y: "55%", t: "X-OTP: 847291"                  },
  { x: "70%", y: "52%", t: "RCPT TO:<inbox@ditapi.info>"    },
  { x: "2%",  y: "88%", t: "AUTH PLAIN"                      },
  { x: "68%", y: "85%", t: "MAIL FROM:<service@example.com>" },
];

const DOT_BG = {
  backgroundImage: "radial-gradient(circle at 1px 1px, hsl(0 0% 50% / 0.1) 1px, transparent 0)",
  backgroundSize: "28px 28px",
} as const;

export default function ContactPage() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [token,     setToken]     = useState<string | null>(null);
  const turnstileRef = useRef<any>(null);

  const [formData, setFormData] = useState({
    name:    session?.user?.name  || "",
    email:   session?.user?.email || "",
    subject: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) { toast.error("Please complete the security check."); return; }
    setIsLoading(true);
    const tid = toast.loading("Sending message…");
    try {
      const res  = await fetch("/api/contact", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send message");
      toast.success("Message sent! We'll get back to you shortly.", { id: tid });
      setFormData({ name: "", email: "", subject: "", message: "" });
      setToken(null);
      turnstileRef.current?.reset();
    } catch (err: any) {
      toast.error(err.message || "Something went wrong.", { id: tid });
    } finally { setIsLoading(false); }
  };

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen bg-background flex flex-col" style={DOT_BG}>
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

          <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-16 sm:py-24">
            {/* Header */}
            <div className="mb-16">
              <div className="flex items-center gap-2 mb-8">
                <div className="w-0.5 h-4 bg-border" aria-hidden />
                <span className="font-mono text-xs font-semibold">[ 01 / 01 ]</span>
                <span className="text-muted-foreground/50 text-xs">·</span>
                <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Contact</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-3">Get in touch</h1>
              <p className="text-base text-muted-foreground max-w-lg leading-relaxed">
                Have questions about our API, Pro plans, or just want to say hi? We'd love to hear from you.
              </p>
            </div>

            <div className="grid md:grid-cols-5 gap-16">
              {/* Left: contact info */}
              <div className="md:col-span-2">
                <div className="border-t border-border" />
                {[
                  { icon: Mail,    label: "Email",    value: "support@freecustom.email", href: "mailto:support@freecustom.email" },
                  { icon: MapPin,  label: "Location", value: "Based in India · Operating globally.", href: null },
                ].map(({ icon: Icon, label, value, href }) => (
                  <div key={label} className="border-t border-border py-5 flex items-start gap-4">
                    <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
                      {href
                        ? <a href={href} className="text-sm text-foreground underline underline-offset-4 decoration-border hover:decoration-foreground transition-colors">{value}</a>
                        : <p className="text-sm text-foreground leading-relaxed">{value}</p>
                      }
                    </div>
                  </div>
                ))}
              </div>

              {/* Right: form */}
              <div className="md:col-span-3">
                <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1">Send us a message</p>
                <p className="text-sm text-muted-foreground mb-6">We usually respond within 24 hours.</p>
                <div className="border-t border-border mb-8" />

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium uppercase tracking-widest text-muted-foreground mb-2">Name</label>
                      <Input placeholder="John Doe" value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                    </div>
                    <div>
                      <label className="block text-xs font-medium uppercase tracking-widest text-muted-foreground mb-2">Email</label>
                      <Input type="email" placeholder="john@example.com" value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium uppercase tracking-widest text-muted-foreground mb-2">Subject</label>
                    <Input placeholder="How can we help?" value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })} required />
                  </div>

                  <div>
                    <label className="block text-xs font-medium uppercase tracking-widest text-muted-foreground mb-2">Message</label>
                    <Textarea placeholder="Tell us more…" className="min-h-[140px] resize-none font-mono text-sm"
                      value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} required />
                  </div>

                  <div className="flex justify-center rounded-lg border border-border bg-muted/20 p-3">
                    <Turnstile ref={turnstileRef}
                      siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                      onSuccess={setToken}
                      options={{ theme: "auto", size: "flexible" }}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                    Send Message
                  </Button>
                </form>
              </div>
            </div>
          </main>

          <AppFooter />
        </div>
      </div>
    </ThemeProvider>
  );
}