// app/blog/categories/page.tsx
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import { blogClient } from '@/lib/blog-client';
import { Category } from '@dishistech/blogs-sdk';
import { Code, Shield, Zap, Sparkles, FolderOpen } from 'lucide-react'; 
import { AppFooter } from '@/components/app-footer';
import { AppHeader } from '@/components/nLHeader';
import { ThemeProvider } from '@/components/theme-provider';

const iconMap: { [key: string]: React.ElementType } = {
  development: Code,
  security: Shield,
  product: Zap,
  default: Sparkles,
};

export const metadata = {
  title: 'All Categories | FreeCustom.Email Blog',
  description: 'Browse all topics and categories on the FreeCustom.Email blog.',
};

export default async function AllCategoriesPage() {
  const categories = await blogClient.getCategories();

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div className="min-h-screen max-w-[100vw] bg-background text-foreground flex flex-col">
          <AppHeader initialSession={null} />
          <main className="flex-1 mx-auto max-w-7xl px-6 py-16 lg:px-8 w-full">
            <div className="text-center mb-16 space-y-4">
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
                Browse by Category
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Find articles on the topics that interest you most, from security protocols to product updates.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category: Category) => {
                const Icon = iconMap[category.slug] || iconMap.default;
                return (
                  <Link key={category.slug} href={`/blog/categories/${category.slug}`}>
                    <Card className="h-full hover:bg-muted/50 transition-colors cursor-pointer border-muted">
                      <CardHeader className="flex flex-row items-center gap-4">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <Icon className="h-6 w-6" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">{category.name}</CardTitle>
                            {/* If categories have counts, display here. If not, use generic text or description */}
                            <CardDescription className="line-clamp-1 mt-1">
                                {category.description || "Explore posts"}
                            </CardDescription>
                        </div>
                      </CardHeader>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </main>
          <AppFooter />
        </div>
    </ThemeProvider>
  );
}