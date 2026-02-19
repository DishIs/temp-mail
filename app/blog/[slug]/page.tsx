// app/blog/[slug]/page.tsx
import { blogClient } from "@/lib/blog-client";
import { notFound } from "next/navigation";
import { CommentForm } from "@/components/blog/CommentForm";
import { Comment } from "@dishistech/blogs-sdk";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import './blog.scss';
import { AppHeader } from "@/components/nLHeader";
import { AppFooter } from "@/components/app-footer";
import { ThemeProvider } from "@/components/theme-provider";
import { TableOfContents } from "@/components/blog/TableOfContents";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface Heading {
    id: string;
    text: string;
    level: number;
}

interface FAQ {
    question: string;
    answer: string;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

/** Build a slug-safe id from heading text */
function toId(text: string): string {
    return text
        .toLowerCase()
        .replace(/<[^>]+>/g, '')       // strip any inner tags
        .replace(/[^a-z0-9\s-]/g, '')  // remove special chars
        .trim()
        .replace(/\s+/g, '-');
}

/**
 * Inject id attributes into every <h2> and <h3> in the HTML string
 * so TOC anchor links work.
 */
function addHeadingIds(html: string): string {
    return html.replace(
        /<h([23])([^>]*)>([\s\S]*?)<\/h\1>/gi,
        (_, level, attrs, inner) => {
            const id = toId(inner);
            // avoid double-injecting ids if CMS already includes one
            if (/id=/i.test(attrs)) return `<h${level}${attrs}>${inner}</h${level}>`;
            return `<h${level}${attrs} id="${id}">${inner}</h${level}>`;
        }
    );
}

/**
 * Wrap every bare <table> in a .table-scroll-wrapper div so it scrolls
 * horizontally on narrow screens instead of breaking the layout.
 * Skips tables that are already wrapped to avoid double-wrapping.
 */
function wrapTables(html: string): string {
    // Match <table ...>...</table> blocks not already inside our wrapper
    return html.replace(
        /(?<!<div class="table-scroll-wrapper">)(<table[\s\S]*?<\/table>)/gi,
        '<div class="table-scroll-wrapper">$1</div>'
    );
}

/**
 * Parse <h2> and <h3> headings out of raw HTML.
 * Returns an array ordered as they appear in the document.
 */
function extractHeadings(html: string): Heading[] {
    const result: Heading[] = [];
    const re = /<h([23])[^>]*>([\s\S]*?)<\/h\1>/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(html)) !== null) {
        const text = m[2].replace(/<[^>]+>/g, '').trim();
        if (!text) continue;
        result.push({ level: parseInt(m[1], 10), text, id: toId(m[2]) });
    }
    return result;
}

/**
 * Extract FAQ question-answer pairs from the post HTML.
 *
 * Supports two common patterns from rich-text CMSes:
 *   Pattern A  (most common – TipTap/ProseMirror/Notion):
 *     <p><strong>Question?</strong><br ...>Answer text.</p>
 *
 *   Pattern B  (heading-style):
 *     <h3>Question?</h3><p>Answer text.</p>
 *
 * Looks only inside an FAQ section (after the last <h2>FAQ</h2>).
 */
function extractFAQs(html: string): FAQ[] {
    // Isolate the FAQ section – everything after the last FAQ heading
    const sectionMatch = html.match(/(<h[23][^>]*>\s*FAQ[^<]*<\/h[23]>)([\s\S]*)$/i);
    const scope = sectionMatch ? sectionMatch[2] : html;

    const faqs: FAQ[] = [];

    // Pattern A: <p><strong>Question</strong><br...>Answer</p>
    const patternA = /<p>\s*<strong>([\s\S]*?)<\/strong>\s*<br[^>]*>([\s\S]*?)<\/p>/gi;
    let m: RegExpExecArray | null;
    while ((m = patternA.exec(scope)) !== null) {
        const question = m[1].replace(/<[^>]+>/g, '').trim();
        const answer = m[2].replace(/<[^>]+>/g, '').trim();
        if (question && answer) faqs.push({ question, answer });
    }

    // Pattern B: <h3>Q</h3><p>A</p> (only if pattern A found nothing)
    if (faqs.length === 0) {
        const patternB = /<h3[^>]*>([\s\S]*?)<\/h3>\s*<p>([\s\S]*?)<\/p>/gi;
        while ((m = patternB.exec(scope)) !== null) {
            const question = m[1].replace(/<[^>]+>/g, '').trim();
            const answer = m[2].replace(/<[^>]+>/g, '').trim();
            if (question && answer) faqs.push({ question, answer });
        }
    }

    return faqs;
}

