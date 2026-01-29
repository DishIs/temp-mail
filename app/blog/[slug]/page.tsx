// app/blog/[slug]/page.tsx
import MarkdownRenderer from '@/components/md-renderer'
import Link from 'next/link'
import Image from 'next/image'
import { ThemeProvider } from '@/components/theme-provider'
import { AppHeader } from '@/components/nLHeader'
import { getPostBySlug } from '@/lib/posts'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Script from 'next/script'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { getServerSession } from 'next-auth'


function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).replace(/\s+\S*$/, '') + '...';
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  try {
    const resolvedParams = await params;
    const { data } = await getPostBySlug(resolvedParams.slug);

    if (!data) {
      return {
        title: 'Post Not Found',
        description: 'The requested blog post could not be found.',
      };
    }

    return {
      title: truncate(data.title, 60),
      description: truncate(data.description, 150),
      alternates: {
        canonical: `https://www.freecustom.email/blog/${resolvedParams.slug}`,
      },
    };
  } catch {
    return {
      title: 'Post Not Found',
      description: 'The requested blog post could not be found.',
    };
  }
}


export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  let resolvedParams: { slug: string }
  const session = await getServerSession(authOptions);


  try {
    resolvedParams = await params
    const { data, content } = await getPostBySlug(resolvedParams.slug)

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": data.title,
      "datePublished": data.date,
      "author": {
        "@type": "Organization",
        "name": "FreeCustom.Email"
      },
      "publisher": {
        "@type": "Organization",
        "name": "FreeCustom.Email",
        "logo": {
          "@type": "ImageObject",
          "url": "https://www.freecustom.email/logo.webp"
        }
      },
      "description": data.description,
      "mainEntityOfPage": `https://www.freecustom.email/blog/${resolvedParams.slug}`
    }

    if (!data || !content) {
      throw new Error('Post not found')
    }

    return (
      <>
        <Script
          id="json-ld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div className="min-h-screen max-w-[100vw] bg-background">
            <AppHeader initialSession={session} />
            <article className="max-w-full mx-auto px-4 py-12 bg-white dark:bg-zinc-900">
              <header className="mb-10">
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight mb-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                  {data.title}
                </h1>
                <div className="flex items-center gap-4 mb-2">
                  {Array.isArray(data.author) ? (
                    data.author.map((author: { name: string; avatar?: string; bio: string }) => (
                      <div key={author.name} className="flex items-center gap-2">
                        {author.avatar && (
                          <Image
                            width={32}
                            height={32}
                            src={author.avatar}
                            alt={author.name}
                            className="w-8 h-8 rounded-full border-2 border-blue-400" />
                        )}
                        <div className='gap-1'>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{author.name}</span>
                          <p className='text-xs text-gray-600 dark:text-gray-400'>{author.bio}</p>
                        </div>
                      </div>
                    ))
                  ) : data.author ? (
                    <div className="flex items-center gap-2">
                      {data.author.avatar && (
                        <Image
                          width={32}
                          height={32}
                          src={data.author.avatar}
                          alt={data.author.name}
                          className="w-8 h-8 rounded-full border-2 border-blue-400" />
                      )}
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{data.author.name}</span>
                    </div>
                  ) : null}
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {new Date(data.date).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                {data.tags && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {data.tags.map((tag: string) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-xs font-semibold"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </header>
              <section className="prose prose-lg dark:prose-invert">
                <MarkdownRenderer content={content} />
              </section>
              <footer className="mt-12 border-t pt-6 flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>© {new Date().getFullYear()} DishIs Technologies</span>
                <Link
                  href="/blog"
                  className="text-blue-600 dark:text-blue-400 hover:underline transition-colors"
                >
                  ← Back to Blog
                </Link>
              </footer>
            </article>
          </div>
        </ThemeProvider>
      </>
    )
  } catch {
    // Redirect to 404 page
    notFound()
  }
}
