import { isAiConfigured } from "./config";

import { GoogleGenerativeAI, Part } from "@google/generative-ai";
import type { Service, ImageAnalysisConfig } from "../shared/schema";
import { MaterialResolver } from "./material-resolver";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

interface ExtractedFeatures {
  hours?: number;
  km_distance?: number;
  urgency?: "low" | "normal" | "high";
  materials_needed?: boolean;
  complexity?: "simple" | "moderate" | "complex";
  custom_features?: Record<string, any>;
}

interface UpsellSuggestion {
  serviceId: string;
  serviceName: string;
  reason: string;
  confidence: number;
}

interface QuoteLineItem {
  description: string;
  quantity: string;
  unitPrice: string;
  lineTotal: string;
}

interface QuoteGenerationResult {
  extractedFeatures: ExtractedFeatures;
  suggestedPrice: number;
  laborPrice: number;
  materialPrice: number;
  lineItems: QuoteLineItem[];
  confidence: number;
  reasoning: string;
  upsellSuggestions: UpsellSuggestion[];
}

export interface ImageAnalysisResult {
  success: boolean;
  extractedData: Record<string, any>;
  detectedIssues: string[];
  confidence: number;
  summary: string;
  recommendations: string[];
}

export class AIQuoteService {
  private model;

  constructor() {
    // Using Gemini 2.0 Flash for speed and cost-effectiveness
    this.model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
  }

