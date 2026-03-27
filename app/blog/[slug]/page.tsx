// app/blog/[slug]/page.tsx
import { blogClient } from "@/lib/blog-client";
import { notFound } from "next/navigation";
import { Comment } from "@dishistech/blogs-sdk";
import { Calendar, User, Tag, ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import "./blog.scss";
import { AppHeader } from "@/components/nLHeader";
import { AppFooter } from "@/components/app-footer";
import { ThemeProvider } from "@/components/theme-provider";
import { TableOfContents } from "@/components/blog/TableOfContents";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Heading { id: string; text: string; level: number; }
interface FAQ     { question: string; answer: string; }

// ─── Helpers (all unchanged from original) ────────────────────────────────────
function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });
}

function toId(text: string): string {
  return text.toLowerCase().replace(/<[^>]+>/g, "").replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");
}

function addHeadingIds(html: string): string {
  return html.replace(/<h([23])([^>]*)>([\s\S]*?)<\/h\1>/gi, (_, level, attrs, inner) => {
    const id = toId(inner);
    if (/id=/i.test(attrs)) return `<h${level}${attrs}>${inner}</h${level}>`;
    return `<h${level}${attrs} id="${id}">${inner}</h${level}>`;
  });
}

function wrapTables(html: string): string {
  return html.replace(
    /(?<!<div class="table-scroll-wrapper">)(<table[\s\S]*?<\/table>)/gi,
    '<div class="table-scroll-wrapper">$1</div>',
  );
}

function extractHeadings(html: string): Heading[] {
  const result: Heading[] = [];
  const re = /<h([23])[^>]*>([\s\S]*?)<\/h\1>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const text = m[2].replace(/<[^>]+>/g, "").trim();
    if (text) result.push({ level: parseInt(m[1], 10), text, id: toId(m[2]) });
  }
  return result;
}

function extractFAQs(html: string): FAQ[] {
  const sectionMatch = html.match(
    /(<h[23][^>]*>\s*(?:FAQ|Frequently Asked Questions)[^<]*<\/h[23]>)([\s\S]*)$/i,
  );
  const scope = sectionMatch ? sectionMatch[2] : "";
  if (!scope) return [];

  const faqs: FAQ[] = [];
  const patternA = /<p>\s*<strong>([\s\S]*?)<\/strong>\s*(?:<br[^>]*>)?\s*([\s\S]*?)<\/p>/gi;
  let m: RegExpExecArray | null;
  while ((m = patternA.exec(scope)) !== null) {
    const question = m[1].replace(/<[^>]+>/g, "").trim();
    const answer   = m[2].replace(/<[^>]+>/g, "").trim();
    if (question && answer && question.endsWith("?") && answer.length > 10) faqs.push({ question, answer });
  }
  if (faqs.length === 0) {
    const patternB = /<h3[^>]*>([\s\S]*?)<\/h3>\s*<p>([\s\S]*?)<\/p>/gi;
    while ((m = patternB.exec(scope)) !== null) {
      const question = m[1].replace(/<[^>]+>/g, "").trim();
      const answer   = m[2].replace(/<[^>]+>/g, "").trim();
      if (question && answer && question.endsWith("?") && answer.length > 10) faqs.push({ question, answer });
    }
  }
  return faqs;
}

// ─── Metadata ─────────────────────────────────────────────────────────────────
export async function generateMetadata({ params }: { params: { slug: string } }) {
  const post = await blogClient.getPost(params.slug);
  if (!post) return { title: "Post Not Found" };
  return {
    title: `${post.title} | FreeCustom.Email Blog`,
    description: post.excerpt,
    keywords: post.tags?.map((t: { name: string }) => t.name) || [],
    openGraph: { title: post.title, description: post.excerpt, type: "article", publishedTime: post.publishedAt, authors: [post.author.name] },
    twitter: { card: "summary_large_image", title: post.title, description: post.excerpt },
  };
}

