import Link from 'next/link';
import { blogClient } from '@/lib/blog-client';
import { Calendar, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Helper function to match your blog page date formatting
function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export async function PopularArticles() {
  // 1. Fetch data directly from the blogClient
  // We request page 1 with a limit of 4 posts
  const { posts } = await blogClient.getPosts({
    page: 1,
    limit: 4
  });

  return (
    <section className="my-14">
      <h2 className="mb-6 text-sm font-medium uppercase tracking-widest text-muted-foreground">Popular Articles</h2>

      <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
        {posts.map((post) => (
          <article key={post.slug} className="flex flex-col rounded-lg border border-border bg-card p-4 sm:p-5 transition-colors hover:border-primary/20">
            {post.category && (
              <Badge variant="secondary" className="mb-2 w-fit text-xs font-normal">
                {post.category.name}
              </Badge>
            )}

            <Link href={`/blog/${post.slug}`}>
              <h3 className="mb-1.5 text-base font-medium text-foreground hover:underline underline-offset-2">
                {post.title}
              </h3>
            </Link>

            <p className="flex-1 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {post.excerpt}
            </p>

            <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {formatDate(post.publishedAt)}
              </span>
              <Link href={`/blog/${post.slug}`} className="text-xs font-medium text-foreground underline-offset-2 hover:underline inline-flex items-center gap-0.5">
                Read <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}