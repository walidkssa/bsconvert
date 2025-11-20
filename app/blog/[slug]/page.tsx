'use client';

import { useEffect, useState } from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { blogPosts, BlogPost } from '@/lib/blog-posts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, ArrowLeft, Share2, Check } from 'lucide-react';
import BlogCTA from '@/components/blog/blog-cta';

export default function BlogArticle() {
  const params = useParams();
  const slug = params.slug as string;
  const [copied, setCopied] = useState(false);

  const post = blogPosts.find((p) => p.slug === slug);

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Article Not Found</h1>
          <p className="text-muted-foreground">The article you're looking for doesn't exist.</p>
          <Button asChild>
            <Link href="/blog">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Blog
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const handleShare = async () => {
    const shareData = {
      title: post.title,
      text: post.excerpt,
      url: `https://bsconvert.com/blog/${post.slug}`
    };

    // Try native share API first
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User cancelled or error occurred
        console.log('Share cancelled');
      }
    } else {
      // Fallback to copying link
      try {
        await navigator.clipboard.writeText(`https://bsconvert.com/blog/${post.slug}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy link');
      }
    }
  };

  return (
    <div className="min-h-screen">
      {/* Article Container - Clean & Apple-inspired */}
      <article className="max-w-3xl mx-auto px-6 py-20 md:py-28">
        {/* Back Button */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-10"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Resources
        </Link>

        {/* Category Badge */}
        <div className="mb-6">
          <Badge variant="outline" className="rounded-full text-xs font-medium">
            {post.category}
          </Badge>
        </div>

        {/* Title - Large, Bold & Readable */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-[1.1] bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text">
          {post.title}
        </h1>

        {/* Excerpt - Larger descriptive text */}
        <p className="text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed">
          {post.excerpt}
        </p>

        {/* Meta Info */}
        <div className="flex items-center justify-between pb-8 mb-10 border-b border-border/50">
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <time dateTime={post.publishedAt}>
                {new Date(post.publishedAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </time>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{post.readingTime}</span>
            </div>
          </div>

          {/* Share Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="gap-2 transition-all"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                <span className="hidden sm:inline">Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="h-4 w-4" />
                <span className="hidden sm:inline">Share</span>
              </>
            )}
          </Button>
        </div>

        {/* Article Content - Enhanced Typography avec espacement généreux */}
        <div className="prose prose-lg dark:prose-invert max-w-none
          prose-headings:font-bold prose-headings:tracking-tight
          prose-h2:text-3xl prose-h2:mt-20 prose-h2:mb-12 prose-h2:scroll-mt-20 prose-h2:leading-tight
          prose-h3:text-2xl prose-h3:mt-16 prose-h3:mb-8 prose-h3:scroll-mt-20 prose-h3:leading-snug
          prose-p:text-muted-foreground prose-p:leading-[1.8] prose-p:text-base prose-p:my-7
          prose-a:text-primary prose-a:no-underline prose-a:font-medium hover:prose-a:underline prose-a:transition-colors
          prose-strong:text-foreground prose-strong:font-semibold
          prose-ul:my-10 prose-ul:space-y-4 prose-li:text-muted-foreground prose-li:text-base prose-li:leading-relaxed
          prose-code:text-primary prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono
          prose-blockquote:border-l-primary prose-blockquote:bg-muted/30 prose-blockquote:py-3 prose-blockquote:px-6 prose-blockquote:rounded-r prose-blockquote:my-10
        ">
          <ArticleContent content={post.content} />
        </div>

        {/* Tags */}
        <div className="mt-14 pt-8 border-t border-border/50">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
            Topics
          </h3>
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground text-sm font-medium transition-colors"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </article>

      {/* CTA Section */}
      <BlogCTA />

      {/* JSON-LD Schema for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": post.title,
            "description": post.metaDescription,
            "author": {
              "@type": "Organization",
              "name": post.author
            },
            "publisher": {
              "@type": "Organization",
              "name": "BS Convert",
              "logo": {
                "@type": "ImageObject",
                "url": "https://bsconvert.com/logo.png"
              }
            },
            "datePublished": post.publishedAt,
            "dateModified": post.publishedAt,
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": `https://bsconvert.com/blog/${post.slug}`
            },
            "keywords": post.keywords.join(", "),
            "articleSection": post.category,
            "wordCount": post.content.split(' ').length
          })
        }}
      />
    </div>
  );
}

