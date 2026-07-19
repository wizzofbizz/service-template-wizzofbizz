
import { db } from "./db";
import { businesses } from "../shared/schema";
import { eq } from "drizzle-orm";

/**
 * Migration script to update legacy industry values to standardized values
 * Run this once to migrate existing data
 */
async function migrateIndustries() {
  console.log("🔄 Starting industry migration...");

  try {
    // Migrate "Aircon Services" → "HVAC"
    const airconResult = await db
      .update(businesses)
      .set({ industry: "HVAC" })
      .where(eq(businesses.industry, "Aircon Services"));
    
    console.log(`✅ Migrated ${airconResult.rowCount || 0} businesses from "Aircon Services" to "HVAC"`);

    // Migrate "Garden Services" → "Landscaping"
    const gardenResult = await db
      .update(businesses)
      .set({ industry: "Landscaping" })
      .where(eq(businesses.industry, "Garden Services"));
    
    console.log(`✅ Migrated ${gardenResult.rowCount || 0} businesses from "Garden Services" to "Landscaping"`);

    // Keep "Beauty Salon" for now (can be manually updated by users or migrated to "Other" if needed)
    const beautySalonCount = await db
      .select()
      .from(businesses)
      .where(eq(businesses.industry, "Beauty Salon"));
    
    if (beautySalonCount.length > 0) {
      console.log(`⚠️  Found ${beautySalonCount.length} businesses with "Beauty Salon" - keeping as is (users can update manually)`);
    }

    console.log("✅ Industry migration completed successfully!");
  } catch (error) {
    console.error("❌ Error during industry migration:", error);
    throw error;
  }
}

// Run migration
migrateIndustries()
  .then(() => {
    console.log("Migration script finished");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration script failed:", error);
    process.exit(1);
  });
