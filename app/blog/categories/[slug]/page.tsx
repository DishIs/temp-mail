// app/blog/categories/[slug]/page.tsx
import { blogClient } from "@/lib/blog-client";
import { notFound } from "next/navigation";
import { Post } from "@dishistech/blogs-sdk";
import Link from "next/link";
import { Calendar, ArrowRight, Tag } from "lucide-react";
import { AppHeader } from "@/components/nLHeader";
import { AppFooter } from "@/components/app-footer";
import { ThemeProvider } from "@/components/theme-provider";

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

const DOT_BG = {
  backgroundImage: "radial-gradient(circle at 1px 1px, hsl(0 0% 50% / 0.1) 1px, transparent 0)",
  backgroundSize: "28px 28px",
} as const;

function PostCard({ post, index }: { post: Post; index: number }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group bg-background px-7 py-6 flex flex-col hover:bg-muted/10 transition-colors"
    >
      {/* Meta */}
      <div className="flex items-center gap-2 mb-3">
        <span className="font-mono text-xs text-border/70 font-bold select-none w-5 shrink-0">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground/60 ml-auto">
          <Calendar className="h-2.5 w-2.5" />
          {formatDate(post.publishedAt)}
        </span>
      </div>

      <h3 className="text-sm font-semibold text-foreground leading-snug mb-2 group-hover:underline underline-offset-4 decoration-border group-hover:decoration-foreground transition-all">
        {post.title}
      </h3>

      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed flex-1 mb-4">
        {post.excerpt}
      </p>

      <div className="flex items-center justify-between border-t border-border pt-3 mt-auto">
        <div className="flex items-center gap-2 min-w-0 overflow-hidden">
          {post.tags?.slice(0, 2).map((tag) => (
            <span key={tag.slug} className="flex items-center gap-0.5 text-[10px] text-muted-foreground/60 truncate">
              <Tag className="h-2.5 w-2.5 shrink-0" />{tag.name}
            </span>
          ))}
        </div>
        <span className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors shrink-0 ml-3">
          Read <ArrowRight className="h-3 w-3" />
        </span>
      </div>
    </Link>
  );
}

export default async function SingleCategoryPage({ params }: { params: { slug: string } }) {
  const response = await blogClient.getCategory(params.slug);
  if (!response || !response.category) notFound();
  const { category, posts } = response;

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
                <Link href="/blog/categories" className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
                  Categories
                </Link>
                <span className="text-muted-foreground/40 text-xs">·</span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground border border-border rounded px-1.5 py-0.5">
                  {category.name}
                </span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-3">{category.name}</h1>
              {category.description && (
                <p className="text-base text-muted-foreground max-w-xl leading-relaxed">{category.description}</p>
              )}
            </div>

            {/* Posts grid */}
            {posts.length > 0 ? (
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="grid gap-px bg-border sm:grid-cols-2">
                  {posts.map((post: Post, i: number) => (
                    <PostCard key={post.slug} post={post} index={i} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="border border-border rounded-lg px-8 py-16 text-center">
                <p className="text-sm text-muted-foreground">No posts found in this category.</p>
              </div>
            )}
          </main>

          <AppFooter />
        </div>
      </div>
    </ThemeProvider>
  );
}