// app/blog/page.tsx
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Calendar, ChevronLeft, ChevronRight, Tag } from 'lucide-react';
import Link from 'next/link';
import { blogClient } from '@/lib/blog-client';
import { Post, Category } from '@dishistech/blogs-sdk';
import { AppFooter } from '@/components/app-footer';
import { AppHeader } from '@/components/nLHeader';
import { ThemeProvider } from '@/components/theme-provider';

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// Updated PostCard to show Tags
function PostCard({ post }: { post: Post }) {
  return (
    <Card className="flex flex-col h-full transition-all duration-300 border-muted hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start mb-2">
          {post.category && (
            <Link href={`/blog/categories/${post.category.slug}`}>
              <Badge variant="secondary" className="hover:bg-secondary/80">{post.category.name}</Badge>
            </Link>
          )}
        </div>
        <Link href={`/blog/${post.slug}`}>
          <CardTitle className="text-xl line-clamp-2 hover:text-primary transition-colors">
            {post.title}
          </CardTitle>
        </Link>
      </CardHeader>
      <CardContent className="flex-1 pb-3">
        <p className="text-muted-foreground line-clamp-3 text-sm mb-4">
          {post.excerpt}
        </p>

        {/* Tags in Card */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {post.tags.slice(0, 3).map(tag => (
              <Link key={tag.slug} href={`/blog/tags/${tag.slug}`}>
                <span className="inline-flex items-center text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full hover:text-foreground transition-colors">
                  <Tag className="w-3 h-3 mr-1" /> {tag.name}
                </span>
              </Link>
            ))}
            {post.tags.length > 3 && (
              <span className="text-[10px] text-muted-foreground self-center">+{post.tags.length - 3}</span>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-0 flex items-center justify-between text-xs text-muted-foreground border-t border-muted/40 p-4">
        <div className="flex items-center space-x-2">
          <Calendar className="h-3 w-3" />
          <span>{formatDate(post.publishedAt)}</span>
        </div>
        <Link href={`/blog/${post.slug}`}>
          <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
            Read <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

// Pagination Component
function PaginationControls({
  currentPage,
  totalPages,
  baseUrl
}: {
  currentPage: number,
  totalPages: number,
  baseUrl: string
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-center items-center space-x-2 mt-12">
      <Button
        variant="outline"
        size="sm"
        disabled={currentPage <= 1}
        asChild={currentPage > 1}
      >
        {currentPage > 1 ? (
          <Link href={`${baseUrl}?page=${currentPage - 1}`}>
            <ChevronLeft className="h-4 w-4 mr-2" />
          </Link>
        ) : (
          <span><ChevronLeft className="h-4 w-4 mr-2" /></span>
        )}
      </Button>

      <span className="text-sm text-muted-foreground font-medium px-4">
        Page {currentPage} of {totalPages}
      </span>

      <Button
        variant="outline"
        size="sm"
        disabled={currentPage >= totalPages}
        asChild={currentPage < totalPages}
      >
        {currentPage < totalPages ? (
          <Link href={`${baseUrl}?page=${currentPage + 1}`}>
            <ChevronRight className="h-4 w-4 ml-2" />
          </Link>
        ) : (
          <span><ChevronRight className="h-4 w-4 ml-2" /></span>
        )}
      </Button>
    </div>
  );
}

export default async function BlogPage({
  searchParams
}: {
  searchParams: { page?: string }
}) {
  const currentPage = Number(searchParams.page) || 1;
  const postsPerPage = 11;

  // Fetch posts with pagination
  const [postsResponse, categories] = await Promise.all([
    blogClient.getPosts({
      page: currentPage,
      limit: postsPerPage
    }),
    blogClient.getCategories(),
  ]);

  const allPosts = postsResponse.posts;
  const totalPages = postsResponse.pagination.pages || 1; // Assuming 'pages' property exists in SDK

  // Logic: Featured post is only the very first post on Page 1
  const showFeatured = currentPage === 1 && allPosts.length > 0;
  const featuredPost = showFeatured ? allPosts[0] : null;

  // If showing featured, remove it from the grid list. 
  // If on page 2+, show all posts in grid.
  const gridPosts = showFeatured ? allPosts.slice(1) : allPosts;

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen max-w-[100vw] bg-background text-foreground flex flex-col">
        <AppHeader initialSession={null} />

        <section className="bg-muted/30 py-20 border-b border-border">
          <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center space-y-6">
            <Badge variant="secondary" className="px-4 py-1 text-sm">Our Blog</Badge>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl">
              Insights & Updates
            </h1>
            <p className="text-lg leading-8 text-muted-foreground max-w-2xl mx-auto">
              Stay up to date with the latest developments in digital identity, developer tools, and platform updates.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 w-full flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">

            {/* Sidebar */}
            <aside className="lg:col-span-1 space-y-8">
              <Card className="border-muted bg-card">
                <CardHeader>
                  <CardTitle className="text-lg">Categories</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 p-3">
                  <Link href="/blog">
                    <Button variant="ghost" className="w-full justify-between font-normal hover:bg-muted">
                      All Posts
                      <Badge variant="secondary" className="ml-2 h-5 min-w-[1.25rem] px-1">
                        {postsResponse.pagination.total}
                      </Badge>
                    </Button>
                  </Link>
                  {categories.map((category: Category) => (
                    <Link key={category.slug} href={`/blog/categories/${category.slug}`}>
                      <Button variant="ghost" className="w-full justify-start font-normal hover:bg-muted">
                        {category.name}
                      </Button>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            </aside>

            {/* Main Content */}
            <main className="lg:col-span-3 space-y-12">

              {/* Featured Post - Only on Page 1 */}
              {featuredPost && (
                <section>
                  <h2 className="text-2xl font-bold tracking-tight mb-6">Featured Story</h2>
                  <Card className="overflow-hidden border-muted transition-all duration-300 hover:shadow-lg">
                    <div className="p-8">
                      <div className="flex flex-wrap gap-2 mb-4">
                        {featuredPost.category && <Badge>{featuredPost.category.name}</Badge>}
                        {featuredPost.tags && featuredPost.tags.slice(0, 3).map(t => (
                          <Badge key={t.slug} variant="outline" className="text-xs">{t.name}</Badge>
                        ))}
                      </div>
                      <Link href={`/blog/${featuredPost.slug}`}>
                        <h2 className="text-3xl font-bold mb-4 hover:text-primary transition-colors">
                          {featuredPost.title}
                        </h2>
                      </Link>
                      <p className="text-muted-foreground mb-6 text-lg leading-relaxed">
                        {featuredPost.excerpt}
                      </p>
                      <div className="flex items-center justify-between border-t pt-6">
                        <div className="flex items-center text-sm text-muted-foreground space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(featuredPost.publishedAt)}</span>
                        </div>
                        <Link href={`/blog/${featuredPost.slug}`}>
                          <Button>
                            Read Full Story <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                </section>
              )}

              {/* Post Grid */}
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold tracking-tight">
                    {currentPage === 1 ? "Recent Posts" : `Posts - Page ${currentPage}`}
                  </h2>
                </div>

                {gridPosts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {gridPosts.map((post: Post) => <PostCard key={post.slug} post={post} />)}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No more posts found.</p>
                )}

                {/* Pagination Controls */}
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  baseUrl="/blog"
                />
              </section>

            </main>
          </div>
        </div>
        <AppFooter />
      </div>
    </ThemeProvider>
  );
}