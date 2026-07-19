
import type { Express, Request, Response } from "express";
import { db } from "../db";
import { blogPosts, blogCategories, blogTags, blogPostTags } from "../../shared/schema";
import { eq, desc, and, or, like, sql } from "drizzle-orm";
import { z } from "zod";

const blogPostSchema = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  title: z.string().min(1).max(255),
  excerpt: z.string().optional(),
  content: z.string().min(1),
  featuredImageUrl: z.string().url().optional(),
  metaTitle: z.string().max(60).optional(),
  metaDescription: z.string().optional(),
  metaKeywords: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  authorName: z.string().optional(),
  status: z.enum(['draft', 'published', 'scheduled', 'archived']).optional(),
  publishedAt: z.string().optional(),
  readingTimeMinutes: z.number().int().positive().optional(),
  tags: z.array(z.string()).optional(),
});

export function registerBlogRoutes(app: Express) {
  
  // Get all published blog posts (public)
  app.get("/api/blog/posts", async (req: Request, res: Response) => {
    try {
      const { category, tag, search, limit = 10, offset = 0 } = req.query;
      
      console.log("🔍 Blog API - Fetching posts with filters:", { category, tag, search, limit, offset });
      
      // First, let's check ALL posts regardless of status
      const allPosts = await db.select().from(blogPosts);
      console.log("📊 Total posts in database:", allPosts.length);
      console.log("📋 Post statuses:", allPosts.map(p => ({ slug: p.slug, status: p.status, publishedAt: p.publishedAt })));
      
      let query = db.select().from(blogPosts).where(eq(blogPosts.status, 'published'));
      
      if (category) {
        const cat = await db.query.blogCategories.findFirst({
          where: eq(blogCategories.slug, category as string)
        });
        console.log("🏷️ Category filter:", cat);
        if (cat) {
          query = query.where(eq(blogPosts.categoryId, cat.id));
        }
      }
      
      if (search) {
        query = query.where(
          or(
            like(blogPosts.title, `%${search}%`),
            like(blogPosts.excerpt, `%${search}%`),
            like(blogPosts.content, `%${search}%`)
          )
        );
      }
      
      const posts = await query
        .orderBy(desc(blogPosts.publishedAt))
        .limit(Number(limit))
        .offset(Number(offset));
      
      console.log("✅ Published posts found:", posts.length);
      if (posts.length > 0) {
        console.log("📄 First post:", { 
          slug: posts[0].slug, 
          title: posts[0].title, 
          status: posts[0].status,
          categoryId: posts[0].categoryId 
        });
      }
      
      // Get categories for each post
      const postsWithCategories = await Promise.all(
        posts.map(async (post) => {
          if (post.categoryId) {
            const category = await db.query.blogCategories.findFirst({
              where: eq(blogCategories.id, post.categoryId)
            });
            return { ...post, category };
          }
          return post;
        })
      );
      
      console.log("📦 Returning posts:", postsWithCategories.length);
      res.json(postsWithCategories);
    } catch (error) {
      console.error("❌ Error fetching blog posts:", error);
      res.status(500).json({ message: "Failed to fetch blog posts" });
    }
  });
  
  // Get single blog post by slug (public)
  app.get("/api/blog/posts/:slug", async (req: Request, res: Response) => {
    try {
      const post = await db.query.blogPosts.findFirst({
        where: eq(blogPosts.slug, req.params.slug)
      });
      
      if (!post) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      
      console.log("📄 Fetched blog post:", req.params.slug);
      console.log("📋 keyTakeaways field present:", !!post.keyTakeaways);
      console.log("📋 keyTakeaways length:", post.keyTakeaways?.length || 0);
      
      // Increment view count
      await db.update(blogPosts)
        .set({ viewCount: sql`${blogPosts.viewCount} + 1` })
        .where(eq(blogPosts.id, post.id));
      
      // Get category
      let category = null;
      if (post.categoryId) {
        category = await db.query.blogCategories.findFirst({
          where: eq(blogCategories.id, post.categoryId)
        });
      }
      
      res.json({ ...post, category });
    } catch (error) {
      console.error("Error fetching blog post:", error);
      res.status(500).json({ message: "Failed to fetch blog post" });
    }
  });
  
  // Get all blog categories (public)
  app.get("/api/blog/categories", async (_req: Request, res: Response) => {
    try {
      const categories = await db.query.blogCategories.findMany({
        where: eq(blogCategories.isActive, true),
        orderBy: [blogCategories.displayOrder]
      });
      
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });
  
  // Get posts by category (public)
  app.get("/api/blog/categories/:slug/posts", async (req: Request, res: Response) => {
    try {
      const category = await db.query.blogCategories.findFirst({
        where: eq(blogCategories.slug, req.params.slug)
      });
      
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      const posts = await db.query.blogPosts.findMany({
        where: and(
          eq(blogPosts.categoryId, category.id),
          eq(blogPosts.status, 'published')
        ),
        orderBy: [desc(blogPosts.publishedAt)]
      });
      
      res.json({ category, posts });
    } catch (error) {
      console.error("Error fetching category posts:", error);
      res.status(500).json({ message: "Failed to fetch category posts" });
    }
  });
  
  // Get related posts (public)
  app.get("/api/blog/posts/:slug/related", async (req: Request, res: Response) => {
    try {
      const post = await db.query.blogPosts.findFirst({
        where: eq(blogPosts.slug, req.params.slug)
      });
      
      if (!post || !post.categoryId) {
        return res.json([]);
      }
      
      // Get 3 recent posts from same category, excluding current post
      const relatedPosts = await db.query.blogPosts.findMany({
        where: and(
          eq(blogPosts.categoryId, post.categoryId),
          eq(blogPosts.status, 'published'),
          sql`${blogPosts.id} != ${post.id}`
        ),
        orderBy: [desc(blogPosts.publishedAt)],
        limit: 3
      });
      
      res.json(relatedPosts);
    } catch (error) {
      console.error("Error fetching related posts:", error);
      res.status(500).json({ message: "Failed to fetch related posts" });
    }
  });
}
