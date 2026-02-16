// app/blog/[slug]/page.tsx
import { blogClient } from "@/lib/blog-client";
import { notFound } from "next/navigation";
import { CommentForm } from "@/components/blog/CommentForm";
import { Comment } from "@dishistech/blogs-sdk";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, User, Tag as TagIcon } from "lucide-react";
import Link from "next/link";
import './blog.scss'
import { AppHeader } from "@/components/nLHeader";
import { AppFooter } from "@/components/app-footer";
import { ThemeProvider } from "@/components/theme-provider";

function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
    const post = await blogClient.getPost(params.slug);
    if (!post) return { title: 'Post Not Found' };
    return {
        title: `${post.title} | FreeCustom.Email Blog`,
        description: post.excerpt,
        keywords: post.tags?.map(t => t.name) || []
    };
}

function CommentItem({ comment }: { comment: Comment }) {
    return (
        <div className="flex items-start space-x-4 py-6">
            <Avatar className="h-10 w-10 border">
                <AvatarImage src={`https://ui-avatars.com/api/?name=${comment.user.name}&background=random`} alt={comment.user.name || ''} />
                <AvatarFallback>{comment.user.name?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-foreground">{comment.user.name}</h4>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{comment.content}</p>
            </div>
        </div>
    );
}

export default async function SinglePostPage({ params }: { params: { slug: string } }) {
    const [post, comments] = await Promise.all([
        blogClient.getPost(params.slug),
        blogClient.getComments(params.slug)
    ]);

    if (!post) {
        notFound();
    }

    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <div className="min-h-screen max-w-[100vw] bg-background text-foreground flex flex-col">
                <AppHeader initialSession={null} />

                <main className="flex-1 w-full max-w-4xl mx-auto py-16 px-6">
                    <article>
                        <header className="mb-10 text-center space-y-6">
                            <div className="space-y-4">
                                {post.category && (
                                    <Link href={`/blog/categories/${post.category.slug}`}>
                                        <Badge variant="secondary" className="mb-2 hover:bg-secondary/80 transition-colors">
                                            {post.category.name}
                                        </Badge>
                                    </Link>
                                )}
                                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground">{post.title}</h1>
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

                                {/* Tags Display */}
                                {post.tags && post.tags.length > 0 && (
                                    <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                                        {post.tags.map(tag => (
                                            <Link key={tag.slug} href={`/blog/tags/${tag.slug}`}>
                                                <Badge variant="outline" className="text-xs hover:bg-muted cursor-pointer">
                                                    {tag.name}
                                                </Badge>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </header>

                        {/* Render post content */}
                        <div
                            className="prose prose-lg dark:prose-invert mx-auto ditb text-foreground leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: post.content || '' }}
                        />

                        {/* --- AUTHOR SECTION --- */}
                        <section className="mt-16 max-w-3xl mx-auto">
                            <div className="flex items-start gap-5 rounded-lg border bg-card px-6 py-6">
                                <Avatar className="h-16 w-16 border shrink-0">
                                    <AvatarImage
                                        src={post.author.image || `https://ui-avatars.com/api/?name=${post.author.name}&background=random`}
                                        alt={post.author.name || ''}
                                    />
                                    <AvatarFallback>{post.author.name?.charAt(0) || 'A'}</AvatarFallback>
                                </Avatar>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-base font-semibold text-foreground">{post.author.name}</span>
                                    </div>
                                    {post.author.bio && (
                                        <p className="text-sm text-muted-foreground leading-relaxed">{post.author.bio}</p>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* --- COMMENTS SECTION --- */}
                        <section id="comments" className="mt-20 max-w-3xl mx-auto">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-2xl font-bold tracking-tight">
                                    Discussion ({comments.length})
                                </h2>
                            </div>

                            <div className="space-y-2 divide-y divide-border rounded-lg border bg-card px-6">
                                {comments.length > 0 ? (
                                    comments.map(comment => <CommentItem key={comment.id} comment={comment} />)
                                ) : (
                                    <p className="text-muted-foreground py-8 text-center italic">No comments yet. Be the first to share your thoughts.</p>
                                )}
                            </div>

                            <CommentForm postSlug={params.slug} />
                        </section>
                    </article>
                </main>

                <AppFooter />
            </div>
        </ThemeProvider>
    );
}