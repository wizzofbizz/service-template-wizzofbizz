import { Router } from "express";
import { db } from "../db";
import { customDomains } from "@shared/schema";
import { requireAuth, attachBusinessContext } from "../middleware/auth";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";
import { z } from "zod";
import { clearDomainCache } from "../middleware/domain-routing";

const router = Router();

// Validation schemas
const createDomainSchema = z.object({
  domainType: z.enum(["full", "quote_subdomain"]),
  domain: z.string().min(3).max(255).regex(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/),
});

const verifyDomainSchema = z.object({
  method: z.enum(["a_record", "txt_record"]),
});

// GET /api/custom-domains - List all domains for business
router.get("/", requireAuth, attachBusinessContext, async (req, res, next) => {
  try {
    const businessId = req.user!.businessId!;

    const domains = await db
      .select()
      .from(customDomains)
      .where(eq(customDomains.businessId, businessId));

    res.json(domains);
  } catch (error) {
    next(error);
  }
});

// POST /api/custom-domains - Add new custom domain
router.post("/", requireAuth, attachBusinessContext, async (req, res, next) => {
  try {
    const businessId = req.user!.businessId!;
    const data = createDomainSchema.parse(req.body);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");

    // Check if domain already exists globally
    const existingDomain = await db
      .select()
      .from(customDomains)
      .where(eq(customDomains.domain, data.domain))
      .limit(1);

    if (existingDomain.length > 0) {
      return res.status(400).json({ 
        error: "Domain already registered" 
      });
    }

    // Check if business already has a domain of this type
    const existingType = await db
      .select()
      .from(customDomains)
      .where(
        and(
          eq(customDomains.businessId, businessId),
          eq(customDomains.domainType, data.domainType)
        )
      )
      .limit(1);

    if (existingType.length > 0) {
      const typeLabel = data.domainType === 'full' ? 'full website' : 'quote subdomain';
      return res.status(400).json({ 
        error: `You already have a ${typeLabel} domain configured. Please remove it first if you want to add a different one.`
      });
    }

    const [domain] = await db
      .insert(customDomains)
      .values({
        businessId,
        domainType: data.domainType,
        domain: data.domain,
        status: "pending",
        verificationToken,
      })
      .returning();

    res.status(201).json(domain);
  } catch (error) {
    next(error);
  }
});

// POST /api/custom-domains/:id/verify - Verify domain ownership
router.post("/:id/verify", requireAuth, attachBusinessContext, async (req, res, next) => {
  try {
    const businessId = req.user!.businessId!;
    const domainId = req.params.id;
    const { method } = verifyDomainSchema.parse(req.body);

    // Get domain
    const [domain] = await db
      .select()
      .from(customDomains)
      .where(
        and(
          eq(customDomains.id, domainId),
          eq(customDomains.businessId, businessId)
        )
      )
      .limit(1);

    if (!domain) {
      return res.status(404).json({ error: "Domain not found" });
    }

    // Use DNS verification service
    const { dnsVerificationService } = await import('../dns-verification-service');
    const result = await dnsVerificationService.verifyDomain(domainId, businessId);

    if (result.verified) {
      const [updated] = await db
        .select()
        .from(customDomains)
        .where(eq(customDomains.id, domainId))
        .limit(1);

      // Clear cache to force re-fetch on next request
      clearDomainCache(updated.domain);

      res.json(updated);
    } else {
      res.status(400).json({ 
        error: result.error || "DNS verification failed",
        details: result.details 
      });
    }
  } catch (error) {
    next(error);
  }
});

// DELETE /api/custom-domains/:id - Remove custom domain
router.delete("/:id", requireAuth, attachBusinessContext, async (req, res, next) => {
  try {
    const businessId = req.user!.businessId!;
    const domainId = req.params.id;

    const [deleted] = await db
      .delete(customDomains)
      .where(
        and(
          eq(customDomains.id, domainId),
          eq(customDomains.businessId, businessId)
        )
      )
      .returning();

    if (!deleted) {
      return res.status(404).json({ error: "Domain not found" });
    }

    // Clear cache for deleted domain
    clearDomainCache(deleted.domain);

    res.json({ success: true, domain: deleted });
  } catch (error) {
    next(error);
  }
});

// GET /api/custom-domains/:id/instructions - Get setup instructions
router.get("/:id/instructions", requireAuth, attachBusinessContext, async (req, res, next) => {
  try {
    const businessId = req.user!.businessId!;
    const domainId = req.params.id;

    const [domain] = await db
      .select()
      .from(customDomains)
      .where(
        and(
          eq(customDomains.id, domainId),
          eq(customDomains.businessId, businessId)
        )
      )
      .limit(1);

    if (!domain) {
      return res.status(404).json({ error: "Domain not found" });
    }

    const instructions = {
      domain: domain.domain,
      verificationToken: domain.verificationToken,
      methods: [
        {
          type: "a_record",
          name: "@",
          value: process.env.REPLIT_SERVER_IP || "YOUR_SERVER_IP",
          ttl: 3600,
        },
        {
          type: "txt_record",
          name: "_verification",
          value: domain.verificationToken,
          ttl: 3600,
        },
      ],
    };

    res.json(instructions);
  } catch (error) {
    next(error);
  }
});

// GET /api/custom-domains/:id/status - Check DNS status without verifying
router.get("/:id/status", requireAuth, attachBusinessContext, async (req, res, next) => {
  try {
    const businessId = req.user!.businessId!;
    const domainId = req.params.id;

    const [domain] = await db
      .select()
      .from(customDomains)
      .where(
        and(
          eq(customDomains.id, domainId),
          eq(customDomains.businessId, businessId)
        )
      )
      .limit(1);

    if (!domain) {
      return res.status(404).json({ error: "Domain not found" });
    }

    // Check DNS status without updating database
    const { dnsVerificationService } = await import('../dns-verification-service');
    const status = await dnsVerificationService.checkDNSStatus(
      domain.domain, 
      domain.verificationToken
    );

    res.json({
      domain: domain.domain,
      status: domain.status,
      dnsStatus: status,
      lastVerifiedAt: domain.lastVerifiedAt,
    });
  } catch (error) {
    next(error);
  }
});

export default router;