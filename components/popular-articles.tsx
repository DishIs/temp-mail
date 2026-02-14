import Link from 'next/link';
import { blogClient } from '@/lib/blog-client';
import { Calendar, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
    <section className="my-12">
      <h2 className="mb-8 text-center text-3xl font-bold">Popular Articles</h2>
      
      <div className="grid gap-6 md:grid-cols-2">
        {posts.map((post) => (
          <div key={post.slug} className="flex flex-col rounded-lg border bg-card p-4 shadow-sm transition-all hover:shadow-md">
            
            {/* Category Badge (Optional, added for consistency with your blog page) */}
            <div className="mb-2">
               {post.category && (
                  <Badge variant="secondary" className="text-xs">
                    {post.category.name}
                  </Badge>
               )}
            </div>

            <Link href={`/blog/${post.slug}`}>
              <h3 className="mb-2 text-xl font-semibold hover:text-primary transition-colors">
                {post.title}
              </h3>
            </Link>
            
            <p className="flex-1 text-sm text-muted-foreground line-clamp-2">
              {post.excerpt}
            </p>
            
            <div className="mt-4 flex items-center justify-between border-t pt-4">
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(post.publishedAt)}</span>
              </div>
              
              <Link href={`/blog/${post.slug}`}>
                <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                  Read <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}