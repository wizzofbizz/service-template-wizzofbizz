
import crypto from "crypto";

// =====================================================
// TYPE DEFINITIONS
// =====================================================

export interface PayFastFormData {
  // Merchant details
  merchant_id: string;
  merchant_key: string;
  return_url: string;
  cancel_url: string;
  notify_url: string;

  // Customer details
  name_first: string;
  name_last: string;
  email_address: string;

  // Transaction details
  amount: string;
  item_name: string;
  item_description: string;

  // Subscription details
  subscription_type: string;
  billing_date: string;
  recurring_amount: string;
  frequency: string;
  cycles: string;

  // Custom fields
  custom_str1?: string; // businessId
  custom_str2?: string; // planId
  custom_str3?: string; // billingFrequency
  custom_str4?: string; // discountCode
  custom_str5?: string;

  // Signature
  signature: string;
}

export interface CreateSubscriptionParams {
  businessId: string;
  planId: string;
  billingFrequency: "monthly" | "annually";
  userEmail: string;
  userFirstName: string;
  userLastName: string;
  amount: string;
  itemName: string;
  itemDescription: string;
  discountCode?: string;
}

export interface PayFastConfig {
  merchantId: string;
  merchantKey: string;
  passphrase: string;
  baseUrl: string;
}

// =====================================================
// PAYFAST SERVICE CLASS
// =====================================================

export class PayFastService {
  private config: PayFastConfig;
  private isSandbox: boolean;

  // PayFast IP whitelist (for ITN validation)
  private readonly PAYFAST_IPS = [
    "41.208.113", // Range: 41.208.113.0/24
    "197.221.192", // Range: 197.221.192.0/24
  ];

  // Billing frequency mapping
  private readonly FREQUENCY_MAP = {
    monthly: "3", // Monthly
    annually: "6", // Annual
  };

  // Field order for signature generation (MUST BE EXACT per PayFast docs)
  private readonly SUBSCRIPTION_FIELD_ORDER = [
    "merchant_id",
    "merchant_key",
    "return_url",
    "cancel_url",
    "notify_url",
    "name_first",
    "name_last",
    "email_address",
    "amount",
    "item_name",
    "item_description",
    "custom_str1",      // businessId
    "custom_str2",      // planId
    "custom_str3",      // billingFrequency
    "custom_str4",      // discountCode
    "custom_str5",      // discountAmount
    "subscription_type",
    "billing_date",
    "recurring_amount",
    "frequency",
    "cycles",
  ];

  constructor() {
    console.log(`🔍 Debug: NODE_ENV = "${process.env.NODE_ENV}"`);
    this.isSandbox = process.env.NODE_ENV !== "production";
    this.config = this.getConfig();
    console.log(`🔧 PayFast initialized in ${this.isSandbox ? "SANDBOX" : "PRODUCTION"} mode`);
  }

  /**
   * URL encode value with PayFast-compatible encoding (spaces as +, uppercase hex in %XX)
   */
  private urlEncodeValue(value: string): string {
    return encodeURIComponent(value)
      .replace(/%20/g, '+')
      .replace(/%[0-9a-f]{2}/gi, match => match.toUpperCase());
  }

  /**
   * Get PayFast configuration based on environment
   */
  private getConfig(): PayFastConfig {
    if (this.isSandbox) {
      // Sandbox mode - require credentials from Secrets
      const merchantId = process.env.PAYFAST_SANDBOX_MERCHANT_ID;
      const merchantKey = process.env.PAYFAST_SANDBOX_MERCHANT_KEY;
      const passphrase = process.env.PAYFAST_SANDBOX_PASSPHRASE;

      if (!merchantId || !merchantKey || !passphrase) {
        throw new Error(
          "Missing PayFast sandbox credentials. Please set PAYFAST_SANDBOX_MERCHANT_ID, PAYFAST_SANDBOX_MERCHANT_KEY, and PAYFAST_SANDBOX_PASSPHRASE in Replit Secrets."
        );
      }

      return {
        merchantId,
        merchantKey,
        passphrase,
        baseUrl: "https://sandbox.payfast.co.za/eng/process",
      };
    } else {
      // Production mode - require credentials from Secrets
      const merchantId = process.env.PAYFAST_PROD_MERCHANT_ID;
      const merchantKey = process.env.PAYFAST_PROD_MERCHANT_KEY;
      const passphrase = process.env.PAYFAST_PROD_PASSPHRASE;

      if (!merchantId || !merchantKey || !passphrase) {
        throw new Error(
          "Missing PayFast production credentials. Please set PAYFAST_PROD_MERCHANT_ID, PAYFAST_PROD_MERCHANT_KEY, and PAYFAST_PROD_PASSPHRASE in Replit Secrets."
        );
      }

      return {
        merchantId,
        merchantKey,
        passphrase,
        baseUrl: "https://www.payfast.co.za/eng/process",
      };
    }
  }

