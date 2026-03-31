// app/blog/page.tsx
import { ArrowRight, Calendar, ChevronLeft, ChevronRight, Tag } from "lucide-react";
import Link from "next/link";
import { blogClient } from "@/lib/blog-client";
import { Post, Category } from "@dishistech/blogs-sdk";
import { AppFooter } from "@/components/app-footer";
import { AppHeader } from "@/components/nLHeader";
import { ThemeProvider } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { HighlightSearch } from "@/components/highlight-search";
import { Suspense } from "react";

// ─── helpers ──────────────────────────────────────────────────────────────────
function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

const DOT_BG = {
  backgroundImage:
    "radial-gradient(circle at 1px 1px, hsl(0 0% 50% / 0.1) 1px, transparent 0)",
  backgroundSize: "28px 28px",
} as const;

const ASCII_FRAGS = [
  { x: "2%",  y: "5%",  t: "EHLO api2.freecustom.email"     },
  { x: "72%", y: "4%",  t: "250 2.1.0 Ok"                   },
  { x: "1%",  y: "55%", t: "RCPT TO:<inbox@ditmail.info>"    },
  { x: "72%", y: "53%", t: "X-OTP: 847291"                  },
  { x: "2%",  y: "92%", t: "AUTH PLAIN"                      },
  { x: "71%", y: "90%", t: "MAIL FROM:<service@example.com>" },
];

// ─── PostCard ─────────────────────────────────────────────────────────────────
function PostCard({ post, index }: { post: Post; index: number }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group block border-t border-border py-6 hover:bg-muted/10 transition-colors -mx-4 px-4"
    >
      <div className="flex items-start gap-5">
        {/* Index number */}
        <span className="font-mono text-3xl font-bold text-border/60 select-none w-10 shrink-0 leading-none mt-1">
          {String(index + 1).padStart(2, "0")}
        </span>

        <div className="flex-1 min-w-0">
          {/* Meta row */}
          <div className="flex items-center gap-3 mb-2">
            {post.category && (
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground border border-border px-2 py-0.5 rounded">
                {post.category.name}
              </span>
            )}
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {formatDate(post.publishedAt)}
            </span>
          </div>

          <h3 className="text-base font-semibold text-foreground leading-snug mb-1.5 group-hover:underline underline-offset-4 decoration-border group-hover:decoration-foreground transition-all">
            {post.title}
          </h3>

          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-3">
            {post.excerpt}
          </p>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {post.tags.slice(0, 4).map((tag) => (
                <span
                  key={tag.slug}
                  className="inline-flex items-center text-[10px] text-muted-foreground/70 gap-1"
                >
                  <Tag className="h-2.5 w-2.5" />
                  {tag.name}
                </span>
              ))}
              {post.tags.length > 4 && (
                <span className="text-[10px] text-muted-foreground/50">+{post.tags.length - 4}</span>
              )}
            </div>
          )}
        </div>

        <ArrowRight className="h-4 w-4 text-border shrink-0 mt-1 group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
      </div>
    </Link>
  );
}

// ─── Featured post ────────────────────────────────────────────────────────────
function FeaturedPost({ post }: { post: Post }) {
  return (
    <Link href={`/blog/${post.slug}`} className="group block mb-4">
      <div className="border border-border rounded-lg p-8 bg-muted/10 hover:bg-muted/20 transition-colors">
        <div className="flex items-center gap-3 mb-4">
          <span className="font-mono text-[10px] uppercase tracking-widest text-foreground border border-foreground/20 bg-foreground/5 px-2 py-0.5 rounded">
            Featured
          </span>
          {post.category && (
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              {post.category.name}
            </span>
          )}
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground ml-auto">
            <Calendar className="h-3 w-3" />
            {formatDate(post.publishedAt)}
          </span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3 leading-tight group-hover:underline underline-offset-4 decoration-border group-hover:decoration-foreground transition-all">
          {post.title}
        </h2>
        <p className="text-muted-foreground leading-relaxed mb-6 max-w-2xl">
          {post.excerpt}
        </p>

        <div className="flex items-center justify-between border-t border-border pt-4">
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.tags.slice(0, 3).map((t) => (
                <span key={t.slug} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Tag className="h-2.5 w-2.5" />{t.name}
                </span>
              ))}
            </div>
          )}
          <span className="flex items-center gap-1.5 text-sm font-medium text-foreground ml-auto group-hover:gap-2.5 transition-all">
            Read full story <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────
