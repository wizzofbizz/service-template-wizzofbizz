import { useState, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { motion } from "framer-motion";
import { SEOMetaTags } from "@/components/SEOMetaTags";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { createArticleSchema } from "@/lib/structured-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Calendar, ArrowLeft, Share2, Orbit, Sparkles } from "lucide-react";
import { Footer } from "@/components/Footer";
import { FeatureNavigation } from "@/components/FeatureNavigation";

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  featuredImageUrl?: string;
  publishedAt: string;
  readingTimeMinutes: number;
  authorName: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  canonicalUrl?: string;
  keyTakeaways?: string;
  category?: {
    name: string;
    slug: string;
  };
}

export default function BlogPost() {
  const [, params] = useRoute("/blog/:slug");
  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showKeyTakeawaysSkeleton, setShowKeyTakeawaysSkeleton] = useState(true);

  useEffect(() => {
    if (params?.slug) {
      fetchPost(params.slug);
      fetchRelatedPosts(params.slug);
    }
  }, [params?.slug]);

  const fetchPost = async (slug: string) => {
    try {
      const response = await fetch(`/api/blog/posts/${slug}`);
      if (response.ok) {
        const data = await response.json();
        console.log("🔍 Frontend - Received blog post:", {
          slug: data.slug,
          hasKeyTakeaways: !!data.keyTakeaways,
          keyTakeawaysType: typeof data.keyTakeaways,
          keyTakeawaysLength: data.keyTakeaways?.length || 0,
          keyTakeawaysValue: data.keyTakeaways,
          allKeys: Object.keys(data)
        });
        setPost(data);
        
        // Simulate AI generating key takeaways with delay
        if (data.keyTakeaways) {
          setTimeout(() => {
            setShowKeyTakeawaysSkeleton(false);
          }, 2000); // 2 second delay to simulate AI generation
        }
      }
    } catch (error) {
      console.error("Error fetching post:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedPosts = async (slug: string) => {
    try {
      const response = await fetch(`/api/blog/posts/${slug}/related`);
      if (response.ok) {
        const data = await response.json();
        setRelatedPosts(data);
      }
    } catch (error) {
      console.error("Error fetching related posts:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-muted-foreground">Loading article...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Article Not Found</h1>
          <Link href="/blog">
            <Button>Back to Blog</Button>
          </Link>
        </div>
      </div>
    );
  }

  const canonicalUrl = post.canonicalUrl || `https://serviceloop.co.za/blog/${post.slug}`;
  const fontFamily = 'AxLLCircular, Helvetica, Arial, sans-serif';

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily }}>
      <SEOMetaTags
        title={post.metaTitle || `${post.title} | ServiceLoop Blog`}
        description={post.metaDescription || post.excerpt}
        keywords={post.metaKeywords || "service business, south africa"}
        canonicalUrl={canonicalUrl}
        ogImage={post.featuredImageUrl || "https://serviceloop.co.za/blog-og-image.png"}
        ogType="article"
        author={post.authorName}
        publishedTime={post.publishedAt}
        structuredData={createArticleSchema(
          post.title,
          post.excerpt,
          post.authorName,
          post.publishedAt,
          post.publishedAt,
          post.featuredImageUrl,
          post.metaKeywords?.split(',').map(k => k.trim())
        )}
      />

      {/* Header Navigation */}
      <FeatureNavigation />

      <article className="container mx-auto px-6 py-8 max-w-4xl mt-24">
        <Breadcrumbs
          items={[
            { name: "Blog", url: "/blog" },
            { name: post.category?.name || "Article", url: `/blog?category=${post.category?.slug}` },
            { name: post.title }
          ]}
        />

        {/* Article Header */}
        <header className="mb-8">
          {post.category && (
            <Badge variant="secondary" className="mb-4">
              {post.category.name}
            </Badge>
          )}
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{post.title}</h1>

          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{new Date(post.publishedAt).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{post.readingTimeMinutes} min read</span>
            </div>
            <span>By {post.authorName}</span>
          </div>
        </header>

        {/* Key Takeaways */}
        {post.keyTakeaways && (
          <div className="border-2 rounded-lg p-6 mb-8 relative overflow-hidden" 
            style={{ 
              borderColor: '#612fff',
              backgroundColor: '#f5f3ff'
            }}
          >
            {/* Animated gradient background */}
            <div
              className="absolute inset-0 opacity-30"
              style={{
                background: 'radial-gradient(circle at top left, rgba(97, 47, 255, 0.15) 0%, transparent 50%)'
              }}
            />
            
            <div className="relative z-10">
              <div className="flex items-start gap-3 mb-4">
                <Sparkles className="h-5 w-5 flex-shrink-0" style={{ color: '#612fff' }} />
                <h2 className="text-xl font-bold" style={{ 
                  fontFamily,
                  color: '#612fff'
                }}>
                  Key takeaways:
                </h2>
              </div>
              
              {showKeyTakeawaysSkeleton ? (
                // Skeleton loader to simulate AI generation
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Skeleton className="h-2 w-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: 'rgba(97, 47, 255, 0.2)' }} />
                    <Skeleton className="h-4 w-full" style={{ backgroundColor: 'rgba(97, 47, 255, 0.2)' }} />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-2 w-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: 'rgba(97, 47, 255, 0.2)' }} />
                    <Skeleton className="h-4 w-11/12" style={{ backgroundColor: 'rgba(97, 47, 255, 0.2)' }} />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-2 w-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: 'rgba(97, 47, 255, 0.2)' }} />
                    <Skeleton className="h-4 w-full" style={{ backgroundColor: 'rgba(97, 47, 255, 0.2)' }} />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-2 w-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: 'rgba(97, 47, 255, 0.2)' }} />
                    <Skeleton className="h-4 w-10/12" style={{ backgroundColor: 'rgba(97, 47, 255, 0.2)' }} />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-2 w-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: 'rgba(97, 47, 255, 0.2)' }} />
                    <Skeleton className="h-4 w-full" style={{ backgroundColor: 'rgba(97, 47, 255, 0.2)' }} />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-2 w-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: 'rgba(97, 47, 255, 0.2)' }} />
                    <Skeleton className="h-4 w-11/12" style={{ backgroundColor: 'rgba(97, 47, 255, 0.2)' }} />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-2 w-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: 'rgba(97, 47, 255, 0.2)' }} />
                    <Skeleton className="h-4 w-9/12" style={{ backgroundColor: 'rgba(97, 47, 255, 0.2)' }} />
                  </div>
                </div>
              ) : (
                // Actual content with fade-in animation
                <motion.div 
                  className="prose prose-sm max-w-none [&_ul]:space-y-2 [&_li]:mb-2 [&_strong]:font-semibold"
                  style={{ 
                    fontFamily,
                    color: '#1f2937'
                  }}
                  dangerouslySetInnerHTML={{ __html: post.keyTakeaways }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                />
              )}
            </div>
          </div>
        )}

        {/* Article Content */}
        <div 
          className="prose prose-lg max-w-none mb-12 
                     prose-headings:font-bold prose-headings:text-gray-900
                     prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-4
                     prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-3
                     prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4
                     prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                     prose-strong:text-gray-900 prose-strong:font-semibold
                     prose-ul:my-6 prose-ul:list-disc prose-ul:pl-6
                     prose-li:my-0 prose-li:text-gray-700
                     prose-code:bg-gray-100 prose-code:px-1 prose-code:rounded"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Share Buttons */}
        <div className="border-t border-b py-6 mb-12">
          <div className="flex items-center gap-4">
            <span className="font-semibold">Share this article:</span>
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>

        {/* CTA Section */}
        <Card className="bg-primary text-primary-foreground mb-12">
          <CardHeader>
            <CardTitle>Ready to streamline your service business?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Get started with ServiceLoop today and transform how you manage quotes, jobs, and customers.
            </p>
            <Link href="/register">
              <Button variant="secondary">Start Free Trial</Button>
            </Link>
          </CardContent>
        </Card>

        {/* Related Articles */}
        {relatedPosts.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Related Articles</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {relatedPosts.map((related) => (
                <Link key={related.id} href={`/blog/${related.slug}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <CardTitle className="text-lg line-clamp-2">
                        {related.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{related.readingTimeMinutes} min read</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>

      <Footer />
    </div>
  );
}