  /**
   * Create subscription payment form data
   */
  async createSubscriptionForm(params: CreateSubscriptionParams): Promise<PayFastFormData> {
    const {
      businessId,
      planId,
      billingFrequency,
      userEmail,
      userFirstName,
      userLastName,
      amount: rawAmount,
      itemName,
      itemDescription,
      discountCode,
    } = params;

    // Format amount to two decimal places
    const formattedAmount = parseFloat(rawAmount).toFixed(2);

    // Get base URL for callbacks
    const baseUrl = process.env.REPL_SLUG
      ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
      : `http://localhost:${process.env.PORT || 5000}`;

    // Calculate billing date (today)
    const billingDate = new Date().toISOString().split("T")[0];

    // Build form data (WITHOUT signature first) - order MUST match SUBSCRIPTION_FIELD_ORDER
    // CRITICAL: All fields including empty custom_str4 and custom_str5 MUST be present
    const formData: Partial<PayFastFormData> = {
      // Merchant details
      merchant_id: this.config.merchantId,
      merchant_key: this.config.merchantKey,
      return_url: `${baseUrl}/api/subscriptions/return`,
      cancel_url: `${baseUrl}/api/subscriptions/cancel`,
      notify_url: `${baseUrl}/api/subscriptions/webhook/payfast`,

      // Customer details
      name_first: userFirstName,
      name_last: userLastName,
      email_address: userEmail,

      // Transaction details
      amount: formattedAmount,
      item_name: itemName,
      item_description: itemDescription,

      // Custom fields (metadata) - ALL fields MUST be included, even if empty strings
      // PayFast requires these in both signature AND POST data
      custom_str1: businessId,
      custom_str2: planId,
      custom_str3: billingFrequency,
      custom_str4: discountCode !== undefined && discountCode !== null ? discountCode : "",
      custom_str5: "", // Always empty string, never undefined

      // Subscription details - MUST come after custom fields
      subscription_type: "1", // Subscription
      billing_date: billingDate,
      recurring_amount: formattedAmount,
      frequency: this.FREQUENCY_MAP[billingFrequency],
      cycles: "0", // 0 = unlimited recurring
    };

    // Generate signature
    const signature = this.generateFormSignature(formData as Record<string, string>);

    // Return complete form data with signature
    return {
      ...formData,
      signature,
    } as PayFastFormData;
  }

  /**
   * Generate MD5 signature for PayFast form
   * CRITICAL: Must use exact field order and URL encoding per PayFast docs
   * CRITICAL: Must include ALL fields from SUBSCRIPTION_FIELD_ORDER, even empty strings
   */
  generateFormSignature(data: Record<string, string>): string {
    // Build query string with exact field order
    const pairs: string[] = [];

    for (const key of this.SUBSCRIPTION_FIELD_ORDER) {
      // Check if field exists in data (including empty strings)
      if (data[key] !== undefined && data[key] !== null) {
        const value = data[key].toString().trim();
        // CRITICAL: Include ALL fields, even empty strings
        // PayFast requires exact match between signature fields and POST data
        const encodedValue = this.urlEncodeValue(value);
        pairs.push(`${key}=${encodedValue}`);
      }
    }

    // Join parameter pairs
    let queryString = pairs.join("&");

    // Add passphrase at the end (trim and append raw, as per working implementations)
    if (this.config.passphrase) {
      const trimmedPassphrase = this.config.passphrase.trim();
      queryString += `&passphrase=${trimmedPassphrase}`;
    }

    // Generate MD5 hash (lowercase)
    const signature = crypto.createHash("md5").update(queryString).digest("hex").toLowerCase();

    console.log(`🔐 PayFast signature generated`);
    console.log(`📝 Complete query string:\n${queryString}`);
    console.log(`🔍 Uppercase hex check: ${queryString.includes('%3A') ? '✅ YES' : '❌ NO (lowercase hex detected!)'}`);
    console.log(`🔍 custom_str4 present: ${queryString.includes('custom_str4=') ? '✅ YES' : '❌ NO'}`);
    console.log(`🔍 custom_str5 present: ${queryString.includes('custom_str5=') ? '✅ YES' : '❌ NO'}`);
    console.log(`✅ Signature: ${signature}`);
    
    return signature;
  }

