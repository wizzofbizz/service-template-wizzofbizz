import { db } from "./db";
import { blogPosts, blogCategories } from "../shared/schema";
import { eq } from "drizzle-orm";
import * as fs from 'fs';
import * as path from 'path';

async function seedBlogPost() {
  try {
    console.log("🌱 Seeding blog post...");

    // Get the Marketing category
    const categories = await db.select().from(blogCategories).where(eq(blogCategories.slug, 'marketing'));

    if (categories.length === 0) {
      throw new Error("Marketing category not found. Run migrations first.");
    }

    const categoryId = categories[0].id;
    console.log("✅ Found marketing category:", categoryId);

    // Read the HTML content from the blog post file
    const fullHtmlContent = fs.readFileSync(
      path.join(process.cwd(), 'docs/blog-posts/15-plumbing-marketing-ideas.html'),
      'utf-8'
    );

    // Split key takeaways from main content
    // Extract only the UL list content, not the wrapper div or h2 heading
    const keyTakeawaysMatch = fullHtmlContent.match(/<div class="key-takeaways">\s*<h2>.*?<\/h2>\s*(<ul>[\s\S]*?<\/ul>)\s*<\/div>/);
    const keyTakeawaysHtml = keyTakeawaysMatch ? keyTakeawaysMatch[1].trim() : '';
    
    // Remove the key takeaways section from the main content
    const htmlContent = fullHtmlContent.replace(/<div class="key-takeaways">[\s\S]*?<\/div>\n*/, '').trim();

    console.log("✅ Loaded HTML content:", htmlContent.substring(0, 100) + "...");
    console.log("✅ Extracted key takeaways length:", keyTakeawaysHtml.length);
    console.log("✅ Key takeaways content:", keyTakeawaysHtml);
    
    if (!keyTakeawaysHtml) {
      console.warn("⚠️  WARNING: Key takeaways not found in HTML!");
    }

    // Check if post already exists
    const existing = await db.select().from(blogPosts).where(eq(blogPosts.slug, '15-plumbing-marketing-ideas'));

    if (existing.length > 0) {
      console.log("⚠️  Post already exists, updating...");
      await db.update(blogPosts)
        .set({
          title: '15 Plumbing Marketing Ideas to Get More Business in 2025',
          excerpt: 'Discover 15 proven marketing strategies to grow your plumbing business in South Africa. From Google Business Profile optimization to referral programs, learn how to attract more customers.',
          content: htmlContent,
          featuredImageUrl: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=1920&q=80',
          metaTitle: '15 Plumbing Marketing Ideas to Get More Business | ServiceLoop',
          metaDescription: 'Proven plumbing marketing strategies for South African plumbers. Learn how to optimize Google Business Profile, automate follow-ups, and win more jobs with less effort.',
          metaKeywords: 'plumbing marketing ideas, plumber marketing strategies, google business profile for plumbers, plumbing lead generation, plumber customer reviews',
          authorName: 'ServiceLoop Team',
          categoryId,
          status: 'published',
          publishedAt: new Date(),
          readingTimeMinutes: 12,
          keyTakeaways: keyTakeawaysHtml,
          updatedAt: new Date(),
        })
        .where(eq(blogPosts.slug, '15-plumbing-marketing-ideas'));
    } else {
      console.log("➕ Creating new post...");
      await db.insert(blogPosts).values({
        slug: '15-plumbing-marketing-ideas',
        title: '15 Plumbing Marketing Ideas to Get More Business in 2025',
        excerpt: 'Discover 15 proven marketing strategies to grow your plumbing business in South Africa. From Google Business Profile optimization to referral programs, learn how to attract more customers.',
        content: htmlContent,
        featuredImageUrl: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=1920&q=80',
        metaTitle: '15 Plumbing Marketing Ideas to Get More Business | ServiceLoop',
        metaDescription: 'Proven plumbing marketing strategies for South African plumbers. Learn how to optimize Google Business Profile, automate follow-ups, and win more jobs with less effort.',
        metaKeywords: 'plumbing marketing ideas, plumber marketing strategies, google business profile for plumbers, plumbing lead generation, plumber customer reviews',
        authorName: 'ServiceLoop Team',
        categoryId,
        status: 'published',
        publishedAt: new Date(),
        readingTimeMinutes: 12,
        keyTakeaways: keyTakeawaysHtml,
      });
    }

    console.log("✅ Blog post seeded successfully!");

    // Verify it was inserted
    const verify = await db.select().from(blogPosts).where(eq(blogPosts.slug, '15-plumbing-marketing-ideas'));
    console.log("✅ Verification - found post:", verify.length > 0 ? verify[0].title : "NOT FOUND");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding blog post:", error);
    process.exit(1);
  }
}

seedBlogPost();