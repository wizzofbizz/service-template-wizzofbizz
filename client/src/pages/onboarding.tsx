
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Redirect } from "wouter";
import { CheckCircle2, Loader2, MessageSquare } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { AddressAutocomplete, type AddressData } from "@/components/ui/address-autocomplete";
import { WhatsAppSetupWizard } from "@/components/WhatsAppSetupWizard";

const step1Schema = z.object({
  businessName: z.string().min(1, "Business name is required"),
  industry: z.string().min(1, "Industry is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
  logoUrl: z.string().url("Invalid logo URL").optional().or(z.literal("")),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format").optional(),
});

const step2Schema = z.object({
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Phone number is required"),
  addressLine1: z.string().min(1, "Address is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  province: z.string().min(1, "Province is required"),
  postalCode: z.string().min(4, "Postal code is required"),
});

const step3Schema = z.object({
  businessDescription: z.string().min(10, "Please provide a brief description (at least 10 characters)").max(500, "Description must be less than 500 characters"),
  operatingHours: z.string().min(1, "Operating hours are required").max(200, "Operating hours must be less than 200 characters"),
  websiteUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  facebookUrl: z.string().url("Invalid Facebook URL").optional().or(z.literal("")),
  instagramUrl: z.string().url("Invalid Instagram URL").optional().or(z.literal("")),
  whatsappNumber: z.string().regex(/^(\+27|0)[0-9]{9}$/, "Invalid South African phone number").optional().or(z.literal("")),
  defaultPaymentDueDays: z.number().min(1, "Must be at least 1 day").max(365, "Must be less than 365 days"),
  paymentReminderDays: z.array(z.number()).min(1, "At least one reminder day is required"),
  jobReminderDays: z.array(z.number()).min(1, "At least one reminder day is required"),
  websiteTemplate: z.string().optional(),
  // Service fields (optional for validation but required in UI)
  serviceName: z.string().optional(),
  serviceDescription: z.string().optional(),
  basePrice: z.string().optional(),
  hourlyRate: z.string().optional(),
  travelRate: z.string().optional(),
});

const step4Schema = z.object({
  bookingWindowDays: z.number().min(1, "Must be at least 1 day").max(90, "Must be less than 90 days"),
  minimumNoticeHours: z.number().min(1, "Must be at least 1 hour").max(168, "Must be less than 168 hours"),
  quoteVisitDurationMinutes: z.number().min(15, "Must be at least 15 minutes").max(480, "Must be less than 480 minutes"),
  calendarHours: z.object({
    monday: z.object({ start: z.string(), end: z.string() }).nullable(),
    tuesday: z.object({ start: z.string(), end: z.string() }).nullable(),
    wednesday: z.object({ start: z.string(), end: z.string() }).nullable(),
    thursday: z.object({ start: z.string(), end: z.string() }).nullable(),
    friday: z.object({ start: z.string(), end: z.string() }).nullable(),
    saturday: z.object({ start: z.string(), end: z.string() }).nullable(),
    sunday: z.object({ start: z.string(), end: z.string() }).nullable(),
  }),
});

const step5Schema = z.object({
  vatNumber: z.string().optional().or(z.literal("")),
  vatRate: z.number().min(0, "VAT rate cannot be negative").max(100, "VAT rate cannot exceed 100%"),
  requireDepositByDefault: z.boolean().optional(),
  defaultDepositPercentage: z.number().min(0, "Deposit percentage cannot be negative").max(100, "Deposit percentage cannot exceed 100%").optional(),
});

const step6Schema = z.object({
  whatsappWasenderApiKey: z.string().optional(),
  skipWhatsApp: z.boolean().optional(),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;
type Step3Data = z.infer<typeof step3Schema>;
type Step4Data = z.infer<typeof step4Schema>;
type Step5Data = z.infer<typeof step5Schema>;
type Step6Data = z.infer<typeof step6Schema>;

// Standardized industries matching home page
const industries = [
  "Plumbing",
  "Electrical",
  "HVAC",
  "Cleaning",
  "Landscaping",
  "Pool Maintenance",
  "Pest Control",
  "Handyman",
  "Painting",
  "Roofing",
  "Construction",
];

const provinces = [
  "Western Cape",
  "Gauteng",
  "KwaZulu-Natal",
  "Eastern Cape",
  "Free State",
  "Limpopo",
  "Mpumalanga",
  "Northern Cape",
  "North West",
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<Step1Data & Step2Data & Step3Data & Step4Data & Step5Data & Step6Data>>({});
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [showSuccess, setShowSuccess] = useState(false);
  const [showWhatsAppSetup, setShowWhatsAppSetup] = useState(false);
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);

  // Step 1 form
  const step1Form = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      businessName: formData.businessName || "",
      industry: formData.industry || "",
      slug: formData.slug || "",
      logoUrl: formData.logoUrl || "",
      primaryColor: formData.primaryColor || "#217BF4",
    },
  });

  // Step 2 form
  const step2Form = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      email: formData.email || user?.email || "",
      phone: formData.phone || "",
      addressLine1: formData.addressLine1 || "",
      addressLine2: formData.addressLine2 || "",
      city: formData.city || "",
      province: formData.province || "",
      postalCode: formData.postalCode || "",
    },
  });

  // Step 3 form
  const step3Form = useForm<Step3Data>({
    resolver: zodResolver(step3Schema),
    defaultValues: {
      businessDescription: formData.businessDescription || "",
      operatingHours: formData.operatingHours || "",
      websiteUrl: formData.websiteUrl || "",
      facebookUrl: formData.facebookUrl || "",
      instagramUrl: formData.instagramUrl || "",
      whatsappNumber: formData.whatsappNumber || "",
      defaultPaymentDueDays: formData.defaultPaymentDueDays || 30,
      paymentReminderDays: formData.paymentReminderDays || [3, 7, 14],
      jobReminderDays: formData.jobReminderDays || [1, 3, 7],
      websiteTemplate: "classic",
    },
  });

  // Step 3B - Simple Service Setup
  const [serviceName, setServiceName] = useState("");
  const [serviceDescription, setServiceDescription] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [travelRate, setTravelRate] = useState("");
  const [requiresTravel, setRequiresTravel] = useState(true);

  // Step 4 form - Calendar/Booking Settings
  const step4Form = useForm<Step4Data>({
    resolver: zodResolver(step4Schema),
    defaultValues: {
      bookingWindowDays: formData.bookingWindowDays || 14,
      minimumNoticeHours: formData.minimumNoticeHours || 24,
      quoteVisitDurationMinutes: formData.quoteVisitDurationMinutes || 60,
      calendarHours: formData.calendarHours || {
        monday: { start: "09:00", end: "17:00" },
        tuesday: { start: "09:00", end: "17:00" },
        wednesday: { start: "09:00", end: "17:00" },
        thursday: { start: "09:00", end: "17:00" },
        friday: { start: "09:00", end: "17:00" },
        saturday: null,
        sunday: null,
      },
    },
  });

  // Step 5 form - VAT/Tax Configuration
  const step5Form = useForm<Step5Data>({
    resolver: zodResolver(step5Schema),
    defaultValues: {
      vatNumber: formData.vatNumber || "",
      vatRate: formData.vatRate || 15.00,
      requireDepositByDefault: formData.requireDepositByDefault || false,
      defaultDepositPercentage: formData.defaultDepositPercentage || 30.00,
    },
  });

  // Step 6 form - WhatsApp Setup
  const step6Form = useForm<Step6Data>({
    resolver: zodResolver(step6Schema),
    defaultValues: {
      whatsappWasenderApiKey: formData.whatsappWasenderApiKey || "",
      skipWhatsApp: false,
    },
  });

  // Load existing business data and resume from saved step
  useEffect(() => {
    const loadProgress = async () => {
      if (!user?.businessId) {
        setIsLoadingProgress(false);
        return;
      }

      try {
        const response = await fetch(`/api/businesses/${user.businessId}`, {
          credentials: "include",
        });

        if (response.ok) {
          const business = await response.json();
          
          // If onboarding is already complete, redirect to dashboard
          if (business.onboardingComplete) {
            setLocation("/dashboard");
            return;
          }

          // Resume from saved step
          if (business.onboardingStep > 0) {
            setStep(business.onboardingStep + 1);
            
            // Pre-fill form data from business record
            const loadedData = {
              businessName: business.businessName || "",
              industry: business.industry || "",
              slug: business.slug || "",
              logoUrl: business.logoUrl || "",
              primaryColor: business.primaryColor || "#217BF4",
              email: business.email || "",
              phone: business.phone || "",
              addressLine1: business.addressLine1 || "",
              addressLine2: business.addressLine2 || "",
              city: business.city || "",
              province: business.province || "",
              postalCode: business.postalCode || "",
              businessDescription: business.businessDescription || "",
              operatingHours: business.operatingHours || "",
              websiteUrl: business.websiteUrl || "",
              facebookUrl: business.facebookUrl || "",
              instagramUrl: business.instagramUrl || "",
              whatsappNumber: business.whatsappNumber || "",
              defaultPaymentDueDays: business.defaultPaymentDueDays || 30,
              paymentReminderDays: business.paymentReminderDays || [3, 7, 14],
              jobReminderDays: business.jobReminderDays || [1, 3, 7],
              bookingWindowDays: business.bookingWindowDays || 14,
              minimumNoticeHours: business.minimumNoticeHours || 24,
              quoteVisitDurationMinutes: business.quoteVisitDurationMinutes || 60,
              calendarHours: business.calendarHours || {
                monday: { start: "09:00", end: "17:00" },
                tuesday: { start: "09:00", end: "17:00" },
                wednesday: { start: "09:00", end: "17:00" },
                thursday: { start: "09:00", end: "17:00" },
                friday: { start: "09:00", end: "17:00" },
                saturday: null,
                sunday: null,
              },
              vatNumber: business.vatNumber || "",
              vatRate: business.vatRate || 15.00,
              requireDepositByDefault: business.requireDepositByDefault || false,
              defaultDepositPercentage: business.defaultDepositPercentage || 30.00,
            };
            
            setFormData(loadedData);
            
            // Reset all forms with the loaded data
            step1Form.reset({
              businessName: loadedData.businessName,
              industry: loadedData.industry,
              slug: loadedData.slug,
              logoUrl: loadedData.logoUrl,
              primaryColor: loadedData.primaryColor,
            });
            
            step2Form.reset({
              email: loadedData.email,
              phone: loadedData.phone,
              addressLine1: loadedData.addressLine1,
              addressLine2: loadedData.addressLine2,
              city: loadedData.city,
              province: loadedData.province,
              postalCode: loadedData.postalCode,
            });
            
            step3Form.reset({
              businessDescription: loadedData.businessDescription,
              operatingHours: loadedData.operatingHours,
              websiteUrl: loadedData.websiteUrl,
              facebookUrl: loadedData.facebookUrl,
              instagramUrl: loadedData.instagramUrl,
              whatsappNumber: loadedData.whatsappNumber,
              defaultPaymentDueDays: loadedData.defaultPaymentDueDays,
              paymentReminderDays: loadedData.paymentReminderDays,
              jobReminderDays: loadedData.jobReminderDays,
              websiteTemplate: "classic",
            });
            
            step4Form.reset({
              bookingWindowDays: loadedData.bookingWindowDays,
              minimumNoticeHours: loadedData.minimumNoticeHours,
              quoteVisitDurationMinutes: loadedData.quoteVisitDurationMinutes,
              calendarHours: loadedData.calendarHours,
            });
            
            step5Form.reset({
              vatNumber: loadedData.vatNumber,
              vatRate: loadedData.vatRate,
              requireDepositByDefault: loadedData.requireDepositByDefault,
              defaultDepositPercentage: loadedData.defaultDepositPercentage,
            });
          }
          
          // Load service data from services table
          try {
            const servicesResponse = await fetch(`/api/services?businessId=${user.businessId}`, {
              credentials: "include",
            });
            
            if (servicesResponse.ok) {
              const services = await servicesResponse.json();
              if (services.length > 0) {
                const firstService = services[0];
                setServiceName(firstService.serviceName || "");
                setServiceDescription(firstService.description || "");
                
                // Extract pricing from ruleConfig
                const ruleConfig = firstService.ruleConfig || {};
                setBasePrice(firstService.basePrice || "");
                setHourlyRate(ruleConfig.hourly_rate?.toString() || "");
                setTravelRate(ruleConfig.travel_rate?.toString() || "");
                setRequiresTravel((ruleConfig.travel_rate || 0) > 0);
              }
            }
          } catch (error) {
            console.error("Error loading services:", error);
          }
        }
      } catch (error) {
        console.error("Error loading onboarding progress:", error);
      } finally {
        setIsLoadingProgress(false);
      }
    };

    loadProgress();
  }, [user, setLocation, step1Form, step2Form, step3Form, step4Form, step5Form]);

  // Check slug availability
  const checkSlug = async (slug: string) => {
    const response = await fetch(`/api/businesses/check-slug/${slug}`);
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || "Slug check failed");
    }
    return response.json();
  };

  // Submit complete onboarding
  const submitOnboarding = useMutation({
    mutationFn: async (data: Step1Data & Step2Data & Step3Data & Step4Data & Step5Data & any) => {
      // Mark onboarding as complete
      const completeData = {
        ...data,
        onboardingStep: 6,
        onboardingComplete: true,
      };

      // First create/update the business
      const url = user?.businessId 
        ? `/api/businesses/${user.businessId}`
        : "/api/auth/register-business";
      
      const method = user?.businessId ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(completeData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create business");
      }

      const result = await response.json();

      // Then create the first service with auto-generated AI config
      if (data.serviceName) {
        const serviceData = {
          serviceName: data.serviceName,
          description: data.serviceDescription || undefined,
          basePrice: data.basePrice || "0",
          pricingType: "custom",
          pricingFormula: "base_price + (hours * hourly_rate) + (km * travel_rate)",
          ruleConfig: {
            hourly_rate: parseFloat(data.hourlyRate || "0"),
            travel_rate: parseFloat(data.travelRate || "0"),
          },
          aiGuidancePrompt: "Extract: 1) hours: Estimated hours needed for this job, 2) km_distance: Travel distance to customer location, 3) urgency: low/normal/high based on timeline, 4) complexity: simple/moderate/complex based on job description",
          isActive: true,
        };

        const serviceResponse = await fetch("/api/services", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(serviceData),
        });

        if (!serviceResponse.ok) {
          console.error("Failed to create initial service, but business was created successfully");
        }
      }

      return result;
    },
    onSuccess: async () => {
      setShowSuccess(true);
      // Invalidate and refetch auth data to get updated businessId
      await queryClient.invalidateQueries({ queryKey: ["auth"] });
      await queryClient.refetchQueries({ queryKey: ["auth"] });
      setTimeout(() => {
        // Force full page reload to ensure session is fully refreshed
        window.location.replace("/dashboard");
      }, 2000);
    },
    onError: (error: Error) => {
      toast({
        title: "Setup Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Auto-generate slug from business name
  const handleBusinessNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    step1Form.setValue("businessName", name);
    
    // Auto-generate slug
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
    
    step1Form.setValue("slug", slug);
  };

  // Save progress to backend
  const saveProgress = async (stepNumber: number, data: any) => {
    try {
      const payload = {
        ...data,
        onboardingStep: stepNumber,
        onboardingComplete: false,
      };

      const url = user?.businessId 
        ? `/api/businesses/${user.businessId}`
        : "/api/auth/register-business";
      
      const method = user?.businessId ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to save progress");
      }

      // Refetch auth to update businessId if it was just created
      if (!user?.businessId) {
        await queryClient.refetchQueries({ queryKey: ["auth"] });
      }

      return await response.json();
    } catch (error) {
      console.error("Error saving progress:", error);
      throw error;
    }
  };

  // Handle step 1 next
  const handleStep1Next = async (data: Step1Data) => {
    try {
      const result = await checkSlug(data.slug);
      if (!result.available) {
        step1Form.setError("slug", {
          type: "manual",
          message: "This website URL is already taken. Please choose another.",
        });
        return;
      }
      
      // Save progress
      await saveProgress(1, data);
      
      setFormData({ ...formData, ...data });
      setStep(2);
    } catch (error: any) {
      step1Form.setError("slug", {
        type: "manual",
        message: error.message || "Unable to verify website URL availability. Please try again.",
      });
    }
  };

  // Handle step 2 next
  const handleStep2Next = async (data: Step2Data) => {
    try {
      await saveProgress(2, { ...formData, ...data });
      setFormData({ ...formData, ...data });
      setStep(3);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save progress. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle step 3 next - validate service setup
  const handleStep3Next = async (data: Step3Data) => {
    // Validate service fields
    if (!serviceName.trim()) {
      toast({
        title: "Service Required",
        description: "Please enter a service name to continue",
        variant: "destructive",
      });
      return;
    }

    if (!basePrice && !hourlyRate) {
      toast({
        title: "Pricing Required",
        description: "Please enter at least a base price or hourly rate",
        variant: "destructive",
      });
      return;
    }

    // Store service data
    const serviceData = {
      serviceName,
      serviceDescription,
      basePrice: basePrice || "0",
      hourlyRate,
      travelRate: requiresTravel ? travelRate : "0",
    };

    try {
      await saveProgress(3, { ...formData, ...data, ...serviceData });
      setFormData({ ...formData, ...data, ...serviceData });
      setStep(4);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save progress. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle step 4 next - Calendar/Booking Settings
  const handleStep4Next = async (data: Step4Data) => {
    try {
      await saveProgress(4, { ...formData, ...data });
      setFormData({ ...formData, ...data });
      setStep(5);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save progress. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle step 5 next - VAT/Tax Configuration
  const handleStep5Next = async (data: Step5Data) => {
    try {
      await saveProgress(5, { ...formData, ...data });
      setFormData({ ...formData, ...data });
      setStep(6);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save progress. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle final submission
  const handleStep6Submit = (data: Step6Data) => {
    const completeData = { ...formData, ...data } as Step1Data & Step2Data & Step3Data & Step4Data & Step5Data & Step6Data;
    
    // If user provided API key, show WhatsApp setup wizard
    if (data.whatsappWasenderApiKey && !data.skipWhatsApp) {
      setFormData(completeData);
      setShowWhatsAppSetup(true);
    } else {
      // Skip WhatsApp setup, complete onboarding
      submitOnboarding.mutate(completeData);
    }
  };

  // Complete onboarding after WhatsApp setup (or skip)
  const handleCompleteOnboarding = () => {
    const completeData = formData as Step1Data & Step2Data & Step3Data & Step4Data & Step5Data & Step6Data;
    submitOnboarding.mutate(completeData);
  };

  // Show loading state while checking auth or loading progress
  if (authLoading || isLoadingProgress) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If not logged in, redirect to login
  if (!user) {
    return <Redirect to="/login" />;
  }

  // Note: The useEffect at line 220 already handles redirecting to dashboard
  // if onboarding is complete, so we don't need a second check here

  if (showSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-12 pb-12">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Welcome to Smart Website!</h2>
            <p className="text-muted-foreground mb-4">
              Your business profile is ready. Redirecting to dashboard...
            </p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-4">
      <div className="max-w-2xl mx-auto py-8">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3, 4, 5, 6].map((stepNum) => (
              <div key={stepNum} className="flex items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm ${
                    step >= stepNum
                      ? "bg-primary text-primary-foreground"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {stepNum}
                </div>
                {stepNum < 6 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      step > stepNum ? "bg-primary" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="text-center text-sm text-muted-foreground">
            Step {step} of 6
          </div>
        </div>

        {/* Step 1: Business Basics */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Business Basics</CardTitle>
              <CardDescription>
                Let's start with the essentials about your business
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={step1Form.handleSubmit(handleStep1Next)} className="space-y-4">
                <div>
                  <Label htmlFor="businessName">Business Name *</Label>
                  <Input
                    id="businessName"
                    {...step1Form.register("businessName")}
                    onChange={handleBusinessNameChange}
                    placeholder="e.g., Cape Town Plumbing Services"
                  />
                  {step1Form.formState.errors.businessName && (
                    <p className="text-sm text-destructive mt-1">
                      {step1Form.formState.errors.businessName.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="industry">Industry *</Label>
                  <Select
                    value={step1Form.watch("industry")}
                    onValueChange={(value) => step1Form.setValue("industry", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {industries.map((industry) => (
                        <SelectItem key={industry} value={industry}>
                          {industry}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {step1Form.formState.errors.industry && (
                    <p className="text-sm text-destructive mt-1">
                      {step1Form.formState.errors.industry.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="slug">Website URL *</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">smartwebsite.co.za/</span>
                    <Input
                      id="slug"
                      {...step1Form.register("slug")}
                      placeholder="your-business-name"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    This will be your website address. Use lowercase letters, numbers, and hyphens only.
                  </p>
                  {step1Form.formState.errors.slug && (
                    <p className="text-sm text-destructive mt-1">
                      {step1Form.formState.errors.slug.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="logoUrl">Logo URL (Optional)</Label>
                  <Input
                    id="logoUrl"
                    {...step1Form.register("logoUrl")}
                    placeholder="https://example.com/logo.png"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    URL to your business logo. You can upload to an image hosting service or use your existing logo URL.
                  </p>
                  {step1Form.formState.errors.logoUrl && (
                    <p className="text-sm text-destructive mt-1">
                      {step1Form.formState.errors.logoUrl.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="primaryColor">Primary Brand Color</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={step1Form.watch("primaryColor")}
                      onChange={(e) => step1Form.setValue("primaryColor", e.target.value)}
                      className="w-20 h-12 cursor-pointer"
                    />
                    <Input
                      value={step1Form.watch("primaryColor")}
                      onChange={(e) => step1Form.setValue("primaryColor", e.target.value)}
                      placeholder="#217BF4"
                      className="flex-1"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    This color will be used for buttons, links, and accents on your website.
                  </p>
                  {step1Form.formState.errors.primaryColor && (
                    <p className="text-sm text-destructive mt-1">
                      {step1Form.formState.errors.primaryColor.message}
                    </p>
                  )}
                </div>

                <div className="flex justify-end pt-4">
                  <Button type="submit">
                    Next
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Contact Information */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>
                How can customers reach you?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={step2Form.handleSubmit(handleStep2Next)} className="space-y-4">
                <div>
                  <Label htmlFor="email">Business Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    {...step2Form.register("email")}
                    placeholder="contact@yourbusiness.com"
                  />
                  {step2Form.formState.errors.email && (
                    <p className="text-sm text-destructive mt-1">
                      {step2Form.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    {...step2Form.register("phone")}
                    placeholder="+27 12 345 6789"
                  />
                  {step2Form.formState.errors.phone && (
                    <p className="text-sm text-destructive mt-1">
                      {step2Form.formState.errors.phone.message}
                    </p>
                  )}
                </div>

                <AddressAutocomplete
                  value={step2Form.watch("addressLine1") || ""}
                  onAddressSelect={(address: AddressData) => {
                    step2Form.setValue("addressLine1", address.addressLine1);
                    step2Form.setValue("city", address.city);
                    step2Form.setValue("province", address.province);
                    step2Form.setValue("postalCode", address.postalCode);
                  }}
                  label="Business Address"
                  required
                  placeholder="Start typing your business address..."
                />

                <div>
                  <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
                  <Input
                    id="addressLine2"
                    {...step2Form.register("addressLine2")}
                    placeholder="Unit, Suite, Building, etc."
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Add unit/suite numbers if applicable
                  </p>
                </div>

                {/* Hidden fields populated by autocomplete */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      {...step2Form.register("city")}
                      placeholder="Auto-filled from address"
                      readOnly
                      className="bg-gray-50"
                    />
                    {step2Form.formState.errors.city && (
                      <p className="text-sm text-destructive mt-1">
                        {step2Form.formState.errors.city.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="postalCode">Postal Code *</Label>
                    <Input
                      id="postalCode"
                      {...step2Form.register("postalCode")}
                      placeholder="Auto-filled from address"
                      readOnly
                      className="bg-gray-50"
                    />
                    {step2Form.formState.errors.postalCode && (
                      <p className="text-sm text-destructive mt-1">
                        {step2Form.formState.errors.postalCode.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="province">Province *</Label>
                  <Input
                    id="province"
                    {...step2Form.register("province")}
                    placeholder="Auto-filled from address"
                    readOnly
                    className="bg-gray-50"
                  />
                  {step2Form.formState.errors.province && (
                    <p className="text-sm text-destructive mt-1">
                      {step2Form.formState.errors.province.message}
                    </p>
                  )}
                </div>

                <div className="flex justify-between pt-4">
                  <Button type="button" variant="outline" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button type="submit">
                    Next
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Online Presence */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Online Presence</CardTitle>
              <CardDescription>
                Tell customers about your business
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={step3Form.handleSubmit(handleStep3Next)} className="space-y-4">
                <div>
                  <Label htmlFor="businessDescription">Business Description *</Label>
                  <Textarea
                    id="businessDescription"
                    {...step3Form.register("businessDescription")}
                    placeholder="Describe your business in 2-3 sentences. What services do you offer? What makes you different?"
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    This will appear on your website to introduce your business to customers.
                  </p>
                  {step3Form.formState.errors.businessDescription && (
                    <p className="text-sm text-destructive mt-1">
                      {step3Form.formState.errors.businessDescription.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="operatingHours">Operating Hours *</Label>
                  <Input
                    id="operatingHours"
                    {...step3Form.register("operatingHours")}
                    placeholder="e.g., Mon-Fri 8AM-5PM, Sat 9AM-1PM"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Let customers know when you're available for business.
                  </p>
                  {step3Form.formState.errors.operatingHours && (
                    <p className="text-sm text-destructive mt-1">
                      {step3Form.formState.errors.operatingHours.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="websiteUrl">Existing Website (Optional)</Label>
                  <Input
                    id="websiteUrl"
                    {...step3Form.register("websiteUrl")}
                    placeholder="https://yourwebsite.com"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    If you already have a website, we can link to it from your new Smart Website.
                  </p>
                  {step3Form.formState.errors.websiteUrl && (
                    <p className="text-sm text-destructive mt-1">
                      {step3Form.formState.errors.websiteUrl.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Social Media & Communication (Optional)</Label>
                  
                  <div>
                    <Label htmlFor="facebookUrl" className="text-sm font-normal text-muted-foreground">Facebook Page</Label>
                    <Input
                      id="facebookUrl"
                      {...step3Form.register("facebookUrl")}
                      placeholder="https://facebook.com/yourbusiness"
                    />
                    {step3Form.formState.errors.facebookUrl && (
                      <p className="text-sm text-destructive mt-1">
                        {step3Form.formState.errors.facebookUrl.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="instagramUrl" className="text-sm font-normal text-muted-foreground">Instagram Profile</Label>
                    <Input
                      id="instagramUrl"
                      {...step3Form.register("instagramUrl")}
                      placeholder="https://instagram.com/yourbusiness"
                    />
                    {step3Form.formState.errors.instagramUrl && (
                      <p className="text-sm text-destructive mt-1">
                        {step3Form.formState.errors.instagramUrl.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="whatsappNumber" className="text-sm font-normal text-muted-foreground">WhatsApp Business Number</Label>
                    <Input
                      id="whatsappNumber"
                      {...step3Form.register("whatsappNumber")}
                      placeholder="+27 12 345 6789"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Customers can contact you directly on WhatsApp
                    </p>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <Label>Website Template</Label>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">We'll create a professional website for you. You can customize it later from your dashboard.</p>
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        id="template-classic"
                        value="classic"
                        {...step3Form.register("websiteTemplate")}
                        data-testid="radio-template-classic"
                      />
                      <label htmlFor="template-classic" className="flex-1 cursor-pointer">
                        <div className="font-medium">Classic Service Provider</div>
                        <div className="text-sm text-muted-foreground">Professional design with services, testimonials & contact</div>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <Label>Payment Settings</Label>
                  
                  <div>
                    <Label htmlFor="defaultPaymentDueDays">Default Payment Due Date (Days) *</Label>
                    <Input
                      id="defaultPaymentDueDays"
                      type="number"
                      {...step3Form.register("defaultPaymentDueDays", { valueAsNumber: true })}
                      placeholder="30"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Number of days until payment is due (e.g., 30 for net 30)
                    </p>
                    {step3Form.formState.errors.defaultPaymentDueDays && (
                      <p className="text-sm text-destructive mt-1">
                        {step3Form.formState.errors.defaultPaymentDueDays.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label>Payment Reminder Schedule (Days Overdue) *</Label>
                    <div className="text-xs text-muted-foreground mb-2">
                      Enter comma-separated values (e.g., 3, 7, 14)
                    </div>
                    <Input
                      placeholder="3, 7, 14"
                      defaultValue={step3Form.watch("paymentReminderDays").join(", ")}
                      onChange={(e) => {
                        const values = e.target.value
                          .split(",")
                          .map(v => parseInt(v.trim()))
                          .filter(v => !isNaN(v) && v > 0);
                        step3Form.setValue("paymentReminderDays", values);
                      }}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Automatic reminders will be sent when an invoice is overdue by these number of days
                    </p>
                    {step3Form.formState.errors.paymentReminderDays && (
                      <p className="text-sm text-destructive mt-1">
                        {step3Form.formState.errors.paymentReminderDays.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label>Job Reminder Schedule (Days Before Appointment) *</Label>
                    <div className="text-xs text-muted-foreground mb-2">
                      Enter comma-separated values (e.g., 1, 3, 7)
                    </div>
                    <Input
                      placeholder="1, 3, 7"
                      defaultValue={step3Form.watch("jobReminderDays").join(", ")}
                      onChange={(e) => {
                        const values = e.target.value
                          .split(",")
                          .map(v => parseInt(v.trim()))
                          .filter(v => !isNaN(v) && v > 0);
                        step3Form.setValue("jobReminderDays", values);
                      }}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Automatic reminders will be sent to customers X days before their scheduled appointment
                    </p>
                    {step3Form.formState.errors.jobReminderDays && (
                      <p className="text-sm text-destructive mt-1">
                        {step3Form.formState.errors.jobReminderDays.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Service Setup Section */}
                <div className="space-y-4 pt-6 border-t">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Create Your First Service</h3>
                    <p className="text-sm text-muted-foreground">
                      Set up a service to start accepting quote requests. You can add more services and configure advanced pricing in the Services page later.
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="serviceName">Service Name *</Label>
                    <Input
                      id="serviceName"
                      value={serviceName}
                      onChange={(e) => setServiceName(e.target.value)}
                      placeholder="e.g., General Plumbing, Window Repair, Garden Services"
                    />
                  </div>

                  <div>
                    <Label htmlFor="serviceDescription">Service Description (Optional)</Label>
                    <Textarea
                      id="serviceDescription"
                      value={serviceDescription}
                      onChange={(e) => setServiceDescription(e.target.value)}
                      placeholder="Brief description of what's included in this service"
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="basePrice">Base Price (R)</Label>
                      <Input
                        id="basePrice"
                        type="number"
                        step="0.01"
                        value={basePrice}
                        onChange={(e) => setBasePrice(e.target.value)}
                        placeholder="0.00"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Starting price for this service
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="hourlyRate">Hourly Rate (R/hour)</Label>
                      <Input
                        id="hourlyRate"
                        type="number"
                        step="0.01"
                        value={hourlyRate}
                        onChange={(e) => setHourlyRate(e.target.value)}
                        placeholder="0.00"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Cost per hour of work
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="travelRate">Travel Rate (R/km)</Label>
                      <Input
                        id="travelRate"
                        type="number"
                        step="0.01"
                        value={travelRate}
                        onChange={(e) => setTravelRate(e.target.value)}
                        placeholder="0.00"
                        disabled={!requiresTravel}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Cost per kilometer traveled
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="requiresTravel"
                      checked={requiresTravel}
                      onCheckedChange={setRequiresTravel}
                    />
                    <Label htmlFor="requiresTravel" className="font-normal">
                      This service requires travel to customer location
                    </Label>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">💡 How AI Pricing Works</h4>
                    <p className="text-sm text-blue-800 mb-2">
                      Based on these rates, our AI will automatically calculate quotes using:
                    </p>
                    <p className="text-xs font-mono text-blue-900 bg-white px-2 py-1 rounded">
                      base_price + (hours × hourly_rate) + (km × travel_rate)
                    </p>
                    <p className="text-xs text-blue-800 mt-2">
                      Need custom formulas or service-specific questions? Visit the <strong>Services</strong> page after onboarding to configure advanced pricing rules.
                    </p>
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <Button type="button" variant="outline" onClick={() => setStep(2)}>
                    Back
                  </Button>
                  <Button type="submit">
                    Next
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Calendar/Booking Settings */}
        {step === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>Calendar & Booking Settings</CardTitle>
              <CardDescription>
                Configure how customers can book appointments with you
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={step4Form.handleSubmit(handleStep4Next)} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="bookingWindowDays">Booking Window (Days) *</Label>
                    <Input
                      id="bookingWindowDays"
                      type="number"
                      {...step4Form.register("bookingWindowDays", { valueAsNumber: true })}
                      placeholder="14"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      How far in advance can customers book? (Recommended: 14 days)
                    </p>
                    {step4Form.formState.errors.bookingWindowDays && (
                      <p className="text-sm text-destructive mt-1">
                        {step4Form.formState.errors.bookingWindowDays.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="minimumNoticeHours">Minimum Notice (Hours) *</Label>
                    <Input
                      id="minimumNoticeHours"
                      type="number"
                      {...step4Form.register("minimumNoticeHours", { valueAsNumber: true })}
                      placeholder="24"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      How much notice do you need before a booking? (Recommended: 24 hours)
                    </p>
                    {step4Form.formState.errors.minimumNoticeHours && (
                      <p className="text-sm text-destructive mt-1">
                        {step4Form.formState.errors.minimumNoticeHours.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="quoteVisitDurationMinutes">Visit Duration (Minutes) *</Label>
                    <Input
                      id="quoteVisitDurationMinutes"
                      type="number"
                      {...step4Form.register("quoteVisitDurationMinutes", { valueAsNumber: true })}
                      placeholder="60"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      How long does a typical site visit take? (Recommended: 60 minutes)
                    </p>
                    {step4Form.formState.errors.quoteVisitDurationMinutes && (
                      <p className="text-sm text-destructive mt-1">
                        {step4Form.formState.errors.quoteVisitDurationMinutes.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <Label>Working Hours *</Label>
                  <p className="text-sm text-muted-foreground">
                    Set your available hours for each day of the week
                  </p>

                  {(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const).map((day) => (
                    <div key={day} className="flex items-center gap-4">
                      <div className="w-28 capitalize font-medium">{day}</div>
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          type="time"
                          value={step4Form.watch(`calendarHours.${day}`)?.start || ""}
                          onChange={(e) => {
                            const current = step4Form.watch(`calendarHours.${day}`);
                            step4Form.setValue(`calendarHours.${day}`, 
                              current ? { ...current, start: e.target.value } : { start: e.target.value, end: "17:00" }
                            );
                          }}
                          disabled={!step4Form.watch(`calendarHours.${day}`)}
                          className="flex-1"
                        />
                        <span className="text-muted-foreground">to</span>
                        <Input
                          type="time"
                          value={step4Form.watch(`calendarHours.${day}`)?.end || ""}
                          onChange={(e) => {
                            const current = step4Form.watch(`calendarHours.${day}`);
                            step4Form.setValue(`calendarHours.${day}`, 
                              current ? { ...current, end: e.target.value } : { start: "09:00", end: e.target.value }
                            );
                          }}
                          disabled={!step4Form.watch(`calendarHours.${day}`)}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant={step4Form.watch(`calendarHours.${day}`) ? "outline" : "secondary"}
                          size="sm"
                          onClick={() => {
                            const current = step4Form.watch(`calendarHours.${day}`);
                            step4Form.setValue(`calendarHours.${day}`, 
                              current ? null : { start: "09:00", end: "17:00" }
                            );
                          }}
                        >
                          {step4Form.watch(`calendarHours.${day}`) ? "Closed" : "Open"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between pt-4">
                  <Button type="button" variant="outline" onClick={() => setStep(3)}>
                    Back
                  </Button>
                  <Button type="submit">
                    Next
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 5: VAT/Tax Configuration */}
        {step === 5 && (
          <Card>
            <CardHeader>
              <CardTitle>VAT & Tax Settings</CardTitle>
              <CardDescription>
                Configure your tax information for accurate invoicing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={step5Form.handleSubmit(handleStep5Next)} className="space-y-6">
                <div>
                  <Label htmlFor="vatNumber">VAT Number (Optional)</Label>
                  <Input
                    id="vatNumber"
                    {...step5Form.register("vatNumber")}
                    placeholder="4123456789"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter your VAT registration number if you are VAT registered
                  </p>
                  {step5Form.formState.errors.vatNumber && (
                    <p className="text-sm text-destructive mt-1">
                      {step5Form.formState.errors.vatNumber.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="vatRate">VAT Rate (%) *</Label>
                  <Input
                    id="vatRate"
                    type="number"
                    step="0.01"
                    {...step5Form.register("vatRate", { valueAsNumber: true })}
                    placeholder="15.00"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Standard VAT rate in South Africa is 15%. Adjust if needed.
                  </p>
                  {step5Form.formState.errors.vatRate && (
                    <p className="text-sm text-destructive mt-1">
                      {step5Form.formState.errors.vatRate.message}
                    </p>
                  )}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">💡 VAT Information</h3>
                  <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                    <li>VAT will be automatically calculated on all quotes and invoices</li>
                    <li>You can change these settings later in Settings → Company</li>
                    <li>If you're not VAT registered, you can set the rate to 0%</li>
                  </ul>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <Label>Deposit Policy (Optional)</Label>
                  <p className="text-sm text-muted-foreground">
                    Require deposits to secure bookings and prevent no-shows
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable deposits by default</Label>
                      <p className="text-sm text-muted-foreground">
                        New quotes will automatically require deposits
                      </p>
                    </div>
                    <Switch
                      checked={step5Form.watch("requireDepositByDefault") || false}
                      onCheckedChange={(checked) => step5Form.setValue("requireDepositByDefault", checked)}
                    />
                  </div>

                  {step5Form.watch("requireDepositByDefault") && (
                    <div>
                      <Label htmlFor="defaultDepositPercentage">Default Deposit Percentage (%)</Label>
                      <Input
                        id="defaultDepositPercentage"
                        type="number"
                        step="1"
                        min="0"
                        max="100"
                        {...step5Form.register("defaultDepositPercentage", { valueAsNumber: true })}
                        placeholder="30"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Percentage of quote total required as deposit (recommended: 30%)
                      </p>
                      {step5Form.formState.errors.defaultDepositPercentage && (
                        <p className="text-sm text-destructive mt-1">
                          {step5Form.formState.errors.defaultDepositPercentage.message}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex justify-between pt-4">
                  <Button type="button" variant="outline" onClick={() => setStep(4)}>
                    Back
                  </Button>
                  <Button type="submit">
                    Next
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* WhatsApp Setup Wizard Modal */}
        {showWhatsAppSetup && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Link Your WhatsApp
              </CardTitle>
              <CardDescription>
                Scan the QR code with your WhatsApp to link your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WhatsAppSetupWizard />
              
              <div className="flex justify-between pt-6 border-t mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowWhatsAppSetup(false);
                    step4Form.setValue("skipWhatsApp", true);
                    step4Form.setValue("whatsappWasenderApiKey", "");
                  }}
                >
                  Skip WhatsApp Setup
                </Button>
                <Button onClick={handleCompleteOnboarding}>
                  Continue to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 6: WhatsApp Connection */}
        {step === 6 && !showWhatsAppSetup && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Connect WhatsApp (Optional)
              </CardTitle>
              <CardDescription>
                Scan QR code to link your WhatsApp account for automated customer messaging
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">✨ Why Connect WhatsApp?</h3>
                  <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                    <li>Send quotes and invoices instantly via WhatsApp</li>
                    <li>Automatic appointment confirmations and reminders</li>
                    <li>Higher customer engagement (90%+ open rates)</li>
                    <li>Free to set up - scan QR code with your phone</li>
                  </ul>
                </div>

                <WhatsAppSetupWizard />

                <div className="flex justify-between pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setStep(5)}>
                    Back
                  </Button>
                  <div className="flex gap-2">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => {
                        step6Form.setValue("skipWhatsApp", true);
                        handleCompleteOnboarding();
                      }}
                      disabled={submitOnboarding.isPending}
                    >
                      Skip for Now
                    </Button>
                    <Button 
                      onClick={handleCompleteOnboarding}
                      disabled={submitOnboarding.isPending}
                    >
                      {submitOnboarding.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Complete Setup"
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
