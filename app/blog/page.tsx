import { Metadata } from 'next';
import Link from 'next/link';
import { blogPosts } from '@/lib/blog-posts';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock } from 'lucide-react';
import BlogCTA from '@/components/blog/blog-cta';

export const metadata: Metadata = {
  title: 'Blog - BS Convert | Bank Statement Conversion Guides & Tips',
  description: 'Expert guides on bank statement conversion, OCR automation, accounting software integration, and financial compliance. Learn how to save time and increase accuracy.',
  keywords: [
    'bank statement conversion',
    'accounting automation',
    'OCR bank statements',
    'QuickBooks integration',
    'Xero bank feeds',
    'FEC compliance',
    'accounting guides'
  ],
  openGraph: {
    title: 'Blog - BS Convert | Bank Statement Conversion Guides & Tips',
    description: 'Expert guides on bank statement conversion, OCR automation, accounting software integration, and financial compliance.',
    type: 'website',
    url: 'https://bsconvert.com/blog',
  },
};

export default function BlogPage() {
  // Sort posts by date (most recent first)
  const sortedPosts = [...blogPosts].sort((a, b) =>
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  return (
    <div className="min-h-screen">
      {/* Hero Section - Clean & Apple-like */}
      <section className="max-w-screen-xl mx-auto px-6 pt-28 pb-12 md:pt-36 md:pb-16">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text">
            Resources
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Expert guides on bank statement conversion, OCR automation, and accounting software integration.
          </p>
        </div>
      </section>

      {/* Blog Posts Grid - Clean & Spacious */}
      <section className="max-w-screen-xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {sortedPosts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group block"
            >
              <article className="h-full flex flex-col">
                {/* Minimal Card Image */}
                <div className="relative aspect-[16/9] bg-muted/40 rounded-xl overflow-hidden mb-5 group-hover:bg-muted/60 transition-all duration-300">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-7xl font-bold text-foreground/[0.03] select-none">
                      {post.category.charAt(0)}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="flex flex-col gap-3 flex-1">
                  {/* Category Badge */}
                  <div>
                    <Badge variant="outline" className="rounded-full text-xs font-medium">
                      {post.category}
                    </Badge>
                  </div>

                  {/* Title */}
                  <h2 className="text-xl md:text-2xl font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-2">
                    {post.title}
                  </h2>

                  {/* Excerpt */}
                  <p className="text-sm md:text-base text-muted-foreground leading-relaxed line-clamp-2 flex-1">
                    {post.excerpt}
                  </p>

                  {/* Meta */}
                  <div className="flex items-center gap-4 text-xs md:text-sm text-muted-foreground pt-1">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      <time dateTime={post.publishedAt}>
                        {new Date(post.publishedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </time>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{post.readingTime}</span>
                    </div>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <BlogCTA />
    </div>
  );
}
