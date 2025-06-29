import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import MarkdownRenderer from '@/components/md-renderer'
import Link from 'next/link'
import Image from 'next/image'

interface BlogPostProps {
  params: Promise<{ slug: string }>
}

export default async function BlogPost({ params }: BlogPostProps) {
  const { slug } = await params
  const filePath = path.join(process.cwd(), 'content/blog', `${slug}.md`)
  const fileContent = fs.readFileSync(filePath, 'utf8')
  const { data, content } = matter(fileContent)

  return (
    <article className="max-w-full mx-auto px-4 py-12 bg-white dark:bg-zinc-900">
      <header className="mb-10">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight mb-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
          {data.title}
        </h1>
        <div className="flex items-center gap-4 mb-2">
          {data.author && (
            <div className="flex items-center gap-2">
              {data.author.avatar && (
                <Image
                  width={32}
                  height={32}
                  src={data.author.avatar}
                  alt={data.author.name}
                  className="w-8 h-8 rounded-full border-2 border-blue-400"
                />
              )}
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{data.author.name}</span>

            </div>
          )}
          <span className="text-xs text-gray-400">
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
      <section className="prose prose-lg ">
        <MarkdownRenderer content={content} />
      </section>
      <footer className="mt-12 border-t pt-6 flex justify-between text-sm text-gray-400">
        <span>© {new Date().getFullYear()} DishIs Technologies</span>
        <Link
          href="/blog"
          className="text-blue-500 hover:underline transition-colors"
        >
          ← Back to Blog
        </Link>
      </footer>
    </article>
  )
}