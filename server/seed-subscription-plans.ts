
import { db } from "./db";
import { subscriptionPlans } from "@shared/schema";

async function seedSubscriptionPlans() {
  console.log("🌱 Seeding subscription plans...");

  try {
    // Check if plans already exist
    const existingPlans = await db.select().from(subscriptionPlans);
    
    if (existingPlans.length > 0) {
      console.log("✅ Subscription plans already exist. Skipping seed.");
      return;
    }

    // Insert default plans
    await db.insert(subscriptionPlans).values([
      {
        id: "monthly",
        name: "monthly",
        displayName: "Monthly Plan",
        description: "Pay monthly, cancel anytime",
        monthlyPrice: "350",
        annualPrice: null,
        trialDays: 14,
        features: {
          dashboard: true,
          contacts: true,
          services: true,
          quotes: true,
          jobs: true,
          invoices: true,
          calendar: true,
          publicWebsite: true,
          testimonials: true,
          emailNotifications: true,
          whatsappIntegration: true,
          aiQuoteGeneration: true,
          reportsAnalytics: true,
          customDomain: true,
          prioritySupport: true,
        },
        limits: {
          contacts: -1,
          services: -1,
          quotes: -1,
          jobs: -1,
          invoices: -1,
          testimonials: -1,
          whatsappMessages: 1000,
          emailNotifications: -1,
        },
        isActive: true,
        sortOrder: 1,
      },
      {
        id: "annual",
        name: "annual",
        displayName: "Annual Plan",
        description: "Save with annual billing",
        monthlyPrice: "350",
        annualPrice: "3000",
        trialDays: 14,
        features: {
          dashboard: true,
          contacts: true,
          services: true,
          quotes: true,
          jobs: true,
          invoices: true,
          calendar: true,
          publicWebsite: true,
          testimonials: true,
          emailNotifications: true,
          whatsappIntegration: true,
          aiQuoteGeneration: true,
          reportsAnalytics: true,
          customDomain: true,
          prioritySupport: true,
        },
        limits: {
          contacts: -1,
          services: -1,
          quotes: -1,
          jobs: -1,
          invoices: -1,
          testimonials: -1,
          whatsappMessages: 1000,
          emailNotifications: -1,
        },
        isActive: true,
        sortOrder: 2,
      },
    ]);

    console.log("✅ Subscription plans seeded successfully!");
    console.log("   - Monthly Plan: R350/month");
    console.log("   - Annual Plan: R3000/year (save R1200)");
  } catch (error) {
    console.error("❌ Error seeding subscription plans:", error);
    throw error;
  }
}

seedSubscriptionPlans()
  .then(() => {
    console.log("🎉 Seed completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Seed failed:", error);
    process.exit(1);
  });
