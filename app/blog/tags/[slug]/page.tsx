// app/blog/tags/[slug]/page.tsx
import { blogClient } from "@/lib/blog-client";
import { notFound } from 'next/navigation';
import { Post } from "@dishistech/blogs-sdk";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Calendar, ArrowRight, Tag } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { AppHeader } from "@/components/nLHeader";
import { AppFooter } from "@/components/app-footer";
import { ThemeProvider } from "@/components/theme-provider";

function PostCard({ post }: { post: Post }) {
  return (
    <Card className="flex flex-col h-full hover:shadow-lg transition-all duration-300 border-muted">
      <CardHeader>
        <div className="flex justify-between items-start mb-2">
          {post.category && (
            <Link href={`/blog/categories/${post.category.slug}`}>
              <Badge variant="outline" className="hover:bg-muted transition-colors cursor-pointer">
                {post.category.name}
              </Badge>
            </Link>
          )}
        </div>
        <Link href={`/blog/${post.slug}`}>
          <CardTitle className="text-xl line-clamp-2 hover:text-primary transition-colors">
            {post.title}
          </CardTitle>
        </Link>
      </CardHeader>
      <CardContent className="flex-1 space-y-3">
        <p className="text-muted-foreground line-clamp-3 text-sm">
          {post.excerpt}
        </p>
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 items-center">
            <Tag className="h-3 w-3 text-muted-foreground shrink-0" />
            {post.tags.map((tag) => (
              <Link key={tag.slug} href={`/blog/tags/${tag.slug}`}>
                <Badge
                  variant="secondary"
                  className="text-xs hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
                >
                  {tag.name}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-0 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center space-x-2">
          <Calendar className="h-3 w-3" />
          <span>{formatDate(post.publishedAt)}</span>
        </div>
        <Link href={`/blog/${post.slug}`} className="flex items-center hover:text-foreground">
          Read <ArrowRight className="ml-1 h-3 w-3" />
        </Link>
      </CardFooter>
    </Card>
  );
}

export default async function SingleTagPage({ params }: { params: { slug: string } }) {
  const response = await blogClient.getTag(params.slug);

  if (!response || !response.tag) {
    notFound();
  }

  const { tag, posts } = response;

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen max-w-[100vw] bg-background text-foreground flex flex-col">
        <AppHeader initialSession={null} />
        <main className="flex-1 max-w-7xl mx-auto py-16 px-6 w-full">
          <header className="text-center mb-16 space-y-4">
            <Badge variant="secondary" className="mb-2">Tag</Badge>
            <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
              #{tag.name}
            </h1>
            {tag.description && (
              <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                {tag.description}
              </p>
            )}
          </header>

          {posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map(post => <PostCard key={post.slug} post={post} />)}
            </div>
          ) : (
            <div className="text-center py-20 bg-muted/30 rounded-lg border border-dashed">
              <p className="text-muted-foreground">No posts found for this tag.</p>
            </div>
          )}
        </main>
        <AppFooter />
      </div>
    </ThemeProvider>
  );
}