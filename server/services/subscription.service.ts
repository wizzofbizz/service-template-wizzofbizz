
import { db } from "../db";
import { eq, and, sql } from "drizzle-orm";
import {
  businesses,
  subscriptionPlans,
  userSubscriptions,
  adminSettings,
  contacts,
  services,
  quotes,
  jobs,
  invoices,
  testimonials,
} from "@shared/schema";

// =====================================================
// TYPE DEFINITIONS
// =====================================================

export interface FeatureAccess {
  dashboard: boolean;
  contacts: boolean;
  services: boolean;
  quotes: boolean;
  jobs: boolean;
  invoices: boolean;
  calendar: boolean;
  publicWebsite: boolean;
  testimonials: boolean;
  emailNotifications: boolean;
  whatsappIntegration: boolean;
  aiQuoteGeneration: boolean;
  reportsAnalytics: boolean;
  customDomain: boolean;
  prioritySupport: boolean;
}

export interface FeatureLimits {
  contacts: number;
  services: number;
  quotes: number;
  jobs: number;
  invoices: number;
  testimonials: number;
  whatsappMessages: number;
  emailNotifications: number;
}

export interface LimitCheckResult {
  canCreate: boolean;
  used: number;
  limit: number;
  upgradeRequired?: boolean;
}

export interface TrialStatus {
  inTrial: boolean;
  daysRemaining: number;
  trialEndDate?: Date;
}

// =====================================================
// SUBSCRIPTION SERVICE CLASS
// =====================================================

export class SubscriptionService {
  /**
   * Check if business has access to a specific feature
   * Logic: Admin settings override plan features (for global kill switch)
   */
  async checkFeatureAccess(
    businessId: string,
    feature: keyof FeatureAccess
  ): Promise<boolean> {
    try {
      // 1. Check global admin setting first (kill switch)
      const isGloballyEnabled = await this.isFeatureGloballyEnabled(feature);
      if (!isGloballyEnabled) {
        return false;
      }

      // 2. Get business subscription plan
      const business = await db.query.businesses.findFirst({
        where: eq(businesses.id, businessId),
        columns: { subscriptionPlanId: true },
      });

      if (!business) {
        return false;
      }

      // 3. Get plan features
      const plan = await this.getPlanById(business.subscriptionPlanId || "monthly");
      if (!plan) {
        return false;
      }

      const features = plan.features as unknown as FeatureAccess;
      return features[feature] || false;
    } catch (error) {
      console.error(`Error checking feature access for ${feature}:`, error);
      return false;
    }
  }

  /**
   * Get all feature access for a business
   */
  async getAllFeatureAccess(businessId: string): Promise<FeatureAccess> {
    try {
      const business = await db.query.businesses.findFirst({
        where: eq(businesses.id, businessId),
        columns: { subscriptionPlanId: true },
      });

      if (!business) {
        return this.getDefaultFeatures(false);
      }

      const plan = await this.getPlanById(business.subscriptionPlanId || "monthly");
      if (!plan) {
        return this.getDefaultFeatures(false);
      }

      return plan.features as unknown as FeatureAccess;
    } catch (error) {
      console.error("Error getting all feature access:", error);
      return this.getDefaultFeatures(false);
    }
  }

  /**
   * Check if feature is globally enabled (admin kill switch)
   */
  async isFeatureGloballyEnabled(feature: keyof FeatureAccess): Promise<boolean> {
    try {
      const settingKey = this.getAdminSettingKey(feature);
      const setting = await this.getAdminSetting(settingKey);
      
      // Default to enabled if setting doesn't exist
      if (!setting) {
        return true;
      }

      return setting === "true";
    } catch (error) {
      console.error(`Error checking global feature ${feature}:`, error);
      return true; // Fail open during testing
    }
  }

