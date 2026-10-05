/** Shapes shared across the landing sections. */

export interface Service {
  id: string;
  serviceName: string;
  description: string | null;
  basePrice: string | null;
  durationMinutes: number | null;
}

export interface Business {
  businessName?: string;
  primaryColor?: string;
  businessWhatsapp?: string;
  phone?: string;
  email?: string;
  addressLine1?: string;
  city?: string;
}

export interface BusinessData {
  business: Business;
  services: Service[];
}
