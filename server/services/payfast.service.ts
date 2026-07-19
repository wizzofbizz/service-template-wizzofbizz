import { getPublicBaseUrl } from "../config";
import crypto from "crypto";

/**
 * PayFast once-off payments.
 *
 * Customers use this to pay an invoice or a booking deposit. There is no
 * recurring/subscription billing in this template — a service business charges
 * its customers per job, it does not run a subscription product.
 *
 * Credentials come from the server environment only, never from the database,
 * so the admin UI never handles secrets. The owner's Settings toggle decides
 * WHETHER to offer online payment; the environment decides whether it CAN.
 */

// =====================================================
// TYPE DEFINITIONS
// =====================================================

export interface PayFastFormData {
  merchant_id: string;
  merchant_key: string;
  return_url: string;
  cancel_url: string;
  notify_url: string;

  name_first: string;
  name_last: string;
  email_address: string;

  m_payment_id: string;
  amount: string;
  item_name: string;
  item_description: string;

  custom_str1?: string; // paymentType: "invoice" | "deposit"
  custom_str2?: string; // invoiceId
  custom_str3?: string; // jobId (deposits)
  custom_str4?: string;
  custom_str5?: string;

  signature: string;
}

export interface CreatePaymentParams {
  /** Our own reference, echoed back on the ITN. Usually the invoice id. */
  paymentId: string;
  amount: string | number;
  itemName: string;
  itemDescription?: string;
  customerFirstName?: string;
  customerLastName?: string;
  customerEmail?: string;
  paymentType?: "invoice" | "deposit";
  invoiceId?: string;
  jobId?: string;
}

export interface PayFastConfig {
  merchantId: string;
  merchantKey: string;
  passphrase: string;
  baseUrl: string;
}

export class PayFastMisconfiguredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PayFastMisconfiguredError";
  }
}

// =====================================================
// PAYFAST SERVICE
// =====================================================

export class PayFastService {
  private config: PayFastConfig;
  private isSandbox: boolean;

  /** PayFast ITN source IP ranges (production only). */
  private readonly PAYFAST_IPS = [
    "41.208.113",
    "197.221.192",
  ];

  /**
   * Field order for once-off payment signatures.
   * MUST match PayFast's documented order exactly, and MUST match the order
   * fields are POSTed in — a mismatch silently fails signature validation.
   */
  private readonly PAYMENT_FIELD_ORDER = [
    "merchant_id",
    "merchant_key",
    "return_url",
    "cancel_url",
    "notify_url",
    "name_first",
    "name_last",
    "email_address",
    "m_payment_id",
    "amount",
    "item_name",
    "item_description",
    "custom_str1",
    "custom_str2",
    "custom_str3",
    "custom_str4",
    "custom_str5",
  ];

  constructor() {
    // Explicit mode switch, so a staging box running NODE_ENV=production can
    // still be pointed at the sandbox.
    this.isSandbox = process.env.PAYFAST_MODE !== "live";
    this.config = this.getConfig();
    console.log(`🔧 PayFast initialised in ${this.isSandbox ? "SANDBOX" : "LIVE"} mode`);
  }

  /** True when credentials for the active mode are present. */
  static isConfigured(): boolean {
    const sandbox = process.env.PAYFAST_MODE !== "live";
    return sandbox
      ? Boolean(process.env.PAYFAST_SANDBOX_MERCHANT_ID && process.env.PAYFAST_SANDBOX_MERCHANT_KEY)
      : Boolean(process.env.PAYFAST_PROD_MERCHANT_ID && process.env.PAYFAST_PROD_MERCHANT_KEY);
  }

  /**
   * PayFast-compatible URL encoding: spaces as +, uppercase hex.
   * Both details matter — lowercase hex produces an invalid signature.
   */
  private urlEncodeValue(value: string): string {
    return encodeURIComponent(value)
      .replace(/%20/g, "+")
      .replace(/%[0-9a-f]{2}/gi, (match) => match.toUpperCase());
  }

  private getConfig(): PayFastConfig {
    if (this.isSandbox) {
      const merchantId = process.env.PAYFAST_SANDBOX_MERCHANT_ID;
      const merchantKey = process.env.PAYFAST_SANDBOX_MERCHANT_KEY;

      if (!merchantId || !merchantKey) {
        throw new PayFastMisconfiguredError(
          "Missing PayFast sandbox credentials. Set PAYFAST_SANDBOX_MERCHANT_ID and " +
          "PAYFAST_SANDBOX_MERCHANT_KEY in your environment (.env)."
        );
      }

      return {
        merchantId,
        merchantKey,
        // A sandbox passphrase is optional; PayFast sandbox accounts often have none.
        passphrase: process.env.PAYFAST_SANDBOX_PASSPHRASE || "",
        baseUrl: "https://sandbox.payfast.co.za/eng/process",
      };
    }

    const merchantId = process.env.PAYFAST_PROD_MERCHANT_ID;
    const merchantKey = process.env.PAYFAST_PROD_MERCHANT_KEY;
    const passphrase = process.env.PAYFAST_PROD_PASSPHRASE;

    if (!merchantId || !merchantKey || !passphrase) {
      throw new PayFastMisconfiguredError(
        "Missing PayFast production credentials. Set PAYFAST_PROD_MERCHANT_ID, " +
        "PAYFAST_PROD_MERCHANT_KEY and PAYFAST_PROD_PASSPHRASE in your environment (.env)."
      );
    }

    return {
      merchantId,
      merchantKey,
      passphrase,
      baseUrl: "https://www.payfast.co.za/eng/process",
    };
  }