  /**
   * Check resource creation limit
   */
  async checkLimit(
    businessId: string,
    resource: "contacts" | "quotes" | "jobs" | "invoices" | "services" | "testimonials"
  ): Promise<LimitCheckResult> {
    try {
      // Get business subscription
      const business = await db.query.businesses.findFirst({
        where: eq(businesses.id, businessId),
        columns: { subscriptionPlanId: true },
      });

      if (!business) {
        return { canCreate: false, used: 0, limit: 0 };
      }

      // Get plan with limits
      const plan = await this.getPlanById(business.subscriptionPlanId || "monthly");
      if (!plan) {
        return { canCreate: false, used: 0, limit: 0 };
      }

      const limits = plan.limits as unknown as FeatureLimits;
      const limit = limits[resource as keyof FeatureLimits];

      // -1 means unlimited
      if (limit === -1) {
        return { canCreate: true, used: 0, limit: -1 };
      }

      // Count current usage
      const usedCount = await this.getResourceCount(businessId, resource);

      return {
        canCreate: usedCount < limit,
        used: usedCount,
        limit,
        upgradeRequired: usedCount >= limit,
      };
    } catch (error) {
      console.error(`Error checking limit for ${resource}:`, error);
      return { canCreate: true, used: 0, limit: -1 }; // Fail open during testing
    }
  }

  /**
   * Get all limits for a business
   */
  async getAllLimits(businessId: string): Promise<Record<string, LimitCheckResult>> {
    const resources: Array<"contacts" | "quotes" | "jobs" | "invoices" | "services" | "testimonials"> = [
      "contacts",
      "quotes",
      "jobs",
      "invoices",
      "services",
      "testimonials",
    ];

    const results: Record<string, LimitCheckResult> = {};

    for (const resource of resources) {
      results[resource] = await this.checkLimit(businessId, resource);
    }

    return results;
  }

