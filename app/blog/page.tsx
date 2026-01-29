// app/blog/page.tsx
import Link from 'next/link'
import { ThemeProvider } from '@/components/theme-provider'
import { AppHeader } from '@/components/nLHeader'
import { getBlogPosts } from '@/lib/posts'
import { getServerSession } from 'next-auth'
import { authOptions } from '../api/auth/[...nextauth]/route'

interface BlogPost {
  slug: string
  title: string
  date: string
  excerpt?: string
}


export default async function BlogPage() {
  const posts = getBlogPosts()
      const session = await getServerSession(authOptions);
  

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen max-w-[100vw] bg-background">
        <AppHeader initialSession={session} />
        <div className="max-w-2xl mx-auto px-2 sm:px-4 py-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-8 text-center bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">
            Blog Posts
          </h1>
          <ul className="space-y-6">
            {posts.map(post => (
              <li
                key={post.slug}
                className="bg-white/70 border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-150 p-5 flex flex-col gap-2 dark:bg-gray-900 dark:border-gray-800"
              >
                <Link href={`/blog/${post.slug}`} className="group">
                  <h2 className="text-lg sm:text-xl font-semibold group-hover:text-blue-600 transition-colors">
                    {post.title}
                  </h2>
                </Link>
                <p className="text-xs text-gray-400">{new Date(post.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                <p className="text-sm text-gray-700 line-clamp-2">{post.excerpt}</p>
                <div className="mt-2">
                  <Link
                    href={`/blog/${post.slug}`}
                    className="inline-block text-xs font-medium text-blue-500 hover:text-blue-700 transition-colors underline underline-offset-2"
                    aria-label={`Read more about ${post.title}`}
                  >
                    Read more →
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </ThemeProvider>
  )
}