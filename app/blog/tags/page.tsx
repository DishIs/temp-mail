// app/blog/tags/page.tsx
import Link from "next/link";
import { blogClient } from "@/lib/blog-client";
import { Tag as TagType } from "@dishistech/blogs-sdk";
import { Tag, ArrowRight } from "lucide-react";
import { AppFooter } from "@/components/app-footer";
import { AppHeader } from "@/components/nLHeader";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata = {
  title: "All Tags | FreeCustom.Email Blog",
  description: "Explore all tags and topics on the FreeCustom.Email blog.",
};

const DOT_BG = {
  backgroundImage: "radial-gradient(circle at 1px 1px, hsl(0 0% 50% / 0.1) 1px, transparent 0)",
  backgroundSize: "28px 28px",
} as const;

export default async function AllTagsPage() {
  const tags = await blogClient.getTags();

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen bg-background text-foreground flex flex-col" style={DOT_BG}>
        <div className="fixed inset-y-0 left-[max(0px,calc(50%-40rem))] w-px bg-border/50 pointer-events-none z-0" aria-hidden />
        <div className="fixed inset-y-0 right-[max(0px,calc(50%-40rem))] w-px bg-border/50 pointer-events-none z-0" aria-hidden />

        <div className="relative z-10 flex flex-col min-h-screen">
          <AppHeader initialSession={null} />

          <main className="flex-1 max-w-5xl mx-auto px-6 py-16 sm:py-24 w-full">
            {/* Header */}
            <div className="mb-16">
              <div className="flex items-center gap-2 mb-8">
                <Link href="/blog" className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
                  ← Blog
                </Link>
                <span className="text-muted-foreground/40 text-xs">·</span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Tags</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-3">Explore Topics</h1>
              <p className="text-base text-muted-foreground max-w-xl leading-relaxed">
                Dive into specific subjects by browsing our full tag list.
              </p>
            </div>

            <div className="border-t border-border" />

            {/* Tag list — border-t row style */}
            <div className="divide-y divide-border">
              {tags.map((tag: TagType) => (
                <Link
                  key={tag.slug}
                  href={`/blog/tags/${tag.slug}`}
                  className="group flex items-center justify-between py-4 hover:bg-muted/10 -mx-4 px-4 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Tag className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                    <span className="text-sm font-medium text-foreground group-hover:underline underline-offset-4 decoration-border group-hover:decoration-foreground transition-all">
                      {tag.name}
                    </span>
                    {tag.slug && (
                      <span className="font-mono text-[10px] text-muted-foreground/40">
                        #{tag.slug}
                      </span>
                    )}
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-border group-hover:text-foreground transition-colors shrink-0" />
                </Link>
              ))}
            </div>
          </main>

          <AppFooter />
        </div>
      </div>
    </ThemeProvider>
  );
}