  /**
   * Activate trial for new business
   */
  async activateTrial(businessId: string): Promise<void> {
    try {
      const trialDays = 14; // Default trial period
      const trialStartDate = new Date();
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + trialDays);

      await db
        .update(businesses)
        .set({
          subscriptionPlanId: "monthly", // Default to monthly during trial
          trialStartDate,
          trialEndDate,
          updatedAt: new Date(),
        })
        .where(eq(businesses.id, businessId));

      console.log(`Trial activated for business ${businessId} until ${trialEndDate}`);
    } catch (error) {
      console.error("Error activating trial:", error);
      throw error;
    }
  }

  /**
   * Check if business is in active trial
   */
  async isInTrial(businessId: string): Promise<TrialStatus> {
    try {
      const business = await db.query.businesses.findFirst({
        where: eq(businesses.id, businessId),
        columns: { trialStartDate: true, trialEndDate: true },
      });

      if (!business || !business.trialEndDate) {
        return { inTrial: false, daysRemaining: 0 };
      }

      const now = new Date();
      const endDate = new Date(business.trialEndDate);

      if (now > endDate) {
        return { inTrial: false, daysRemaining: 0, trialEndDate: endDate };
      }

      const daysRemaining = Math.ceil(
        (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        inTrial: true,
        daysRemaining,
        trialEndDate: endDate,
      };
    } catch (error) {
      console.error("Error checking trial status:", error);
      return { inTrial: false, daysRemaining: 0 };
    }
  }

  /**
   * Check if business has active paid subscription
   */
  async hasActiveSubscription(businessId: string): Promise<boolean> {
    try {
      const subscription = await this.getCurrentSubscription(businessId);
      return subscription?.status === "active";
    } catch (error) {
      console.error("Error checking active subscription:", error);
      return false;
    }
  }

  /**
   * Get current subscription for business
   */
  async getCurrentSubscription(businessId: string) {
    try {
      const subscription = await db.query.userSubscriptions.findFirst({
        where: and(
          eq(userSubscriptions.businessId, businessId),
          eq(userSubscriptions.status, "active")
        ),
      });

      return subscription || null;
    } catch (error) {
      console.error("Error getting current subscription:", error);
      return null;
    }
  }

  /**
   * Get plan by ID
   */
  async getPlanById(planId: string) {
    try {
      const plan = await db.query.subscriptionPlans.findFirst({
        where: eq(subscriptionPlans.id, planId),
      });

      return plan || null;
    } catch (error) {
      console.error(`Error getting plan ${planId}:`, error);
      return null;
    }
  }

  /**
   * Get all active plans
   */
  async getAllPlans() {
    try {
      const plans = await db.query.subscriptionPlans.findMany({
        where: eq(subscriptionPlans.isActive, true),
        orderBy: (plans, { asc }) => [asc(plans.sortOrder)],
      });

      return plans;
    } catch (error) {
      console.error("Error getting all plans:", error);
      return [];
    }
  }

  /**
   * Update admin setting
   */
  async updateAdminSetting(key: string, value: string): Promise<void> {
    try {
      const existing = await db.query.adminSettings.findFirst({
        where: eq(adminSettings.settingKey, key),
      });

      if (existing) {
        await db
          .update(adminSettings)
          .set({ settingValue: value, updatedAt: new Date() })
          .where(eq(adminSettings.settingKey, key));
      } else {
        await db.insert(adminSettings).values({
          settingKey: key,
          settingValue: value,
          settingType: "string",
        });
      }
    } catch (error) {
      console.error(`Error updating admin setting ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get admin setting value
   */
  async getAdminSetting(key: string): Promise<string | null> {
    try {
      const setting = await db.query.adminSettings.findFirst({
        where: eq(adminSettings.settingKey, key),
      });

      return setting?.settingValue || null;
    } catch (error) {
      console.error(`Error getting admin setting ${key}:`, error);
      return null;
    }
  }

  // =====================================================
  // PRIVATE HELPER METHODS
  // =====================================================

  /**
   * Get resource count for a business
   */
  private async getResourceCount(
    businessId: string,
    resource: "contacts" | "quotes" | "jobs" | "invoices" | "services" | "testimonials"
  ): Promise<number> {
    try {
      let result;

      switch (resource) {
        case "contacts":
          result = await db
            .select({ count: sql<number>`count(*)` })
            .from(contacts)
            .where(eq(contacts.businessId, businessId));
          break;
        case "services":
          result = await db
            .select({ count: sql<number>`count(*)` })
            .from(services)
            .where(eq(services.businessId, businessId));
          break;
        case "quotes":
          result = await db
            .select({ count: sql<number>`count(*)` })
            .from(quotes)
            .where(eq(quotes.businessId, businessId));
          break;
        case "jobs":
          result = await db
            .select({ count: sql<number>`count(*)` })
            .from(jobs)
            .where(eq(jobs.businessId, businessId));
          break;
        case "invoices":
          result = await db
            .select({ count: sql<number>`count(*)` })
            .from(invoices)
            .where(eq(invoices.businessId, businessId));
          break;
        case "testimonials":
          result = await db
            .select({ count: sql<number>`count(*)` })
            .from(testimonials)
            .where(eq(testimonials.businessId, businessId));
          break;
        default:
          return 0;
      }

      return result[0]?.count || 0;
    } catch (error) {
      console.error(`Error counting ${resource}:`, error);
      return 0;
    }
  }

  /**
   * Get admin setting key for a feature
   */
  private getAdminSettingKey(feature: keyof FeatureAccess): string {
    const keyMap: Record<keyof FeatureAccess, string> = {
      dashboard: "feature_dashboard_enabled",
      contacts: "feature_contacts_enabled",
      services: "feature_services_enabled",
      quotes: "feature_quotes_enabled",
      jobs: "feature_jobs_enabled",
      invoices: "feature_invoices_enabled",
      calendar: "feature_calendar_enabled",
      publicWebsite: "feature_public_website_enabled",
      testimonials: "feature_testimonials_enabled",
      emailNotifications: "feature_email_enabled",
      whatsappIntegration: "feature_whatsapp_enabled",
      aiQuoteGeneration: "feature_ai_quotes_enabled",
      reportsAnalytics: "feature_analytics_enabled",
      customDomain: "feature_custom_domain_enabled",
      prioritySupport: "feature_priority_support_enabled",
    };

    return keyMap[feature] || `feature_${feature}_enabled`;
  }

  /**
   * Get default features (all disabled or all enabled)
   */
  private getDefaultFeatures(enabled: boolean): FeatureAccess {
    return {
      dashboard: enabled,
      contacts: enabled,
      services: enabled,
      quotes: enabled,
      jobs: enabled,
      invoices: enabled,
      calendar: enabled,
      publicWebsite: enabled,
      testimonials: enabled,
      emailNotifications: enabled,
      whatsappIntegration: enabled,
      aiQuoteGeneration: enabled,
      reportsAnalytics: enabled,
      customDomain: enabled,
      prioritySupport: enabled,
    };
  }
}

// Export singleton instance
export const subscriptionService = new SubscriptionService();