// ─────────────────────────────────────────────
// Metadata
// ─────────────────────────────────────────────

export async function generateMetadata({ params }: { params: { slug: string } }) {
    const post = await blogClient.getPost(params.slug);
    if (!post) return { title: 'Post Not Found' };

    return {
        title: `${post.title} | FreeCustom.Email Blog`,
        description: post.excerpt,
        keywords: post.tags?.map((t: { name: string }) => t.name) || [],
        openGraph: {
            title: post.title,
            description: post.excerpt,
            type: 'article',
            publishedTime: post.publishedAt,
            authors: [post.author.name],
        },
        twitter: {
            card: 'summary_large_image',
            title: post.title,
            description: post.excerpt,
        },
    };
}

// ─────────────────────────────────────────────
// Comment item
// ─────────────────────────────────────────────

function CommentItem({ comment }: { comment: Comment }) {
    return (
        <div className="flex items-start space-x-4 py-6">
            <Avatar className="h-10 w-10 border">
                <AvatarImage
                    src={`https://ui-avatars.com/api/?name=${comment.user.name}&background=random`}
                    alt={comment.user.name || ''}
                />
                <AvatarFallback>{comment.user.name?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
                <h4 className="text-sm font-semibold text-foreground">{comment.user.name}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{comment.content}</p>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default async function SinglePostPage({ params }: { params: { slug: string } }) {
    const [post, comments] = await Promise.all([
        blogClient.getPost(params.slug),
        blogClient.getComments(params.slug),
    ]);

    if (!post) notFound();

    // ── Process HTML once ──────────────────────────────────────────────
    const processedContent = wrapTables(addHeadingIds(post.content || ''));
    const headings = extractHeadings(post.content || '');
    const faqs = extractFAQs(post.content || '');

    // ── JSON-LD: Article ───────────────────────────────────────────────
    const articleJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.excerpt,
        datePublished: post.publishedAt,
        dateModified: post.updatedAt || post.publishedAt,
        author: {
            '@type': 'Person',
            name: post.author.name,
            ...(post.author.bio ? { description: post.author.bio } : {}),
        },
        publisher: {
            '@type': 'Organization',
            name: 'FreeCustom.Email',
            url: 'https://www.freecustom.email',
        },
        mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': `https://www.freecustom.email/blog/${params.slug}`,
        },
        ...(post.tags?.length
            ? { keywords: post.tags.map((t: { name: string }) => t.name).join(', ') }
            : {}),
        ...(post.featuredImage ? { image: post.featuredImage } : {}),
    };

    // ── JSON-LD: FAQPage (only if FAQs found) ─────────────────────────
    const faqJsonLd =
        faqs.length > 0
            ? {
                '@context': 'https://schema.org',
                '@type': 'FAQPage',
                mainEntity: faqs.map(({ question, answer }) => ({
                    '@type': 'Question',
                    name: question,
                    acceptedAnswer: {
                        '@type': 'Answer',
                        text: answer,
                    },
                })),
            }
            : null;

    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {/* ── Structured Data ──────────────────────────────────────── */}
            <Script
                id="article-jsonld"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
            />
            {faqJsonLd && (
                <Script
                    id="faq-jsonld"
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
                />
            )}

            <div className="min-h-screen max-w-[100vw] bg-background text-foreground flex flex-col">
                <AppHeader initialSession={null} />

                <main className="flex-1 w-full max-w-6xl mx-auto py-16 px-6">
                    {/*
                     *  Two-column layout on XL screens:
                     *    left  → article (prose)
                     *    right → sticky TOC sidebar
                     */}
                    <div className="flex gap-10 items-start">

                        {/* ── Article ────────────────────────────────────────── */}
                        <article className="flex-1 min-w-0 max-w-4xl">

                            {/* Header */}
                            <header className="mb-10 text-center space-y-6">
                                <div className="space-y-4">
                                    {post.category && (
                                        <Link href={`/blog/categories/${post.category.slug}`}>
                                            <Badge
                                                variant="secondary"
                                                className="mb-2 hover:bg-secondary/80 transition-colors"
                                            >
                                                {post.category.name}
                                            </Badge>
                                        </Link>
                                    )}
                                    <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground">
                                        {post.title}
                                    </h1>
                                </div>

                                <div className="flex flex-col items-center gap-4">
                                    <div className="flex items-center justify-center space-x-6 text-sm text-muted-foreground">
                                        <div className="flex items-center space-x-2">
                                            <User className="h-4 w-4" />
                                            <span>{post.author.name}</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Calendar className="h-4 w-4" />
                                            <span>{formatDate(post.publishedAt)}</span>
                                        </div>
                                    </div>

                                    {post.tags && post.tags.length > 0 && (
                                        <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                                            {post.tags.map((tag: { slug: string; name: string }) => (
                                                <Link key={tag.slug} href={`/blog/tags/${tag.slug}`}>
                                                    <Badge
                                                        variant="outline"
                                                        className="text-xs hover:bg-muted cursor-pointer"
                                                    >
                                                        {tag.name}
                                                    </Badge>
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </header>

                            {/* Featured image */}
                            {post.featuredImage && (
                                <div className="mb-10 max-w-4xl mx-auto rounded-xl overflow-hidden border border-border">
                                    <Image
                                        src={post.featuredImage}
                                        alt={post.title}
                                        width={1200}
                                        height={630}
                                        className="w-full h-auto object-cover"
                                        priority
                                    />
                                </div>
                            )}

                            {/* Post body */}
                            <div
                                className="prose prose-lg dark:prose-invert mx-auto ditb text-foreground leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: processedContent }}
                            />

                            {/* Author card */}
                            <section className="mt-16 max-w-3xl mx-auto">
                                <div className="flex items-start gap-5 rounded-lg border bg-card px-6 py-6">
                                    <Avatar className="h-16 w-16 border shrink-0">
                                        <AvatarImage
                                            src={
                                                post.author.image ||
                                                `https://ui-avatars.com/api/?name=${post.author.name}&background=random`
                                            }
                                            alt={post.author.name || ''}
                                        />
                                        <AvatarFallback>
                                            {post.author.name?.charAt(0) || 'A'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="space-y-1">
                                        <span className="text-base font-semibold text-foreground">
                                            {post.author.name}
                                        </span>
                                        {post.author.bio && (
                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                                {post.author.bio}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </section>

                            {/* FAQ section (semantic HTML for accessibility + SEO) */}
                            {faqs.length > 0 && (
                                <section
                                    aria-label="Frequently Asked Questions"
                                    className="mt-16 max-w-3xl mx-auto"
                                >
                                    <h2 className="text-2xl font-bold tracking-tight mb-6">
                                        Frequently Asked Questions
                                    </h2>
                                    <div className="divide-y divide-border rounded-lg border bg-card">
                                        {faqs.map(({ question, answer }, i) => (
                                            <details
                                                key={i}
                                                className="group px-6 py-4 cursor-pointer"
                                                /* open first item by default for rich-snippet visibility */
                                                {...(i === 0 ? { open: true } : {})}
                                            >
                                                <summary className="flex items-center justify-between text-sm font-semibold text-foreground list-none select-none gap-4">
                                                    <span>{question}</span>
                                                    <span className="ml-auto shrink-0 text-muted-foreground transition-transform group-open:rotate-180 text-lg leading-none">
                                                        ›
                                                    </span>
                                                </summary>
                                                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                                                    {answer}
                                                </p>
                                            </details>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Comments */}
                            <section id="comments" className="mt-20 max-w-3xl mx-auto">
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="text-2xl font-bold tracking-tight">
                                        Discussion ({comments.length})
                                    </h2>
                                </div>

                                <div className="space-y-2 divide-y divide-border rounded-lg border bg-card px-6">
                                    {comments.length > 0 ? (
                                        comments.map((comment: Comment) => (
                                            <CommentItem key={comment.id} comment={comment} />
                                        ))
                                    ) : (
                                        <p className="text-muted-foreground py-8 text-center italic">
                                            No comments yet. Be the first to share your thoughts.
                                        </p>
                                    )}
                                </div>

                                <CommentForm postSlug={params.slug} />
                            </section>
                        </article>

                        {/* ── Sticky Side TOC (desktop only) ─────────────────── */}
                        {headings.length >= 2 && (
                            <aside
                                className="hidden xl:block w-56 shrink-0 sticky top-24 self-start"
                                aria-label="Table of contents"
                            >
                                <TableOfContents headings={headings} />
                            </aside>
                        )}
                    </div>
                </main>

                <AppFooter />
            </div>
        </ThemeProvider>
    );
}