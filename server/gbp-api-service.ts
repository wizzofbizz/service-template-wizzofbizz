import axios from "axios";
import crypto from "crypto";

const GOOGLE_BUSINESS_INFO_API_BASE = "https://mybusinessbusinessinformation.googleapis.com/v1";
const GOOGLE_ACCOUNT_MANAGEMENT_API_BASE = "https://mybusinessaccountmanagement.googleapis.com/v1";

// Map internal service categories to Google's official GBP categories
const CATEGORY_MAPPING: Record<string, string> = {
  plumbing: "gcid:plumber",
  electrical: "gcid:electrician",
  hvac: "gcid:hvac_contractor",
  roofing: "gcid:roofer",
  cleaning: "gcid:house_cleaner",
  // Add more mappings as needed
};

export class GBPApiService {
  /**
   * Map internal category to Google's official GBP category
   */
  static mapCategoryToGoogle(category: string): string {
    const mapped = CATEGORY_MAPPING[category.toLowerCase()];
    return mapped || category; // fallback to original if no mapping found
  }

  /**
   * Map Google category to internal category (reverse mapping)
   */
  static mapGoogleCategoryToInternal(googleCategory: string): string {
    for (const [internal, google] of Object.entries(CATEGORY_MAPPING)) {
      if (google === googleCategory) {
        return internal;
      }
    }
    return googleCategory; // fallback to original
  }
  /**
   * Exchange authorization code for access token
   */
  static async exchangeCodeForToken(
    code: string,
    clientId: string,
    clientSecret: string,
    redirectUri: string
  ): Promise<{ accessToken: string; refreshToken?: string; expiresIn: number }> {
    try {
      const response = await axios.post("https://oauth2.googleapis.com/token", {
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      });

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresIn: response.data.expires_in,
      };
    } catch (error) {
      console.error("Error exchanging code for token:", error);
      throw new Error("Failed to exchange authorization code for access token");
    }
  }

  /**
   * Refresh an expired access token
   */
  static async refreshAccessToken(
    refreshToken: string,
    clientId: string,
    clientSecret: string
  ): Promise<{ accessToken: string; expiresIn: number }> {
    try {
      const response = await axios.post("https://oauth2.googleapis.com/token", {
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "refresh_token",
      });

      return {
        accessToken: response.data.access_token,
        expiresIn: response.data.expires_in,
      };
    } catch (error) {
      console.error("Error refreshing access token:", error);
      throw new Error("Failed to refresh access token");
    }
  }

  /**
   * Exponential backoff retry helper
   */
  private static async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    initialDelayMs: number = 5000
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;
        
        // Don't retry on non-rate-limit errors
        if (error.response?.status !== 429) {
          throw error;
        }
        
        // Don't retry on last attempt
        if (attempt === maxRetries) {
          break;
        }
        
        // Calculate delay with exponential backoff (5s, 15s, 45s)
        const delayMs = initialDelayMs * Math.pow(3, attempt);
        console.log(`⏳ Rate limited. Retrying in ${delayMs}ms (attempt ${attempt + 1}/${maxRetries})...`);
        
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    
    throw lastError;
  }

  /**
   * Get the authenticated user's business accounts
   */
  static async getAccounts(accessToken: string): Promise<any> {
    try {
      const response = await this.retryWithBackoff(async () => {
        return await axios.get(
          `${GOOGLE_ACCOUNT_MANAGEMENT_API_BASE}/accounts`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
      });
      return response.data.accounts || [];
    } catch (error: any) {
      console.error("Error fetching accounts:", error.response?.data || error.message);
      
      if (error.response?.status === 429) {
        throw new Error("Google API rate limit exceeded. Please try again in a few minutes.");
      }
      
      throw new Error("Failed to fetch business accounts");
    }
  }

  /**
   * Get locations for an account
   */
  static async getLocations(
    accessToken: string,
    accountId: string
  ): Promise<any> {
    try {
      const response = await this.retryWithBackoff(async () => {
        return await axios.get(
          `${GOOGLE_ACCOUNT_MANAGEMENT_API_BASE}/accounts/${accountId}/locations`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
      });
      return response.data.locations || [];
    } catch (error: any) {
      console.error("Error fetching locations:", error.response?.data || error.message);
      
      if (error.response?.status === 429) {
        throw new Error("Google API rate limit exceeded. Please try again in a few minutes.");
      }
      
      throw new Error("Failed to fetch business locations");
    }
  }

  /**
   * Create a new business location/profile
   */
  static async createLocation(
    accessToken: string,
    accountId: string,
    locationData: {
      businessName: string;
      description?: string;
      address?: {
        addressLine1: string;
        city: string;
        province: string;
        postalCode: string;
      };
      phoneNumber?: string;
      websiteUrl?: string;
      primaryCategory?: string;
    }
  ): Promise<any> {
    try {
      const response = await axios.post(
        `${GOOGLE_ACCOUNT_MANAGEMENT_API_BASE}/accounts/${accountId}/locations`,
        {
          displayName: locationData.businessName,
          description: locationData.description,
          address: locationData.address,
          phoneNumbers: locationData.phoneNumber ? [{ phoneNumber: locationData.phoneNumber }] : [],
          websiteUrl: locationData.websiteUrl,
          primaryCategory: this.mapCategoryToGoogle(locationData.primaryCategory),
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error creating location:", error);
      throw new Error("Failed to create business location");
    }
  }

  /**
   * Get business information
   */
  static async getBusinessInfo(
    accessToken: string,
    locationName: string
  ): Promise<any> {
    try {
      const response = await axios.get(
        `${GOOGLE_BUSINESS_INFO_API_BASE}/${locationName}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching business info:", error);
      throw new Error("Failed to fetch business information");
    }
  }

  /**
   * Get insights/analytics
   */
  static async getInsights(
    accessToken: string,
    locationName: string
  ): Promise<any> {
    try {
      const response = await axios.get(
        `https://mybusinessinsights.googleapis.com/v1/${locationName}/insights:list`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: {
            pageSize: 100,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching insights:", error);
      // Insights API may not be available, so we return empty
      return {};
    }
  }

  /**
   * Get posts
   */
  static async getPosts(
    accessToken: string,
    locationName: string
  ): Promise<any[]> {
    try {
      const response = await axios.get(
        `https://mybusiness.googleapis.com/v4/${locationName}/posts`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      return response.data.posts || [];
    } catch (error) {
      console.error("Error fetching posts:", error);
      return [];
    }
  }

  /**
   * Get reviews
   */
  static async getReviews(
    accessToken: string,
    locationName: string
  ): Promise<any[]> {
    try {
      const response = await axios.get(
        `https://mybusiness.googleapis.com/v4/${locationName}/reviews`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      return response.data.reviews || [];
    } catch (error) {
      console.error("Error fetching reviews:", error);
      return [];
    }
  }

  /**
   * Respond to a review
   */
  static async respondToReview(
    accessToken: string,
    reviewName: string,
    response: string
  ): Promise<any> {
    try {
      const result = await axios.post(
        `https://mybusiness.googleapis.com/v4/${reviewName}:reply`,
        { comment: response },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      return result.data;
    } catch (error) {
      console.error("Error responding to review:", error);
      throw new Error("Failed to respond to review");
    }
  }

  /**
   * Create a post
   */
  static async createPost(
    accessToken: string,
    locationName: string,
    postData: any
  ): Promise<any> {
    try {
      const response = await axios.post(
        `https://mybusiness.googleapis.com/v4/${locationName}/posts`,
        postData,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error creating post:", error);
      throw new Error("Failed to create post");
    }
  }

  /**
   * Encrypt access token for storage
   */
  static encryptToken(token: string, encryptionKey: string): string {
    try {
      // Ensure key is 32 bytes (64 hex characters)
      let keyBuffer: Buffer;
      if (encryptionKey.length === 64) {
        // Assume hex-encoded 32-byte key
        keyBuffer = Buffer.from(encryptionKey, "hex");
      } else if (encryptionKey.length === 32) {
        // Assume raw 32-byte key as string
        keyBuffer = Buffer.from(encryptionKey, "utf8");
      } else {
        // Hash the key to 32 bytes using SHA-256
        keyBuffer = crypto.createHash("sha256").update(encryptionKey).digest();
      }
      
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv("aes-256-cbc", keyBuffer, iv);
      let encrypted = cipher.update(token, "utf8", "hex");
      encrypted += cipher.final("hex");
      return `${iv.toString("hex")}:${encrypted}`;
    } catch (error) {
      console.error("❌ Token encryption failed:", error);
      throw new Error("Failed to encrypt token");
    }
  }

  /**
   * Decrypt access token from storage
   */
  static decryptToken(encryptedToken: string, encryptionKey: string): string {
    try {
      const [ivHex, encrypted] = encryptedToken.split(":");
      const iv = Buffer.from(ivHex, "hex");
      
      // Ensure key is 32 bytes (64 hex characters)
      let keyBuffer: Buffer;
      if (encryptionKey.length === 64) {
        // Assume hex-encoded 32-byte key
        keyBuffer = Buffer.from(encryptionKey, "hex");
      } else if (encryptionKey.length === 32) {
        // Assume raw 32-byte key as string
        keyBuffer = Buffer.from(encryptionKey, "utf8");
      } else {
        // Hash the key to 32 bytes using SHA-256
        keyBuffer = crypto.createHash("sha256").update(encryptionKey).digest();
      }
      
      const decipher = crypto.createDecipheriv("aes-256-cbc", keyBuffer, iv);
      let decrypted = decipher.update(encrypted, "hex", "utf8");
      decrypted += decipher.final("utf8");
      return decrypted;
    } catch (error) {
      console.error("❌ Token decryption failed:", error);
      throw new Error("Failed to decrypt token");
    }
  }
}
