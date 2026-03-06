// app/blog/categories/page.tsx
import Link from "next/link";
import { blogClient } from "@/lib/blog-client";
import { Category } from "@dishistech/blogs-sdk";
import { Code, Shield, Zap, Sparkles, ArrowRight } from "lucide-react";
import { AppFooter } from "@/components/app-footer";
import { AppHeader } from "@/components/nLHeader";
import { ThemeProvider } from "@/components/theme-provider";

const iconMap: { [key: string]: React.ElementType } = {
  development: Code,
  security:    Shield,
  product:     Zap,
  default:     Sparkles,
};

export const metadata = {
  title: "All Categories | FreeCustom.Email Blog",
  description: "Browse all topics and categories on the FreeCustom.Email blog.",
};

const DOT_BG = {
  backgroundImage: "radial-gradient(circle at 1px 1px, hsl(0 0% 50% / 0.1) 1px, transparent 0)",
  backgroundSize: "28px 28px",
} as const;

export default async function AllCategoriesPage() {
  const categories = await blogClient.getCategories();

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
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Categories</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-3">Browse by Category</h1>
              <p className="text-base text-muted-foreground max-w-xl leading-relaxed">
                Find articles on the topics that interest you most, from security protocols to product updates.
              </p>
            </div>

            {/* Category grid — gap-px panel style */}
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
                {categories.map((category: Category) => {
                  const Icon = iconMap[category.slug] || iconMap.default;
                  return (
                    <Link
                      key={category.slug}
                      href={`/blog/categories/${category.slug}`}
                      className="group bg-background px-6 py-6 hover:bg-muted/10 transition-colors flex items-start gap-4"
                    >
                      <div className="mt-0.5 shrink-0 h-8 w-8 rounded-md border border-border bg-muted/20 flex items-center justify-center">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground group-hover:underline underline-offset-4 decoration-border group-hover:decoration-foreground transition-all mb-1">
                          {category.name}
                        </p>
                        {category.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1 leading-relaxed">
                            {category.description}
                          </p>
                        )}
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-border group-hover:text-foreground transition-colors shrink-0 mt-0.5" />
                    </Link>
                  );
                })}
              </div>
            </div>
          </main>

          <AppFooter />
        </div>
      </div>
    </ThemeProvider>
  );
}