  /**
   * Build a signed once-off payment form for an invoice or deposit.
   * The caller POSTs these fields to getPaymentUrl().
   */
  createPaymentForm(params: CreatePaymentParams): PayFastFormData {
    const {
      paymentId,
      amount,
      itemName,
      itemDescription,
      customerFirstName,
      customerLastName,
      customerEmail,
      paymentType = "invoice",
      invoiceId,
      jobId,
    } = params;

    const numericAmount = typeof amount === "number" ? amount : parseFloat(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      throw new Error(`Invalid payment amount: ${amount}`);
    }

    const baseUrl = getPublicBaseUrl();

    const formData: Record<string, string> = {
      merchant_id: this.config.merchantId,
      merchant_key: this.config.merchantKey,
      return_url: `${baseUrl}/api/payments/return`,
      cancel_url: `${baseUrl}/api/payments/cancel`,
      notify_url: `${baseUrl}/api/payments/webhook/payfast`,

      name_first: customerFirstName || "",
      name_last: customerLastName || "",
      email_address: customerEmail || "",

      m_payment_id: paymentId,
      amount: numericAmount.toFixed(2),
      item_name: itemName.slice(0, 100), // PayFast caps this at 100 chars
      item_description: (itemDescription || itemName).slice(0, 255),

      custom_str1: paymentType,
      custom_str2: invoiceId || "",
      custom_str3: jobId || "",
      custom_str4: "",
      custom_str5: "",
    };

    const signature = this.generateFormSignature(formData);

    return { ...formData, signature } as unknown as PayFastFormData;
  }

  /**
   * MD5 signature over the fields in PAYMENT_FIELD_ORDER, with the passphrase
   * appended last. Every field is included, even empty ones, because the
   * signature must match the POSTed data exactly.
   */
  generateFormSignature(data: Record<string, string>): string {
    const pairs: string[] = [];

    for (const key of this.PAYMENT_FIELD_ORDER) {
      if (data[key] !== undefined && data[key] !== null) {
        pairs.push(`${key}=${this.urlEncodeValue(String(data[key]).trim())}`);
      }
    }

    let queryString = pairs.join("&");

    if (this.config.passphrase) {
      queryString += `&passphrase=${this.config.passphrase.trim()}`;
    }

    return crypto.createHash("md5").update(queryString).digest("hex").toLowerCase();
  }

  /**
   * Validate an ITN signature.
   *
   * Uses the EXACT order the fields were received in — sorting them breaks
   * validation — and excludes empty values, per PayFast's ITN spec.
   */
  validateITNSignature(data: Record<string, string>): boolean {
    try {
      const receivedSignature = data.signature;
      if (!receivedSignature) {
        console.error("❌ No signature in ITN data");
        return false;
      }

      const { signature, ...rest } = data;

      const pairs: string[] = [];
      for (const key of Object.keys(rest)) {
        const value = String(rest[key] ?? "");
        if (value !== "") {
          pairs.push(`${key}=${this.urlEncodeValue(value)}`);
        }
      }

      let queryString = pairs.join("&");
      if (this.config.passphrase) {
        queryString += `&passphrase=${this.config.passphrase.trim()}`;
      }

      const expected = crypto.createHash("md5").update(queryString).digest("hex").toLowerCase();

      // Constant-time comparison: both are fixed-length hex digests.
      const isValid =
        receivedSignature.length === expected.length &&
        crypto.timingSafeEqual(Buffer.from(receivedSignature), Buffer.from(expected));

      if (!isValid) console.error("❌ ITN signature mismatch");
      return isValid;
    } catch (error) {
      console.error("❌ Error validating ITN signature:", error);
      return false;
    }
  }

  /**
   * Check the ITN came from a PayFast IP.
   *
   * Sandbox accepts any source so the flow can be tested locally; live traffic
   * is restricted to PayFast's published ranges.
   */
  validateITNIP(ipAddress: string): boolean {
    if (this.isSandbox) return true;

    const normalised = ipAddress.replace(/^::ffff:/, "");
    const isValid = this.PAYFAST_IPS.some((prefix) => normalised.startsWith(prefix));

    if (!isValid) console.error(`❌ Rejected ITN from non-PayFast IP: ${normalised}`);
    return isValid;
  }

  /**
   * Confirm the ITN amount matches what we expected, to the cent.
   * Without this a tampered ITN could mark a large invoice paid for R1.
   */
  validateAmount(expected: string | number, received: string | number): boolean {
    const a = Math.round(parseFloat(String(expected)) * 100);
    const b = Math.round(parseFloat(String(received)) * 100);

    if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
    if (a !== b) {
      console.error(`❌ ITN amount mismatch: expected ${a / 100}, received ${b / 100}`);
      return false;
    }
    return true;
  }

  /** Where the payment form should be POSTed. */
  getPaymentUrl(): string {
    return this.config.baseUrl;
  }

  isSandboxMode(): boolean {
    return this.isSandbox;
  }
}

/**
 * Lazily constructed singleton: the service throws when credentials are
 * missing, so it must not be built at import time or an unconfigured
 * deployment would crash at boot.
 */
let instance: PayFastService | null = null;

export function getPayFastService(): PayFastService {
  if (!instance) instance = new PayFastService();
  return instance;
}
