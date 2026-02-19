// app/blog/tags/page.tsx
import Link from 'next/link';
import { blogClient } from '@/lib/blog-client';
import { Tag } from '@dishistech/blogs-sdk';
import { Badge } from '@/components/ui/badge';
import { AppFooter } from '@/components/app-footer';
import { AppHeader } from '@/components/nLHeader';
import { ThemeProvider } from '@/components/theme-provider';

export const metadata = {
  title: 'All Tags | FreeCustom.Email Blog',
  description: 'Explore all tags and topics on the FreeCustom.Email blog.',
};

export default async function AllTagsPage() {
  const tags = await blogClient.getTags();

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen max-w-[100vw] bg-background text-foreground flex flex-col">
        <AppHeader initialSession={null} />
        
        <main className="flex-1 mx-auto max-w-5xl px-6 py-16 lg:px-8 w-full">
            <div className="text-center mb-16 space-y-4">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
                Explore Topics
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Dive into specific subjects by browsing our tag cloud.
            </p>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-3">
            {tags.map((tag: Tag) => (
                <Link key={tag.slug} href={`/blog/tags/${tag.slug}`}>
                    <Badge 
                        variant="secondary" 
                        className="px-4 py-2 text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
                    >
                        # {tag.name}
                    </Badge>
                </Link>
            ))}
            </div>
        </main>
        
        <AppFooter />
    </div>
    </ThemeProvider>
  );
}