// Component to render markdown content with proper spacing and formatting
function ArticleContent({ content }: { content: string }) {
  if (!content || content === "") {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          Article content is being finalized. Check back soon!
        </p>
      </div>
    );
  }

  const lines = content.split('\n');
  const elements: React.ReactElement[] = [];
  let listItems: string[] = [];
  let definitionItems: { term: string; description: string }[] = [];
  let paragraphBuffer: string[] = [];
  let inDefinitionMode = false;
  let elementKey = 0;
  let skipNextEmptyLine = false; // Track if we should skip the next empty line (after headings)

  const flushParagraphBuffer = () => {
    if (paragraphBuffer.length > 0) {
      const combinedText = paragraphBuffer.join(' ');
      const html = combinedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      elements.push(
        <p key={`p-${elementKey++}`} dangerouslySetInnerHTML={{ __html: html }} />
      );
      paragraphBuffer = [];
    }
  };

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`ul-${elementKey++}`}>
          {listItems.map((item, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: item }} />
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  const flushDefinitions = () => {
    if (definitionItems.length > 0) {
      elements.push(
        <div key={`def-${elementKey++}`} className="my-12 space-y-6">
          {definitionItems.map((item, i) => (
            <div key={i} className="pl-0">
              <div className="font-bold text-foreground mb-3 text-base">
                {item.term}:
              </div>
              <div
                className="text-muted-foreground leading-[1.8] pl-0"
                dangerouslySetInnerHTML={{ __html: item.description }}
              />
            </div>
          ))}
        </div>
      );
      definitionItems = [];
      inDefinitionMode = false;
    }
  };

  lines.forEach((line) => {
    const trimmed = line.trim();

    // Empty line - handle specially based on context
    if (trimmed.length === 0) {
      // If we should skip this empty line (after a heading), do so
      if (skipNextEmptyLine) {
        skipNextEmptyLine = false;
        return; // Skip this iteration entirely
      }

      flushParagraphBuffer();
      flushList();
      if (!inDefinitionMode) {
        flushDefinitions();
      }
      return;
    }

    // H2 heading
    if (trimmed.startsWith('## ')) {
      flushParagraphBuffer();
      flushList();
      flushDefinitions();
      elements.push(
        <h2 key={`h2-${elementKey++}`} className="mt-6 mb-6">{trimmed.substring(3)}</h2>
      );
      skipNextEmptyLine = true; // Skip the next blank line after this heading
    }
    // H3 heading
    else if (trimmed.startsWith('### ')) {
      flushParagraphBuffer();
      flushList();
      flushDefinitions();
      elements.push(
        <h3 key={`h3-${elementKey++}`} className="mt-6 mb-6">{trimmed.substring(4)}</h3>
      );
      skipNextEmptyLine = true; // Skip the next blank line after this heading
    }
    // Bullet list item
    else if (trimmed.startsWith('- ')) {
      flushParagraphBuffer();
      flushDefinitions();
      skipNextEmptyLine = false;
      const itemContent = trimmed.substring(2).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      listItems.push(itemContent);
    }
    // Definition-style line: **Label**: description
    else if (/^\*\*[^*]+\*\*:/.test(trimmed)) {
      flushParagraphBuffer();
      flushList();
      skipNextEmptyLine = false;
      inDefinitionMode = true;

      const match = trimmed.match(/^\*\*([^*]+)\*\*:\s*(.*)$/);
      if (match) {
        const term = match[1];
        const description = match[2].replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        definitionItems.push({ term, description });
      }
    }
    // Regular text line - add to paragraph buffer
    else {
      flushList();
      if (inDefinitionMode) {
        flushDefinitions();
      }
      skipNextEmptyLine = false;
      const html = trimmed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      paragraphBuffer.push(html);
    }
  });

  // Flush any remaining buffers
  flushParagraphBuffer();
  flushList();
  flushDefinitions();

  return <>{elements}</>;
}
