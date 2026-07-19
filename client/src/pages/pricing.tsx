import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Check, ArrowRight, Loader2, Orbit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { SEOMetaTags } from "@/components/SEOMetaTags";
import { createSoftwareApplicationSchema } from "@/lib/structured-data";

interface SubscriptionPlan {
  id: string;
  displayName: string;
  monthlyPrice: string;
  annualPrice: string;
  features: Record<string, boolean>;
  limits: Record<string, number>;
  trialDays: number;
}

export default function PricingPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [isAnnual, setIsAnnual] = useState(false);
  const [discountCode, setDiscountCode] = useState("");
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);

  const baseUrl = window.location.origin;
  const canonicalUrl = `${baseUrl}/pricing`;

  const structuredData = createSoftwareApplicationSchema(baseUrl);

  // Fetch available plans
  const { data: plans, isLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ["/api/subscriptions/plans"],
  });

  // Validate discount code
  const validateDiscountMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await fetch("/api/subscriptions/validate-discount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Invalid discount code");
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Discount code applied!",
        description: `${data.discountType === "percentage" ? data.discountValue + "%" : "R" + data.discountValue} off`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Invalid discount code",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create subscription
  const createSubscriptionMutation = useMutation({
    mutationFn: async ({ planId, billingFrequency }: { planId: string; billingFrequency: "monthly" | "annually" }) => {
      const response = await fetch("/api/subscriptions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          billingFrequency,
          discountCode: discountCode || undefined
        }),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create subscription");
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Auto-submit to PayFast
      const form = document.createElement("form");
      form.method = "POST";
      form.action = data.action;
      form.target = "_self"; // Ensure same window navigation

      Object.keys(data.formData).forEach((key) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = data.formData[key];
        form.appendChild(input);
      });

      document.body.appendChild(form);

      // Submit immediately - this will navigate away from the page
      // No need to handle response as PayFast will redirect
      form.submit();
    },
    onError: (error: Error) => {
      setLoadingPlanId(null);
      toast({
        title: "Subscription Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubscribe = (planId: string) => {
    // Check authentication before allowing subscription
    if (!isAuthenticated) {
      const returnUrl = encodeURIComponent('/pricing');
      setLocation(`/login?return=${returnUrl}`);
      toast({
        title: "Authentication Required",
        description: "Please log in to subscribe to a plan.",
      });
      return;
    }

    setLoadingPlanId(planId);
    createSubscriptionMutation.mutate({
      planId,
      billingFrequency: isAnnual ? "annually" : "monthly",
    });
  };

  const handleValidateDiscount = () => {
    if (discountCode.trim()) {
      validateDiscountMutation.mutate(discountCode.trim());
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Filter to show only monthly and annual plans (exclude free trial from display)
  const pricingPlans = plans?.filter(p => p.id === "monthly" || p.id === "annual") || [];
  const monthlyPlan = pricingPlans.find(p => p.id === "monthly");
  const annualPlan = pricingPlans.find(p => p.id === "annual");

  const selectedPlan = isAnnual ? annualPlan : monthlyPlan;
  const price = isAnnual ? selectedPlan?.annualPrice : selectedPlan?.monthlyPrice;
  const originalAnnualPrice = monthlyPlan ? parseFloat(monthlyPlan.monthlyPrice) * 12 : 0;
  const annualSavings = originalAnnualPrice - parseFloat(annualPlan?.annualPrice || "0");

  return (
    <>
      <SEOMetaTags
        title="Pricing - ServiceLoop | Affordable Plans for Service Businesses"
        description="Simple, transparent pricing for South African service businesses. Get your smart website, CRM, and booking system from R350/month. No setup fees, cancel anytime."
        keywords="service business pricing, crm pricing south africa, small business software pricing, website pricing, booking system pricing"
        canonicalUrl={canonicalUrl}
        structuredData={structuredData}
      />
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Header */}
        <section className="py-20 px-6">
          <div className="container mx-auto max-w-4xl text-center py-20 mt-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Badge className="mb-4 bg-black text-white hover:bg-black">
                14-Day Free Trial • No Credit Card Required
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Simple, Transparent Pricing
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                Try free for 14 days. Cancel anytime. Upgrade or downgrade with ease.
              </p>
            </motion.div>

            {/* Billing Toggle */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center justify-center gap-4 mb-12"
            >
              <span className={`text-sm font-medium ${!isAnnual ? "text-black" : "text-gray-500"}`}>
                Monthly
              </span>
              <Switch
                checked={isAnnual}
                onCheckedChange={setIsAnnual}
                className="data-[state=checked]:bg-black"
              />
              <span className={`text-sm font-medium ${isAnnual ? "text-black" : "text-gray-500"}`}>
                Annual
              </span>
              {isAnnual && (
                <Badge variant="secondary" className="bg-black text-white">
                  Save R{annualSavings.toFixed(0)}
                </Badge>
              )}
            </motion.div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="pb-20 px-6">
          <div className="container mx-auto max-w-6xl">
            <div className="flex justify-center">
              {/* Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="w-full max-w-md"
              >
                <Card className="border-2 border-black transition-all duration-300 h-full flex flex-col">
                  {/* Launch Price Badge */}
                  <div className="bg-black text-white py-3 px-6 text-center">
                    <p className="text-sm font-bold tracking-wider uppercase">LAUNCH PRICE</p>
                  </div>

                  <CardHeader className="text-center pt-8">
                    <p className="text-sm text-gray-600 mb-2">1 user</p>
                    <CardTitle className="text-4xl font-bold mb-3">
                      Connect
                    </CardTitle>
                    <CardDescription className="text-base">
                      Automations and must-have integrations to reduce admin work and impress customers.
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="flex-grow px-8">
                    {/* Price */}
                    <div className="mb-8 text-center">
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-5xl font-bold">R{price}</span>
                        <span className="text-xl text-gray-600 font-medium">
                          {isAnnual ? "/yr" : "/mo"}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2 font-medium">
                        {isAnnual ? "Billed annually" : "Billed monthly"}
                      </p>
                    </div>

                    {/* CTA Button */}
                    <Button
                      className="w-full bg-black hover:bg-gray-800 text-white mb-8 py-6 text-base font-semibold"
                      size="lg"
                      onClick={() => handleSubscribe(selectedPlan?.id || "monthly")}
                      disabled={loadingPlanId === selectedPlan?.id || authLoading}
                    >
                      {loadingPlanId === selectedPlan?.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : isAuthenticated ? (
                        "Subscribe Now"
                      ) : (
                        "Start Free Trial"
                      )}
                    </Button>

                    {/* Features */}
                    <div className="space-y-1">
                      <p className="text-sm font-bold mb-4">All Core features, plus:</p>
                      <div className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-black flex-shrink-0 mt-0.5 font-bold" strokeWidth={3} />
                        <span className="text-sm">Send automated reminders</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-black flex-shrink-0 mt-0.5 font-bold" strokeWidth={3} />
                        <span className="text-sm">Collect payments automatically</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-black flex-shrink-0 mt-0.5 font-bold" strokeWidth={3} />
                        <span className="text-sm">Document work on job forms</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-black flex-shrink-0 mt-0.5 font-bold" strokeWidth={3} />
                        <span className="text-sm">Automate quote and invoice follow-ups</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-black flex-shrink-0 mt-0.5 font-bold" strokeWidth={3} />
                        <span className="text-sm">Connect QuickBooks Online</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-black flex-shrink-0 mt-0.5 font-bold" strokeWidth={3} />
                        <span className="text-sm">Track time and expenses</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Discount Code */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-8 max-w-md mx-auto"
            >
              <Card>
                <CardContent className="pt-6">
                  <Label htmlFor="discount-code" className="text-sm font-medium mb-2 block">
                    Have a discount code?
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="discount-code"
                      placeholder="Enter code"
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                      className="flex-grow"
                    />
                    <Button
                      variant="outline"
                      onClick={handleValidateDiscount}
                      disabled={!discountCode.trim() || validateDiscountMutation.isPending}
                    >
                      {validateDiscountMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Apply"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Trial Info */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-12 text-center text-sm text-gray-600 max-w-2xl mx-auto"
            >
              <p className="mb-2">
                <strong>14-Day Free Trial:</strong> Full access to all features. No credit card required to start.
              </p>
              <p>
                After your trial, choose to continue with monthly or annual billing. Cancel anytime with no questions asked.
              </p>
            </motion.div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 px-6 bg-gray-50">
          <div className="container mx-auto max-w-3xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-12" style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', color: '#42474d' }}>
              Common Questions
            </h2>
            <div className="max-w-3xl">
              <Accordion type="single" collapsible className="space-y-0">
                <AccordionItem value="trial" className="border-b border-gray-200">
                  <AccordionTrigger 
                    className="text-left py-6 hover:no-underline"
                    style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 600, fontSize: '18px', color: '#42474d' }}
                  >
                    What happens after the 14-day trial?
                  </AccordionTrigger>
                  <AccordionContent 
                    className="pb-6 pt-2"
                    style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 400, fontSize: '16px', lineHeight: '24px', color: '#42474d' }}
                  >
                    After your trial, you'll be prompted to choose a paid plan. Your data is safe - nothing gets deleted.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="cancel" className="border-b border-gray-200">
                  <AccordionTrigger 
                    className="text-left py-6 hover:no-underline"
                    style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 600, fontSize: '18px', color: '#42474d' }}
                  >
                    Can I cancel anytime?
                  </AccordionTrigger>
                  <AccordionContent 
                    className="pb-6 pt-2"
                    style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 400, fontSize: '16px', lineHeight: '24px', color: '#42474d' }}
                  >
                    Yes! Cancel your subscription at any time from your account settings. No questions asked.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="payment" className="border-b border-gray-200">
                  <AccordionTrigger 
                    className="text-left py-6 hover:no-underline"
                    style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 600, fontSize: '18px', color: '#42474d' }}
                  >
                    What payment methods do you accept?
                  </AccordionTrigger>
                  <AccordionContent 
                    className="pb-6 pt-2"
                    style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 400, fontSize: '16px', lineHeight: '24px', color: '#42474d' }}
                  >
                    We accept all major credit cards, debit cards, and instant EFT via PayFast - South Africa's trusted payment gateway.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="annual" className="border-b border-gray-200">
                  <AccordionTrigger 
                    className="text-left py-6 hover:no-underline"
                    style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 600, fontSize: '18px', color: '#42474d' }}
                  >
                    How does the annual plan work?
                  </AccordionTrigger>
                  <AccordionContent 
                    className="pb-6 pt-2"
                    style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 400, fontSize: '16px', lineHeight: '24px', color: '#42474d' }}
                  >
                    The annual plan is billed once per year and saves you R{annualSavings.toFixed(0)} compared to monthly billing.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}