function PaginationControls({
  currentPage,
  totalPages,
  baseUrl,
}: {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex justify-center items-center gap-3 mt-16 border-t border-border pt-8">
      <Button variant="outline" size="sm" disabled={currentPage <= 1} asChild={currentPage > 1}>
        {currentPage > 1 ? (
          <Link href={`${baseUrl}?page=${currentPage - 1}`} className="gap-1.5">
            <ChevronLeft className="h-4 w-4" /> Prev
          </Link>
        ) : (
          <span className="gap-1.5"><ChevronLeft className="h-4 w-4" /> Prev</span>
        )}
      </Button>

      <span className="font-mono text-xs text-muted-foreground px-3 border border-border rounded px-2.5 py-1">
        {currentPage} / {totalPages}
      </span>

      <Button variant="outline" size="sm" disabled={currentPage >= totalPages} asChild={currentPage < totalPages}>
        {currentPage < totalPages ? (
          <Link href={`${baseUrl}?page=${currentPage + 1}`} className="gap-1.5">
            Next <ChevronRight className="h-4 w-4" />
          </Link>
        ) : (
          <span className="gap-1.5">Next <ChevronRight className="h-4 w-4" /></span>
        )}
      </Button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function BlogPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const currentPage  = Number(searchParams.page) || 1;
  const postsPerPage = 11;

  const [postsResponse, categories] = await Promise.all([
    blogClient.getPosts({ page: currentPage, limit: postsPerPage }),
    blogClient.getCategories(),
  ]);

  const allPosts   = postsResponse.posts;
  const totalPages = postsResponse.pagination.pages || 1;

  const showFeatured = currentPage === 1 && allPosts.length > 0;
  const featuredPost = showFeatured ? allPosts[0] : null;
  const gridPosts    = showFeatured ? allPosts.slice(1) : allPosts;
  const totalPosts   = postsResponse.pagination.total;

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen bg-background flex flex-col text-foreground" style={DOT_BG}>
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
          <AppHeader initialSession={null} />
          <Suspense fallback={null}>
            <HighlightSearch />
          </Suspense>

          {/* Hero */}
          <section className="border-b border-border">
            <div className="max-w-5xl mx-auto px-6 py-16 sm:py-24">
              <div className="flex items-center gap-2 mb-8">
                <div className="w-0.5 h-4 bg-border" aria-hidden />
                <span className="font-mono text-xs text-foreground font-semibold">[ 01 / 01 ]</span>
                <span className="text-muted-foreground/50 text-xs">·</span>
                <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Blog</span>
              </div>
              <h1 className="text-5xl sm:text-6xl font-bold tracking-tight mb-4">
                Insights &amp; Updates
              </h1>
              <p className="text-base text-muted-foreground max-w-xl leading-relaxed">
                Developer tools, platform news, and everything happening at FreeCustom.Email.
              </p>
            </div>
          </section>

          <div className="max-w-5xl mx-auto px-6 py-12 sm:py-16 w-full flex-1">
            <div className="grid lg:grid-cols-4 gap-14">

              {/* Sidebar */}
              <aside className="lg:col-span-1">
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
                  Categories
                </p>
                <div className="border-t border-border">
                  <Link
                    href="/blog"
                    className="flex items-center justify-between border-b border-border py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <span>All Posts</span>
                    <span className="font-mono text-xs text-muted-foreground/60">{totalPosts}</span>
                  </Link>
                  {categories.map((category: Category) => (
                    <Link
                      key={category.slug}
                      href={`/blog/categories/${category.slug}`}
                      className="flex items-center border-b border-border py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              </aside>

              {/* Main */}
              <main className="lg:col-span-3">
                {featuredPost && <FeaturedPost post={featuredPost} />}

                <div className="border-t border-border pt-2 mb-2 mt-8">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground py-4">
                    {currentPage === 1 ? "Recent Posts" : `Page ${currentPage}`}
                  </p>
                </div>

                {gridPosts.length > 0 ? (
                  <div>
                    {gridPosts.map((post: Post, i: number) => (
                      <PostCard key={post.slug} post={post} index={i} />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-8">No more posts found.</p>
                )}

                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  baseUrl="/blog"
                />
              </main>
            </div>
          </div>

          <AppFooter />
        </div>
      </div>
    </ThemeProvider>
  );
}