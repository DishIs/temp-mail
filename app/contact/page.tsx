"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Send, Mail, MapPin } from "lucide-react";
import toast from "react-hot-toast";
import { AppHeader } from "@/components/nLHeader";
import { AppFooter } from "@/components/app-footer";
import { useSession } from "next-auth/react";
import { Turnstile } from "@marsidev/react-turnstile"; // Import Turnstile
import { ThemeProvider } from "@/components/theme-provider";

export default function ContactPage() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null); // State for token
  const turnstileRef = useRef<any>(null); // Ref to reset captcha

  const [formData, setFormData] = useState({
    name: session?.user?.name || "",
    email: session?.user?.email || "",
    subject: "",
    message: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
        toast.error("Please complete the security check.");
        return;
    }

    setIsLoading(true);
    const toastId = toast.loading("Sending message...");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, token }), // Send token
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to send message");

      toast.success("Message sent! We'll get back to you shortly.", { id: toastId });
      setFormData({ name: "", email: "", subject: "", message: "" });
      setToken(null);
      turnstileRef.current?.reset(); // Reset widget
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
      
      <main className="flex-1 container mx-auto px-4 py-12 max-w-5xl">
        <div className="grid md:grid-cols-2 gap-12 items-start">
          
          {/* Info Section (unchanged) */}
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-bold tracking-tight mb-4">Get in touch</h1>
              <p className="text-lg text-muted-foreground">
                Have questions about our API, Pro plans, or just want to say hi? We'd love to hear from you.
              </p>
            </div>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Email</h3>
                  <a href="mailto:support@freecustom.email" className="text-primary hover:underline font-medium">
                    support@freecustom.email
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Location</h3>
                  <p className="text-sm text-muted-foreground">
                    Based in India.<br/>Operating globally.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Form Section */}
          <Card className="border-muted shadow-lg">
            <CardHeader>
              <CardTitle>Send us a message</CardTitle>
              <CardDescription>We usually respond within 24 hours.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input 
                      id="name" 
                      placeholder="John Doe" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="john@example.com" 
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required 
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input 
                    id="subject" 
                    placeholder="How can we help?" 
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    required 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea 
                    id="message" 
                    placeholder="Tell us more..." 
                    className="min-h-[150px]"
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    required 
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
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                  Send Message
                </Button>
              </form>
            </CardContent>
          </Card>

        </div>
      </main>
      
      <AppFooter />
    </div>
    </ThemeProvider>
  );
}