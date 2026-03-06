// components/popular-articles.tsx
import Link from 'next/link';
import { blogClient } from '@/lib/blog-client';
import { Calendar, ArrowRight, Tag } from 'lucide-react';

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

export async function PopularArticles() {
  const { posts } = await blogClient.getPosts({ page: 1, limit: 4 });

  return (
    <div>
      {/* Section label — same style as the main page's sub-labels */}
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-0">
        Popular Articles
      </p>

      {/* gap-px grid exactly like every other panel on the page */}
      <div className="rounded-lg border border-border overflow-hidden mt-3">
        <div className="grid gap-px bg-border sm:grid-cols-2">
          {posts.map((post, i) => (
            <article
              key={post.slug}
              className="group bg-background px-7 py-6 flex flex-col hover:bg-muted/10 transition-colors"
            >
              {/* Meta row */}
              <div className="flex items-center gap-2 mb-3">
                {/* Index */}
                <span className="font-mono text-xs text-border/70 font-bold select-none w-5 shrink-0">
                  {String(i + 1).padStart(2, '0')}
                </span>

                {post.category && (
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground border border-border px-1.5 py-0.5 rounded">
                    {post.category.name}
                  </span>
                )}

                <span className="flex items-center gap-1 text-[10px] text-muted-foreground/60 ml-auto shrink-0">
                  <Calendar className="h-2.5 w-2.5" />
                  {formatDate(post.publishedAt)}
                </span>
              </div>

              {/* Title */}
              <Link href={`/blog/${post.slug}`}>
                <h3 className="text-sm font-semibold text-foreground leading-snug mb-2 group-hover:underline underline-offset-4 decoration-border group-hover:decoration-foreground transition-all">
                  {post.title}
                </h3>
              </Link>

              {/* Excerpt */}
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed flex-1 mb-4">
                {post.excerpt}
              </p>

              {/* Footer row */}
              <div className="flex items-center justify-between border-t border-border pt-3 mt-auto">
                {/* Tags */}
                <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                  {post.tags?.slice(0, 2).map((tag) => (
                    <span
                      key={tag.slug}
                      className="flex items-center gap-0.5 text-[10px] text-muted-foreground/60 truncate"
                    >
                      <Tag className="h-2.5 w-2.5 shrink-0" />
                      {tag.name}
                    </span>
                  ))}
                </div>

                <Link
                  href={`/blog/${post.slug}`}
                  className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors shrink-0 ml-3"
                >
                  Read <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}