  /**
   * Validate ITN (Instant Transaction Notification) signature
   * Uses exact received order and consistent encoding
   */
  validateITNSignature(data: Record<string, string>): boolean {
    try {
      const receivedSignature = data.signature;
      if (!receivedSignature) {
        console.error("❌ No signature in ITN data");
        return false;
      }

      // Remove signature from data for validation
      const dataWithoutSignature = { ...data };
      delete dataWithoutSignature.signature;

      // Use EXACT RECEIVED ORDER (do not sort!)
      const keys = Object.keys(dataWithoutSignature);
      const pairs: string[] = [];

      for (const key of keys) {
        const value = String(dataWithoutSignature[key] ?? '');
        if (value !== '') {  // Exclude blank/empty values
          const encodedValue = this.urlEncodeValue(value);
          pairs.push(`${key}=${encodedValue}`);
        }
      }

      // Join pairs
      let queryString = pairs.join("&");

      // Append passphrase (append raw, as per working implementations)
      if (this.config.passphrase) {
        const trimmedPassphrase = this.config.passphrase.trim();
        queryString += `&passphrase=${trimmedPassphrase}`;
      }

      // Generate expected signature
      const expectedSignature = crypto.createHash("md5").update(queryString).digest("hex").toLowerCase();

      // Compare signatures
      const isValid = receivedSignature === expectedSignature;

      if (!isValid) {
        console.error("❌ ITN signature mismatch");
        console.error("Received:", receivedSignature);
        console.error("Expected:", expectedSignature);
        console.error("Query string used:", queryString);
      } else {
        console.log("✅ ITN signature valid");
      }

      return isValid;
    } catch (error) {
      console.error("❌ Error validating ITN signature:", error);
      return false;
    }
  }

  /**
   * Validate PayFast server IP address
   * Only accept ITN requests from PayFast IP ranges
   */
  validateITNIP(ipAddress: string): boolean {
    if (this.isSandbox) {
      // In sandbox, allow localhost and any IP for testing
      console.log(`🔧 Sandbox mode: Accepting IP ${ipAddress}`);
      return true;
    }

    // Check if IP starts with any whitelisted range
    const isValid = this.PAYFAST_IPS.some((allowedPrefix) => ipAddress.startsWith(allowedPrefix));

    if (!isValid) {
      console.error(`❌ Invalid PayFast IP: ${ipAddress}`);
    } else {
      console.log(`✅ Valid PayFast IP: ${ipAddress}`);
    }

    return isValid;
  }

  /**
   * Cancel subscription via PayFast API
   * @param token - PayFast subscription token
   */
  async cancelSubscription(token: string): Promise<boolean> {
    try {
      const url = this.isSandbox
        ? `https://sandbox.payfast.co.za/eng/recurring/cancel/${token}`
        : `https://www.payfast.co.za/eng/recurring/cancel/${token}`;

      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "merchant-id": this.config.merchantId,
          version: "v1",
          timestamp: new Date().toISOString(),
        },
      });

      if (response.ok) {
        console.log(`✅ Subscription ${token} cancelled successfully`);
        return true;
      } else {
        console.error(`❌ Failed to cancel subscription ${token}:`, response.statusText);
        return false;
      }
    } catch (error) {
      console.error("❌ Error cancelling subscription:", error);
      return false;
    }
  }

  /**
   * Query subscription status via PayFast API
   */
  async querySubscriptionStatus(token: string): Promise<any> {
    try {
      const url = this.isSandbox
        ? `https://sandbox.payfast.co.za/eng/recurring/fetch/${token}`
        : `https://www.payfast.co.za/eng/recurring/fetch/${token}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "merchant-id": this.config.merchantId,
          version: "v1",
          timestamp: new Date().toISOString(),
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Subscription status fetched for ${token}`);
        return data;
      } else {
        console.error(`❌ Failed to fetch subscription status:`, response.statusText);
        return null;
      }
    } catch (error) {
      console.error("❌ Error querying subscription:", error);
      return null;
    }
  }

  /**
   * Get PayFast payment gateway URL
   */
  getPaymentUrl(): string {
    return this.config.baseUrl;
  }

  /**
   * Check if running in sandbox mode
   */
  isSandboxMode(): boolean {
    return this.isSandbox;
  }
}

// Export singleton instance
export const payfastService = new PayFastService();