// ─── Comment item ─────────────────────────────────────────────────────────────
function CommentItem({ comment }: { comment: Comment }) {
  return (
    <div className="flex items-start gap-4 border-t border-border py-5">
      <Avatar className="h-8 w-8 border border-border shrink-0">
        <AvatarImage src={`https://ui-avatars.com/api/?name=${comment.user.name}&background=random`} alt={comment.user.name || ""} />
        <AvatarFallback className="text-xs font-mono">{comment.user.name?.charAt(0) || "U"}</AvatarFallback>
      </Avatar>
      <div>
        <p className="text-xs font-medium text-foreground mb-1">{comment.user.name}</p>
        <p className="text-sm text-muted-foreground leading-relaxed">{comment.content}</p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
const DOT_BG = {
  backgroundImage: "radial-gradient(circle at 1px 1px, hsl(0 0% 50% / 0.1) 1px, transparent 0)",
  backgroundSize: "28px 28px",
} as const;

export default async function SinglePostPage({ params }: { params: { slug: string } }) {
  const [post, comments] = await Promise.all([
    blogClient.getPost(params.slug),
    blogClient.getComments(params.slug),
  ]);
  if (!post) notFound();

  const processedContent = wrapTables(addHeadingIds(post.content || ""));
  const headings = extractHeadings(post.content || "");
  const faqs     = extractFAQs(post.content || "");

  const articleJsonLd = {
    "@context": "https://schema.org", "@type": "BlogPosting",
    headline: post.title, description: post.excerpt,
    datePublished: post.publishedAt, dateModified: post.updatedAt || post.publishedAt,
    author: { "@type": "Person", name: post.author.name, ...(post.author.bio ? { description: post.author.bio } : {}) },
    publisher: { "@type": "Organization", name: "FreeCustom.Email", url: "https://www.freecustom.email" },
    mainEntityOfPage: { "@type": "WebPage", "@id": `https://www.freecustom.email/blog/${params.slug}` },
    ...(post.tags?.length ? { keywords: post.tags.map((t: { name: string }) => t.name).join(", ") } : {}),
    ...(post.featuredImage ? { image: post.featuredImage } : {}),
  };

  const faqJsonLd = faqs.length > 0 ? {
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: faqs.map(({ question, answer }) => ({
      "@type": "Question", name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  } : null;

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <Script id="article-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      {faqJsonLd && <Script id="faq-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />}

      <div className="min-h-screen bg-background text-foreground flex flex-col" style={DOT_BG}>
        {/* Border columns */}
        <div className="fixed inset-y-0 left-[max(0px,calc(50%-45rem))] w-px bg-border/50 pointer-events-none z-0" aria-hidden />
        <div className="fixed inset-y-0 right-[max(0px,calc(50%-45rem))] w-px bg-border/50 pointer-events-none z-0" aria-hidden />

        <div className="relative z-10 flex flex-col min-h-screen">
          <AppHeader />

          {/* ── Post hero ────────────────────────────────────────────── */}
          <div className="border-b border-border">
            <div className="max-w-5xl mx-auto px-6 py-12 sm:py-16">
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 mb-8">
                <Link href="/blog" className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
                  <ArrowLeft className="h-3 w-3" /> Blog
                </Link>
                {post.category && (
                  <>
                    <span className="text-muted-foreground/40 text-xs">·</span>
                    <Link href={`/blog/categories/${post.category.slug}`} className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors border border-border rounded px-1.5 py-0.5">
                      {post.category.name}
                    </Link>
                  </>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-6 leading-tight max-w-4xl">
                {post.title}
              </h1>

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground border-t border-border pt-5">
                <span className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  {post.author.name}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(post.publishedAt)}
                </span>
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 ml-auto">
                    {post.tags.map((tag: { slug: string; name: string }) => (
                      <Link key={tag.slug} href={`/blog/tags/${tag.slug}`}
                        className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground border border-border rounded px-1.5 py-0.5 hover:text-foreground hover:border-foreground/30 transition-colors">
                        <Tag className="h-2.5 w-2.5" />{tag.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Main content ─────────────────────────────────────────── */}
          <main className="flex-1 max-w-5xl mx-auto px-6 py-12 w-full">
            <div className="flex gap-12 items-start">

              {/* Article */}
              <article className="flex-1 min-w-0">

                {/* Featured image */}
                {post.featuredImage && (
                  <div className="mb-10 rounded-lg overflow-hidden border border-border">
                    <Image src={post.featuredImage} alt={post.title}
                      width={1200} height={630} className="w-full h-auto object-cover" priority />
                  </div>
                )}

                {/* Body */}
                <div
                  className="prose prose-neutral dark:prose-invert ditb text-foreground leading-relaxed max-w-none"
                  dangerouslySetInnerHTML={{ __html: processedContent }}
                />

                {/* Author card */}
                <div className="mt-16 border-t border-border pt-8">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-5">Written by</p>
                  <div className="flex items-start gap-4">
                    <Avatar className="h-11 w-11 border border-border shrink-0">
                      <AvatarImage src={post.author.image || `https://ui-avatars.com/api/?name=${post.author.name}&background=random`} alt={post.author.name || ""} />
                      <AvatarFallback className="font-mono text-sm">{post.author.name?.charAt(0) || "A"}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold text-foreground mb-1">{post.author.name}</p>
                      {post.author.bio && <p className="text-sm text-muted-foreground leading-relaxed">{post.author.bio}</p>}
                    </div>
                  </div>
                </div>

                {/* FAQ */}
                {faqs.length > 0 && (
                  <section aria-label="Frequently Asked Questions" className="mt-16">
                    <div className="flex items-center gap-2 mb-6">
                      <div className="w-0.5 h-4 bg-border" aria-hidden />
                      <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">FAQ</span>
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight mb-6">Frequently Asked Questions</h2>
                    <div className="border border-border rounded-lg overflow-hidden divide-y divide-border">
                      {faqs.map(({ question, answer }, i) => (
                        <details key={i} className="group" {...(i === 0 ? { open: true } : {})}>
                          <summary className="flex items-center justify-between px-6 py-4 text-sm font-medium text-foreground list-none select-none cursor-pointer hover:bg-muted/10 transition-colors gap-4">
                            <span>{question}</span>
                            <span className="shrink-0 text-muted-foreground font-mono text-lg leading-none transition-transform group-open:rotate-45">+</span>
                          </summary>
                          <div className="px-6 pb-5 pt-1">
                            <p className="text-sm text-muted-foreground leading-relaxed">{answer}</p>
                          </div>
                        </details>
                      ))}
                    </div>
                  </section>
                )}

                {/* Comments */}
                <section id="comments" className="mt-16">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-0.5 h-4 bg-border" aria-hidden />
                    <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Discussion</span>
                    <span className="font-mono text-[10px] text-muted-foreground/50 border border-border rounded px-1.5 py-px">{comments.length}</span>
                  </div>

                  <div className="border border-border rounded-lg overflow-hidden">
                    {comments.length > 0 ? (
                      <div className="px-6 divide-y divide-border">
                        {comments.map((comment: Comment) => (
                          <CommentItem key={comment.id} comment={comment} />
                        ))}
                      </div>
                    ) : (
                      <div className="px-6 py-10 text-center">
                        <p className="text-sm text-muted-foreground">No comments yet. Be the first to share your thoughts.</p>
                      </div>
                    )}
                  </div>
                </section>

              </article>

              {/* Sticky TOC */}
              {headings.length >= 2 && (
                <aside className="hidden xl:block w-52 shrink-0 sticky top-24 self-start" aria-label="Table of contents">
                  <TableOfContents headings={headings} />
                </aside>
              )}
            </div>
          </main>

          <AppFooter />
        </div>
      </div>
    </ThemeProvider>
  );
}