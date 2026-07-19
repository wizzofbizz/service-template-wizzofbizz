
import { db } from "./db";
import { services } from "@shared/schema";
import { eq } from "drizzle-orm";
import { INDUSTRY_SERVICE_TEMPLATES } from "./industry-service-templates";

async function seedServiceTemplates() {
  console.log("🌱 Starting service template seeding...");

  try {
    // Get all businesses grouped by industry
    const businesses = await db.query.businesses.findMany({
      columns: {
        id: true,
        industry: true,
        businessName: true,
      },
    });

    console.log(`📊 Found ${businesses.length} businesses to seed templates for`);

    let totalInserted = 0;

    for (const business of businesses) {
      // industry is nullable on the businesses table.
      const industry = business.industry;
      const templates = industry ? INDUSTRY_SERVICE_TEMPLATES[industry] : undefined;

      if (!templates || templates.length === 0) {
        console.log(`⚠️  No templates found for industry: ${industry}`);
        continue;
      }

      console.log(`\n🏢 Processing ${business.businessName} (${industry})`);
      
      // Check existing services for this business
      const existingServices = await db.query.services.findMany({
        where: eq(services.businessId, business.id),
      });

      const existingServiceNames = new Set(
        existingServices.map(s => s.serviceName)
      );

      for (const template of templates) {
        // Skip if service already exists
        if (existingServiceNames.has(template.serviceName)) {
          console.log(`  ⏭️  Skipping existing: ${template.serviceName}`);
          continue;
        }

        // Insert the service
        await db.insert(services).values({
          businessId: business.id,
          serviceName: template.serviceName,
          description: template.description,
          category: template.category,
          basePrice: template.basePrice,
          pricingFormula: template.pricingFormula,
          ruleConfig: template.ruleConfig,
          aiGuidancePrompt: template.aiGuidancePrompt,
          durationMinutes: template.durationMinutes,
          requiresSiteVisit: template.requiresSiteVisit,
          pricingType: template.pricingType,
          isActive: true,
        });

        totalInserted++;
        console.log(`  ✅ Inserted: ${template.serviceName}`);
      }
    }

    console.log(`\n🎉 Template seeding complete!`);
    console.log(`📈 Total templates inserted: ${totalInserted}`);

  } catch (error) {
    console.error("❌ Error seeding templates:", error);
    throw error;
  }
}

// Run the seeding
seedServiceTemplates()
  .then(() => {
    console.log("✨ Seeding finished successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Seeding failed:", error);
    process.exit(1);
  });