  /**
   * Extract features from customer request and suggest pricing
   */
  async generateQuote(
    service: Service,
    customerInput: string,
    photos?: string[],
    allServices?: Service[],
    preMappedVariables?: Record<string, any>
  ): Promise<QuoteGenerationResult> {
    // AI quoting is optional. Without a provider key we fall back to the
    // service's own pricing rules rather than failing the customer's request.
    if (!isAiConfigured()) {
      console.warn(
        "AI quoting is not configured (no GEMINI_API_KEY). " +
        "Falling back to rule-based pricing for this quote."
      );
      return this.generateRuleBasedQuote(service, preMappedVariables);
    }

    try {
      const prompt = this.buildPrompt(service, customerInput, allServices);
      
      const result = await this.model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2, // Low temperature for consistent pricing
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 2048,
          responseMimeType: "application/json",
        },
      });

      const response = result.response.text();
      const parsed = JSON.parse(response);

      // Merge pre-mapped variables (from customer answers) with AI-extracted features
      // Pre-mapped variables take priority over AI estimates
      const mergedFeatures = {
        ...parsed.features,
        ...preMappedVariables, // Customer answers override AI estimates
      };

      console.log('🤖 AI Features:', parsed.features);
      console.log('📊 Pre-mapped Variables:', preMappedVariables);
      console.log('✅ Merged Features:', mergedFeatures);
      console.log('🔧 AI Selected Materials:', parsed.materials_used);

      // Calculate labor price using formula with merged features
      const laborPrice = this.calculatePrice(service, mergedFeatures);

      // Process AI-selected materials from the simple materials list
      const materialsList = (service.materialCostConfig as any)?.materials || [];
      const aiSelectedMaterials = parsed.materials_used || [];
      
      const resolvedMaterials = {
        separateItems: [] as Array<{ description: string; amount: number }>,
        bundledItems: [] as Array<{ description: string; amount: number }>,
        bundledTotal: 0,
        allMaterials: [] as any[]
      };

      // Map AI selections to actual materials with showSeparately flag
      aiSelectedMaterials.forEach((aiMaterial: any) => {
        const matchedMaterial = materialsList.find((m: any) => m.name === aiMaterial.name);
        if (matchedMaterial) {
          const quantity = aiMaterial.quantity || 1;
          const totalCost = matchedMaterial.cost * quantity;
          
          const description = quantity > 1 
            ? `${aiMaterial.name} (${quantity}x)` 
            : aiMaterial.name;

          if (matchedMaterial.showSeparately) {
            resolvedMaterials.separateItems.push({
              description,
              amount: totalCost
            });
          } else {
            resolvedMaterials.bundledItems.push({
              description,
              amount: totalCost
            });
            resolvedMaterials.bundledTotal += totalCost;
          }
          
          resolvedMaterials.allMaterials.push({
            ...matchedMaterial,
            quantity
          });
        }
      });

      console.log('✅ Resolved Materials:', {
        separateCount: resolvedMaterials.separateItems.length,
        bundledCount: resolvedMaterials.bundledItems.length,
        bundledTotal: resolvedMaterials.bundledTotal
      });

      // Calculate total material cost
      const materialPrice = resolvedMaterials.bundledTotal + 
        resolvedMaterials.separateItems.reduce((sum, item) => sum + item.amount, 0);

      // Build line items array
      const lineItems: QuoteLineItem[] = [];

      // 1. Labor line item
      lineItems.push({
        description: `${service.serviceName} - Labor`,
        quantity: "1",
        unitPrice: laborPrice.toFixed(2),
        lineTotal: laborPrice.toFixed(2),
      });

      // 2. Separate material line items
      for (const item of resolvedMaterials.separateItems) {
        lineItems.push({
          description: item.description,
          quantity: "1",
          unitPrice: item.amount.toFixed(2),
          lineTotal: item.amount.toFixed(2),
        });
      }

      // 3. Bundled materials line item (if any)
      if (resolvedMaterials.bundledTotal > 0) {
        lineItems.push({
          description: "Materials & Supplies",
          quantity: "1",
          unitPrice: resolvedMaterials.bundledTotal.toFixed(2),
          lineTotal: resolvedMaterials.bundledTotal.toFixed(2),
        });
      }

      const totalPrice = laborPrice + materialPrice;

      // Format distance charge info for notes
      let distanceInfo = "";
      if (parsed.distance_charge_info) {
        distanceInfo = `\n\n**Travel Distance:**\n${parsed.distance_charge_info.message}`;
      }

      console.log('💰 Quote Breakdown:', {
        laborPrice,
        materialPrice,
        totalPrice,
        lineItemsCount: lineItems.length,
      });

      return {
        extractedFeatures: mergedFeatures, // Return merged features (AI + customer answers)
        suggestedPrice: totalPrice,
        laborPrice,
        materialPrice,
        lineItems,
        confidence: parsed.confidence,
        reasoning: parsed.reasoning + distanceInfo,
        upsellSuggestions: parsed.upsells || [],
      };
    } catch (error) {
      // A provider outage, quota error or malformed response must not take the
      // customer's quote request down with it — fall back to the service rules.
      console.error("AI quote generation error, falling back to rule-based pricing:", error);
      return this.generateRuleBasedQuote(service, preMappedVariables);
    }
  }

  /**
   * Deterministic quote from the service's own pricing rules, used when the AI
   * provider is unconfigured or unavailable.
   *
   * Confidence is deliberately low so the admin UI flags these for review: the
   * price comes from configured rules only, with no interpretation of what the
   * customer actually wrote.
   */
  private generateRuleBasedQuote(
    service: Service,
    preMappedVariables?: Record<string, any>
  ): QuoteGenerationResult {
    const features: ExtractedFeatures = {
      urgency: "normal",
      complexity: "moderate",
      ...(preMappedVariables || {}),
    };

    const laborPrice = this.calculatePrice(service, features);
    const suggestedPrice = Math.round(laborPrice * 100) / 100;

    return {
      extractedFeatures: features,
      suggestedPrice,
      laborPrice: suggestedPrice,
      materialPrice: 0,
      lineItems: [
        {
          description: service.serviceName,
          quantity: "1",
          unitPrice: suggestedPrice.toFixed(2),
          lineTotal: suggestedPrice.toFixed(2),
        },
      ],
      confidence: 0.3,
      reasoning:
        "Estimated from this service's configured pricing rules. AI analysis " +
        "was unavailable, so the request text was not interpreted — please " +
        "review before sending to the customer.",
      upsellSuggestions: [],
    };
  }

  /**
   * Build intelligent prompt for feature extraction and upselling
   */
  private buildPrompt(
    service: Service,
    customerInput: string,
    allServices?: Service[]
  ): string {
    const aiGuidance = service.aiGuidancePrompt || "Analyze this service request and extract relevant details.";
    const materialsList = (service.materialCostConfig as any)?.materials || [];
    
    let prompt = `${aiGuidance}

**Customer Request:**
${customerInput}

**Service Being Requested:**
${service.serviceName}
${service.description ? `Description: ${service.description}` : ""}

**Your Task:**
1. Extract key features from the customer's request (hours needed, materials, urgency, complexity)
2. **DISTANCE IS PRE-CALCULATED**: Use the distance value provided in the request (do not estimate)
3. **CUSTOMER-PROVIDED VALUES**: Some variables are already provided by customer answers - DO NOT override these
4. **MATERIALS SELECTION**: Based on the customer's description, determine which materials from the list below are needed
5. Identify related services that the customer might need but hasn't mentioned
6. Provide confidence score (0.0 to 1.0) for your assessment
7. Explain your reasoning

**CRITICAL - Travel Distance:**
- The km_distance value has been calculated by our system based on actual locations
- Use this EXACT value in your features extraction
- If the request says "NO TRAVEL CHARGE", km_distance is already set to 0

**CRITICAL - Intelligent Upselling Examples:**
- If customer mentions "replace broken glass pane" → Suggest checking window frame condition
- If "pool cleaning" → Ask about pump maintenance or chemical testing
- If "garden hedge trimming" → Suggest lawn mowing or fertilization
- If "paint one room" → Mention skirting boards, ceiling, or full house package
- If "fix leak under sink" → Check for water damage, pipe corrosion, or full plumbing inspection

`;

    // Add materials list for AI to select from
    if (materialsList.length > 0) {
      prompt += `\n**Available Materials for this Service:**\n`;
      materialsList.forEach((m: any) => {
        prompt += `- ${m.name}: R${m.cost}\n`;
      });
      prompt += `\n**Materials Instructions:**\n`;
      prompt += `- Select only materials that are likely needed based on the customer's description\n`;
      prompt += `- For per-unit materials (containing "per meter", "per sqm", etc.), extract the quantity from the request\n`;
      prompt += `- If quantity cannot be determined, use a reasonable estimate or set to 1\n`;
      prompt += `- Return materials in the "materials_used" array with name, quantity, and unit_cost\n\n`;
    }

    // Add available services for upselling context
    if (allServices && allServices.length > 0) {
      prompt += `\n**Available Related Services:**\n`;
      allServices.forEach(s => {
        if (s.id !== service.id && s.isActive) {
          prompt += `- ${s.serviceName}: ${s.description || "No description"}\n`;
        }
      });
    }

    prompt += `\n**Response Format (JSON only):**
{
  "features": {
    "hours": <estimated hours as number>,
    "km_distance": <travel distance in km>,
    "urgency": "low" | "normal" | "high",
    "materials_needed": true | false,
    "complexity": "simple" | "moderate" | "complex",
    "custom_features": {
      // Any service-specific features extracted
    }
  },
  "materials_used": [
    {
      "name": "<exact material name from the list>",
      "quantity": <number - for per-unit materials, extract from request; otherwise use 1>,
      "unit_cost": <cost per unit from the materials list>
    }
  ],
  "confidence": <0.0 to 1.0>,
  "reasoning": "<brief explanation of your assessment including materials selection and travel distance>",
  "distance_charge_info": {
    "calculated": <true/false - whether travel charge was calculated>,
    "amount": <travel charge amount if applicable>,
    "message": "<user-friendly message about travel charge>"
  },
  "upsells": [
    {
      "serviceName": "<related service name>",
      "reason": "<why customer might need this>",
      "confidence": <0.0 to 1.0>
    }
  ]
}

**Rules:**
- Be conservative with pricing estimates
- Only suggest upsells that are genuinely relevant
- Only include materials that are actually needed based on the customer's request
- For per-unit materials, extract quantity from customer description (e.g., "25 sqm" → quantity: 25)
- If information is missing, make reasonable assumptions and note them in reasoning
- Confidence should reflect certainty of your assessment
- **IMPORTANT**: Include a clear section in your reasoning about:
  * Materials selected and why
  * Travel distance calculation
  * If km_distance = 0: State "✓ No travel charge (service at business location)"
  * If km_distance > 0: State "✓ Travel charge calculated: [distance] km at R[rate]/km = R[amount]"
  * Format the distance_charge_info object with calculated status and user-friendly message`;

    return prompt;
  }

  /**
   * Calculate final price using service pricing formula
   */
  private calculatePrice(service: Service, features: ExtractedFeatures): number {
    try {
      const ruleConfig = service.ruleConfig as Record<string, any> || {};
      const formula = service.pricingFormula;

      if (!formula) {
        // Fallback to base price
        return parseFloat(service.basePrice || "0");
      }

      // Build evaluation context
      const context: Record<string, any> = {
        base_price: parseFloat(service.basePrice || "0"),
        hours: features.hours || 0,
        km: features.km_distance || 0,
        ...ruleConfig, // hourly_rate, travel_rate, etc.
      };

      // Apply urgency multiplier
      if (features.urgency === "high") {
        context.urgency_multiplier = 1.5;
      } else if (features.urgency === "low") {
        context.urgency_multiplier = 0.9;
      } else {
        context.urgency_multiplier = 1.0;
      }

      // Apply complexity multiplier
      if (features.complexity === "complex") {
        context.complexity_multiplier = 1.3;
      } else if (features.complexity === "simple") {
        context.complexity_multiplier = 0.8;
      } else {
        context.complexity_multiplier = 1.0;
      }

      // Safely evaluate formula
      const price = this.evaluateFormula(formula, context);
      
      return Math.max(0, price); // Ensure non-negative
    } catch (error) {
      console.error("Price calculation error:", error);
      return parseFloat(service.basePrice || "0");
    }
  }

  /**
   * Safely evaluate pricing formula
   */
  private evaluateFormula(formula: string, context: Record<string, any>): number {
    try {
      // Replace variables in formula (longest first to avoid partial replacements)
      let evalFormula = formula;
      const sortedKeys = Object.keys(context).sort((a, b) => b.length - a.length);
      
      sortedKeys.forEach(key => {
        // Use word boundary regex to match whole variable names only
        const regex = new RegExp(`\\b${key}\\b`, 'g');
        evalFormula = evalFormula.replace(regex, context[key].toString());
      });

      // Basic math operations only (safe evaluation)
      // Allow digits, operators, parentheses, decimal points, and whitespace
      const allowedChars = /^[0-9+\-*/().e \t]+$/;
      if (!allowedChars.test(evalFormula)) {
        console.error("Formula contains invalid characters after substitution:", evalFormula);
        throw new Error("Invalid formula characters");
      }

      return eval(evalFormula);
    } catch (error) {
      console.error("Formula evaluation error:", error);
      console.error("Original formula:", formula);
      console.error("Context:", context);
      return context.base_price || 0;
    }
  }

  /**
   * Analyze uploaded images using Gemini Vision to extract service-relevant details
   * @param photos Array of base64 image strings or URLs
   * @param service The service being quoted - used to determine what to extract
   * @returns Structured analysis result
   */
  async analyzeServiceImages(
    photos: string[],
    service: Service
  ): Promise<ImageAnalysisResult> {
    if (!photos || photos.length === 0) {
      return {
        success: false,
        extractedData: {},
        detectedIssues: [],
        confidence: 0,
        summary: "No photos provided for analysis",
        recommendations: [],
      };
    }

    try {
      const imageAnalysisConfig = service.imageAnalysisConfig as ImageAnalysisConfig | undefined;
      
      // Build image parts for Gemini
      const imageParts: Part[] = photos.map((photo, index) => {
        // Handle both base64 and URL formats
        if (photo.startsWith("data:")) {
          // Extract base64 data from data URL
          const matches = photo.match(/^data:(.+);base64,(.+)$/);
          if (matches) {
            return {
              inlineData: {
                mimeType: matches[1],
                data: matches[2],
              },
            };
          }
        }
        // For raw base64 strings, assume JPEG
        return {
          inlineData: {
            mimeType: "image/jpeg",
            data: photo.replace(/^data:image\/\w+;base64,/, ""),
          },
        };
      });

      // Build dynamic prompt based on service configuration
      const prompt = this.buildImageAnalysisPrompt(service, imageAnalysisConfig);

      // Call Gemini with vision capability
      const result = await this.model.generateContent({
        contents: [
          {
            role: "user",
            parts: [
              ...imageParts,
              { text: prompt },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 2048,
          responseMimeType: "application/json",
        },
      });

      const response = result.response.text();
      const parsed = JSON.parse(response);

      console.log("📸 Image Analysis Result:", parsed);

      return {
        success: true,
        extractedData: parsed.extracted_data || {},
        detectedIssues: parsed.detected_issues || [],
        confidence: parsed.confidence || 0.7,
        summary: parsed.summary || "Image analyzed successfully",
        recommendations: parsed.recommendations || [],
      };
    } catch (error) {
      console.error("Image analysis error:", error);
      return {
        success: false,
        extractedData: {},
        detectedIssues: [],
        confidence: 0,
        summary: "Failed to analyze images",
        recommendations: [],
      };
    }
  }

  /**
   * Build a dynamic prompt for image analysis based on service configuration
   */
  private buildImageAnalysisPrompt(
    service: Service,
    config?: ImageAnalysisConfig
  ): string {
    const ruleConfig = service.ruleConfig as Record<string, any> || {};
    const pricingFormula = service.pricingFormula || "";
    
    // Extract variable names from pricing formula
    const formulaVariables = pricingFormula.match(/[a-z_]+/g) || [];
    const uniqueVariables = [...new Set(formulaVariables)].filter(
      v => !["base_price", "urgency_multiplier", "complexity_multiplier"].includes(v)
    );

    let prompt = `You are an expert at analyzing photos for service quotes. Analyze the uploaded image(s) for a "${service.serviceName}" service request.

**Service Description:**
${service.description || "General service request"}

**Pricing Variables to Extract (if visible in photos):**
${uniqueVariables.map(v => `- ${v}`).join("\n") || "- General assessment needed"}

**Business Pricing Rates:**
${Object.entries(ruleConfig).map(([key, value]) => `- ${key}: ${value}`).join("\n") || "Standard rates apply"}
`;

    // Add custom analysis hints if provided
    if (config?.analysisHints) {
      prompt += `\n**Specific Things to Look For:**\n${config.analysisHints}\n`;
    }

    prompt += `
**Your Task:**
1. Carefully examine each photo
2. Extract any quantifiable details relevant to pricing
3. Identify visible issues, damage, or conditions
4. Assess complexity and provide recommendations
5. Be conservative with estimates - err on the side of caution

**Response Format (JSON only):**
{
  "extracted_data": {
    // Key-value pairs of detected attributes that map to pricing variables
    // Examples: "hours": 3, "sqm": 25, "fixtures": 2, "severity": 2
  },
  "detected_issues": [
    // List of visible problems or conditions found
    // Examples: "Water damage visible on ceiling", "Pipe appears corroded"
  ],
  "confidence": 0.0-1.0,
  "summary": "Brief description of what was found in the photos",
  "recommendations": [
    // Professional suggestions based on what's visible
    // Examples: "Recommend checking for hidden water damage", "May need scaffolding for access"
  ]
}

**Important Rules:**
- Only extract data you can actually see in the photos
- If image quality is poor or details are unclear, note this and reduce confidence
- Do not fabricate or guess measurements you cannot determine
- Include any safety concerns observed
- Mention if additional photos would be helpful`;

    return prompt;
  }

  /**
   * Legacy method for backwards compatibility
   * @deprecated Use analyzeServiceImages instead
   */
  async analyzeImages(photos: string[]): Promise<string> {
    return "Use analyzeServiceImages method for full analysis";
  }
}

export const aiQuoteService = new AIQuoteService();
