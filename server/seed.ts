import "dotenv/config";
import { db } from "./db";
import * as schema from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

async function seed() {
  // Demo data must never land in a live client database.
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_PRODUCTION_SEED !== "true") {
    throw new Error(
      "Refusing to seed demo data with NODE_ENV=production. " +
      "Set ALLOW_PRODUCTION_SEED=true only if you genuinely intend this."
    );
  }

  console.log("🌱 Seeding database...");

  // Check if demo business already exists
  const existingBusiness = await db.select()
    .from(schema.businesses)
    .where(eq(schema.businesses.slug, "demo"))
    .limit(1);

  let business;

  if (existingBusiness.length > 0) {
    console.log("ℹ️ Demo business already exists, using existing business");
    business = existingBusiness[0];
  } else {
    // Create demo business
    const [newBusiness] = await db.insert(schema.businesses).values({
      businessName: "Demo Professional Services",
      slug: "demo",
      email: "demo@example.com",
      phone: "+27 123 456 789",
      industry: "Professional Services",
      ownerName: "Demo Owner",
      addressLine1: "123 Business Street",
      city: "Cape Town",
      province: "Western Cape",
      postalCode: "8001",
      businessDescription: "Quality professional services you can trust",
      websiteStatus: "published",
      subscriptionStatus: "active",
      subscriptionTier: "premium",
    }).returning();

    console.log("✅ Created demo business:", newBusiness.slug);
    business = newBusiness;
  }

  // Check if demo user already exists
  const existingUser = await db.select()
    .from(schema.users)
    .where(eq(schema.users.email, "demo@example.com"))
    .limit(1);

  if (existingUser.length === 0) {
    // Seed password comes from env. There is deliberately no hardcoded default:
    // a known owner-role credential must never ship in a resold template.
    const seedPassword = process.env.SEED_ADMIN_PASSWORD;
    if (!seedPassword) {
      throw new Error(
        "SEED_ADMIN_PASSWORD is not set. Set it to a strong value before seeding, e.g.\n" +
        '  SEED_ADMIN_PASSWORD="$(node -e \'console.log(require("crypto").randomBytes(18).toString("base64url"))\')" npm run db:seed'
      );
    }
    if (seedPassword.length < 12) {
      throw new Error("SEED_ADMIN_PASSWORD must be at least 12 characters.");
    }
    const passwordHash = await bcrypt.hash(seedPassword, 10);
    const [user] = await db.insert(schema.users).values({
      businessId: business.id,
      email: "demo@example.com",
      passwordHash,
      fullName: "Demo User",
      role: "owner",
    }).returning();

    console.log("✅ Created demo user:", user.email);
  } else {
    console.log("ℹ️ Demo user already exists");
  }

  // Delete existing landing page content for this business
  await db.delete(schema.landingPageContent)
    .where(eq(schema.landingPageContent.businessId, business.id));

  console.log("🗑️ Cleared existing landing page content");
  // Landing page content.
  //
  // The public site (client/src/pages/business-landing.tsx) looks these up by
  // (section, elementKey). Keys must match exactly, and `value` is a plain
  // string — not JSON. Services use item_N_heading / item_N_description.
  const text = (
    section: string,
    elementKey: string,
    value: string,
    displayOrder: number
  ) => ({
    businessId: business.id,
    section,
    elementKey,
    contentType: "text",
    value,
    displayOrder,
    isActive: true,
  });

  const landingPageData = [
    // Hero
    text("hero", "heading", "Professional Services You Can Trust", 1),
    text("hero", "subheading", "Book online in minutes. Clear pricing, no surprises.", 2),
    text("hero", "cta_button", "Get a Quote", 3),
    {
      businessId: business.id,
      section: "hero",
      elementKey: "background_image",
      contentType: "image",
      value: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1920&q=80",
      altText: "Our team at work",
      displayOrder: 4,
      isActive: true,
    },

    // Services
    text("services", "section_title", "What We Do", 1),
    text("services", "item_1_heading", "Consulting Services", 2),
    text("services", "item_1_description", "Expert advice to help you plan with confidence and get results.", 3),
    text("services", "item_2_heading", "Project Management", 4),
    text("services", "item_2_description", "We run the work end to end and keep you updated at every step.", 5),
    text("services", "item_3_heading", "Technical Support", 6),
    text("services", "item_3_description", "Fast, friendly help when something needs fixing.", 7),

    // About
    text("about", "heading", "About Us", 1),
    text(
      "about",
      "body_text",
      "We are a small team who care about doing the job properly. Every booking gets the same attention, whether it is a quick visit or a large project.",
      2
    ),

    // Contact
    text("contact", "section_title", "Get In Touch", 1),
    text(
      "contact",
      "body_text",
      "Request a quote online and we will get back to you the same working day.",
      2
    ),
  ];

  await db.insert(schema.landingPageContent).values(landingPageData);
  console.log("✅ Created landing page content");

  // Re-seeding services is skipped once any exist, because quotes and jobs
  // reference them by foreign key — deleting them would fail (or orphan real
  // work) on a database that has already been used.
  const existingServices = await db.select().from(schema.services).limit(1);
  if (existingServices.length > 0) {
    console.log("ℹ️ Services already exist, leaving them untouched");
    console.log("🎉 Seeding complete!");
    return;
  }

  // Seed services with questions
  const [service1] = await db.insert(schema.services).values({
      businessId: business.id,
      serviceName: "Window Replacement",
      description: "Professional window installation and replacement",
      pricingType: "custom",
      basePrice: "500.00",
      isActive: true,
      displayOrder: 1,
      pricingFormula: "base_price + (hours * 150) + (km * 10)",
      aiGuidancePrompt: "Analyze the customer's window replacement request. Extract: number of windows, window sizes, type of glass needed, urgency level, and distance to location.",
      ruleConfig: {
        hourly_rate: 150,
        travel_rate: 10,
        materials_markup: 1.3
      },
      serviceQuestions: [
        {
          question: "How many windows need replacement?",
          type: "number",
          required: true
        },
        {
          question: "What type of glass do you prefer?",
          type: "select",
          options: ["Standard", "Double-glazed", "Tinted", "Tempered"],
          required: true
        },
        {
          question: "When do you need this done?",
          type: "select",
          options: ["ASAP (within 48hrs)", "This week", "Next week", "Flexible"],
          required: false
        }
      ]
    }).returning();

  // Consulting Services
  const [consultingService] = await db.insert(schema.services).values({
      businessId: business.id,
      serviceName: "Consulting Services",
      description: "Expert business consulting to help you achieve your goals and maximize growth potential.",
      pricingType: "fixed",
      basePrice: "150.00",
      durationMinutes: 60,
      isActive: true,
      displayOrder: 1,
      serviceQuestions: [
        { id: "glass-type", question: "What type of glass?", type: "select", options: ["Shower door", "Window", "Mirror", "Table top", "Other"], required: true },
        { id: "dimensions", question: "What are the dimensions (L x W)?", type: "text", placeholder: "e.g., 2m x 1.5m", required: true },
        { id: "thickness", question: "Glass thickness required?", type: "select", options: ["6mm", "8mm", "10mm", "12mm", "Not sure"], required: false },
        { id: "urgency", question: "How urgent is this?", type: "select", options: ["Emergency (same day)", "Urgent (within 3 days)", "Standard (within week)", "Flexible"], required: true }
      ],
    }).returning();

    // Project Management
    const [projectManagementService] = await db.insert(schema.services).values({
      businessId: business.id,
      serviceName: "Project Management",
      description: "Professional project management services ensuring on-time delivery and exceptional results.",
      pricingType: "hourly",
      basePrice: "250.00",
      durationMinutes: 120,
      isActive: true,
      displayOrder: 2,
      serviceQuestions: [
        { id: "project-type", question: "Project type?", type: "select", options: ["Renovation", "New build", "Maintenance", "Other"], required: true },
        { id: "scope", question: "Describe the scope of work", type: "textarea", placeholder: "Please provide details...", required: true },
        { id: "timeline", question: "Expected timeline?", type: "select", options: ["< 1 month", "1-3 months", "3-6 months", "6+ months"], required: true }
      ],
    }).returning();

    // Technical Support
    const [technicalSupportService] = await db.insert(schema.services).values({
      businessId: business.id,
      serviceName: "Technical Support",
      description: "24/7 technical support and maintenance services to keep your systems running smoothly.",
      pricingType: "per_item",
      basePrice: "100.00",
      durationMinutes: 30,
      isActive: true,
      displayOrder: 3,
      serviceQuestions: [
        { id: "support-type", question: "Type of support needed?", type: "select", options: ["Hardware", "Software", "Network", "Other"], required: true },
        { id: "issue", question: "Describe the issue", type: "textarea", placeholder: "What's happening?", required: true },
        { id: "priority", question: "Priority level?", type: "select", options: ["Critical (system down)", "High (major impact)", "Medium (some impact)", "Low (minor issue)"], required: true }
      ],
    }).returning();


  console.log("🎉 Seeding complete!");
}

seed().catch((error) => {
  console.error("❌ Seeding failed:", error);
  process.exit(1);
});