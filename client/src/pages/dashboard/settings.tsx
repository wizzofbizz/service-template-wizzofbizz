import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { AddressAutocomplete, type AddressData } from "@/components/ui/address-autocomplete";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { DollarSign, AlertCircle, Plus, MessageSquare, CreditCard, Calendar as CalendarIcon } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { WaSenderQRLink } from "@/components/WaSenderQRLink";

interface DayHours {
  open: string;
  close: string;
  closed?: boolean;
}

interface RegularHours {
  monday?: DayHours;
  tuesday?: DayHours;
  wednesday?: DayHours;
  thursday?: DayHours;
  friday?: DayHours;
  saturday?: DayHours;
  sunday?: DayHours;
}


function PasswordChangeForm() {
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to change password");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Password Updated",
        description: "Your password has been changed successfully",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 8) {
      toast({
        title: "Invalid Password",
        description: "Password must be at least 8 characters long",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "New password and confirmation do not match",
        variant: "destructive",
      });
      return;
    }

    changePasswordMutation.mutate({ currentPassword, newPassword });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="currentPassword">Current Password</Label>
        <Input
          id="currentPassword"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="newPassword">New Password</Label>
        <Input
          id="newPassword"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        <p className="text-xs text-muted-foreground">
          Must be at least 8 characters long
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm New Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
      </div>
      <Button
        type="submit"
        disabled={changePasswordMutation.isPending}
        style={{ backgroundColor: 'hsl(var(--brand))', borderColor: 'hsl(var(--brand))' }}
      >
        {changePasswordMutation.isPending ? "Updating..." : "Update Password"}
      </Button>
    </form>
  );
}

function CustomDomainTab() {
  const { business } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [domainType, setDomainType] = useState<"full" | "quote_subdomain">("full");
  const [domain, setDomain] = useState("");
  const [selectedDomainId, setSelectedDomainId] = useState<string | null>(null);

  // Fetch existing domains
  const { data: domains = [], isLoading } = useQuery({
    queryKey: ["/api/custom-domains"],
    enabled: !!business?.id,
  });

  // Fetch server IP for DNS instructions
  const { data: serverConfig, isLoading: isLoadingServerIp } = useQuery({
    queryKey: ["/api/config/server-ip"],
    queryFn: async () => {
      const res = await fetch('/api/config/server-ip');
      if (!res.ok) throw new Error('Failed to fetch server IP');
      return res.json();
    },
  });

  const serverIp = serverConfig?.serverIp || "Loading...";

  // Add domain mutation
  const addDomainMutation = useMutation({
    mutationFn: async (data: { domainType: string; domain: string }) => {
      const response = await fetch("/api/custom-domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add domain");
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-domains"] });
      setSelectedDomainId(data.id);
      setDomain("");
      toast({
        title: "Domain Added",
        description: "Your custom domain has been added. Please configure DNS records.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Verify domain mutation
  const verifyDomainMutation = useMutation({
    mutationFn: async (domainId: string) => {
      const response = await fetch(`/api/custom-domains/${domainId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ method: "a_record" }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "DNS verification failed");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-domains"] });
      toast({
        title: "Domain Verified",
        description: "Your domain has been successfully verified!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Verification Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete domain mutation
  const deleteDomainMutation = useMutation({
    mutationFn: async (domainId: string) => {
      const response = await fetch(`/api/custom-domains/${domainId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to delete domain");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-domains"] });
      setSelectedDomainId(null);
      toast({
        title: "Domain Removed",
        description: "Your custom domain has been removed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddDomain = () => {
    if (!domain) {
      toast({
        title: "Error",
        description: "Please enter a domain name",
        variant: "destructive",
      });
      return;
    }

    // Check if business already has a domain of this type
    const existingOfType = domains.find((d: any) => d.domainType === domainType);
    if (existingOfType) {
      const typeLabel = domainType === 'full' ? 'full website' : 'quote subdomain';
      toast({
        title: "Domain Limit Reached",
        description: `You already have a ${typeLabel} domain (${existingOfType.domain}). Please remove it first if you want to add a different one.`,
        variant: "destructive",
      });
      return;
    }

    addDomainMutation.mutate({ domainType, domain });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return <Badge className="bg-green-500">Verified</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSSLBadge = (sslStatus: string) => {
    switch (sslStatus) {
      case "issued":
        return <Badge className="bg-green-500">SSL Issued</Badge>;
      case "pending":
        return <Badge variant="secondary">SSL Pending</Badge>;
      case "failed":
        return <Badge variant="destructive">SSL Failed</Badge>;
      default:
        return <Badge variant="outline">{sslStatus}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Custom Domain</CardTitle>
          <CardDescription>
            Connect your own domain to your business website or quote pages
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Add New Domain */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Add Custom Domain</h3>

            <div className="space-y-3">
              <Label>Domain Type</Label>
              <RadioGroup value={domainType} onValueChange={(value) => setDomainType(value as "full" | "quote_subdomain")}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="full" id="full" />
                  <Label htmlFor="full" className="font-normal cursor-pointer">
                    <div>
                      <div className="font-medium">Full website</div>
                      <div className="text-sm text-muted-foreground">
                        Example: plumbingfix.co.za (entire website)
                      </div>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="quote_subdomain" id="quote_subdomain" />
                  <Label htmlFor="quote_subdomain" className="font-normal cursor-pointer">
                    <div>
                      <div className="font-medium">Quote page only</div>
                      <div className="text-sm text-muted-foreground">
                        Example: quote.plumbingfix.co.za (quote pages only)
                      </div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="domain">Domain Name</Label>
              <div className="flex gap-2">
                <Input
                  id="domain"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder={domainType === "full" ? "plumbingfix.co.za" : "quote.plumbingfix.co.za"}
                  className="flex-1"
                />
                <Button
                  onClick={handleAddDomain}
                  disabled={
                    addDomainMutation.isPending ||
                    !domain ||
                    domains.some((d: any) => d.domainType === domainType)
                  }
                  style={{ backgroundColor: 'hsl(var(--brand))', borderColor: 'hsl(var(--brand))' }}
                >
                  {addDomainMutation.isPending ? "Adding..." : "Add Domain"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Enter your domain without http:// or https://
              </p>
              {domains.some((d: any) => d.domainType === domainType) && (
                <p className="text-xs text-orange-600 flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3" />
                  You already have a {domainType === 'full' ? 'full website' : 'quote subdomain'} domain. Remove it first to add a new one.
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Existing Domains */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Your Domains</h3>

            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading domains...</p>
            ) : domains.length === 0 ? (
              <p className="text-sm text-muted-foreground">No custom domains configured yet.</p>
            ) : (
              <div className="space-y-4">
                {domains.map((domainData: any) => (
                  <Card key={domainData.id}>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">{domainData.domain}</h4>
                              <Badge variant="outline">
                                {domainData.domainType === "full" ? "Full Website" : "Quote Subdomain"}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(domainData.status)}
                              {getSSLBadge(domainData.sslStatus)}
                            </div>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteDomainMutation.mutate(domainData.id)}
                            disabled={deleteDomainMutation.isPending}
                          >
                            Remove
                          </Button>
                        </div>

                        {domainData.status !== "verified" && (
                          <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>DNS Configuration Required</AlertTitle>
                            <AlertDescription>
                              <div className="space-y-3 mt-2">
                                <p className="text-sm">
                                  Add the following DNS records to your domain registrar:
                                </p>

                                <div className="bg-muted p-3 rounded-md space-y-2">
                                  <div>
                                    <p className="text-xs font-semibold">A Record:</p>
                                    <p className="text-xs font-mono">
                                      Name: @ (or your domain)<br />
                                      Type: A<br />
                                      Value: {serverIp}<br />
                                      TTL: 3600
                                    </p>
                                  </div>

                                  <div>
                                    <p className="text-xs font-semibold">TXT Record (Verification):</p>
                                    <p className="text-xs font-mono break-all">
                                      Name: _verification<br />
                                      Type: TXT<br />
                                      Value: {domainData.verificationToken}<br />
                                      TTL: 3600
                                    </p>
                                  </div>
                                </div>

                                <Button
                                  onClick={() => verifyDomainMutation.mutate(domainData.id)}
                                  disabled={verifyDomainMutation.isPending}
                                  size="sm"
                                  className="mt-2"
                                  style={{ backgroundColor: 'hsl(var(--brand))', borderColor: 'hsl(var(--brand))' }}
                                >
                                  {verifyDomainMutation.isPending ? "Verifying..." : "Verify DNS"}
                                </Button>
                              </div>
                            </AlertDescription>
                          </Alert>
                        )}

                        {domainData.status === "verified" && domainData.sslStatus === "issued" && (
                          <Alert className="bg-green-50 border-green-200">
                            <AlertCircle className="h-4 w-4 text-green-600" />
                            <AlertTitle className="text-green-800">Domain Active</AlertTitle>
                            <AlertDescription className="text-green-700">
                              Your domain is verified and SSL certificate is issued. Your {domainData.domainType === "full" ? "website" : "quote pages"} {domainData.domainType === "full" ? "is" : "are"} now accessible at https://{domainData.domain}
                            </AlertDescription>
                          </Alert>
                        )}

                        {domainData.lastVerifiedAt && (
                          <p className="text-xs text-muted-foreground">
                            Last verified: {new Date(domainData.lastVerifiedAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SettingsPage() {
  const pageStyle = { fontFamily: 'var(--font-sans)' };
  const { user, business } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Track if there are unsaved changes
  const [hasChanges, setHasChanges] = useState(false);

  // Whether the SERVER has PayFast credentials. The owner controls whether to
  // offer online payment; only the deployer can supply the merchant keys.
  const { data: paymentStatus } = useQuery<{
    credentialsConfigured: boolean;
    sandbox: boolean;
  }>({
    queryKey: ["/api/payments/config-status"],
  });

  // State for business data, including new deposit policy fields
  const [businessData, setBusinessData] = useState({
    businessName: business?.businessName || "",
    email: business?.email || "",
    phone: business?.phone || "",
    addressLine1: business?.addressLine1 || "",
    addressLine2: business?.addressLine2 || "",
    city: business?.city || "",
    province: business?.province || "",
    postalCode: business?.postalCode || "",
    industry: business?.industry || "",
    businessDescription: business?.businessDescription || "",
    websiteUrl: business?.websiteUrl || "",
    whatsappNumber: business?.whatsappNumber || "",
    logoUrl: business?.logoUrl || "",
    primaryColor: business?.primaryColor || "#217BF4",
    vatNumber: business?.vatNumber || "",
    vatRate: business?.vatRate || 15,
    defaultPaymentDueDays: business?.defaultPaymentDueDays || 30,
    paymentReminderDays: business?.paymentReminderDays || [3, 7, 14],
    senderEmail: business?.senderEmail || "",
    senderName: business?.senderName || "",
    businessWhatsapp: business?.businessWhatsapp || "",
    whatsappWasenderApiKey: business?.whatsappWasenderApiKey || "",
    whatsappProvider: business?.whatsappProvider || "twilio",
    quoteFollowupDays: business?.quoteFollowupDays || [3, 7, 14],
    jobReminderDays: business?.jobReminderDays || [1, 3, 7],
    bookingWindowDays: business?.bookingWindowDays || 14,
    minimumNoticeHours: business?.minimumNoticeHours || 24,
    timeSlotIntervalMinutes: business?.timeSlotIntervalMinutes || 15,
    quoteVisitDurationMinutes: business?.quoteVisitDurationMinutes || 60,
    bufferBetweenVisitsMinutes: business?.bufferBetweenVisitsMinutes || 15,
    calendarHours: business?.calendarHours || {
      monday: { start: "09:00", end: "17:00" },
      tuesday: { start: "09:00", end: "17:00" },
      wednesday: { start: "09:00", end: "17:00" },
      thursday: { start: "09:00", end: "17:00" },
      friday: { start: "09:00", end: "17:00" },
      saturday: null,
      sunday: null,
    },
    whatsappCurrentUsage: business?.whatsappCurrentUsage || 0,
    whatsappMonthlyLimit: business?.whatsappMonthlyLimit || 1000,
    whatsappOverageAllowed: business?.whatsappOverageAllowed || false,
    // Deposit Policy Fields
    requireDepositByDefault: business?.requireDepositByDefault || false,
    bookingMode: business?.bookingMode || "quote_first",
    onlinePaymentsEnabled: business?.onlinePaymentsEnabled || false,
    acceptInvoicePayments: business?.acceptInvoicePayments !== false,
    acceptDepositPayments: business?.acceptDepositPayments !== false,
    defaultDepositPercentage: business?.defaultDepositPercentage || 30,
    depositCancellationMode: business?.depositCancellationMode || "manual",
    depositCancellationThresholdHours: business?.depositCancellationThresholdHours || 48,
    depositReminderHours: business?.depositReminderHours || [48, 24, 12],
    gbpReviewUrl: business?.gbpReviewUrl || "",
  });

  // Track raw input strings for comma-separated fields
  const [quoteFollowupInput, setQuoteFollowupInput] = useState(
    Array.isArray(business?.quoteFollowupDays) ? business.quoteFollowupDays.join(", ") : "3, 7, 14"
  );
  const [jobReminderInput, setJobReminderInput] = useState(
    Array.isArray(business?.jobReminderDays) ? business.jobReminderDays.join(", ") : "1, 3, 7"
  );
  const [paymentReminderInput, setPaymentReminderInput] = useState(
    Array.isArray(business?.paymentReminderDays) ? business.paymentReminderDays.join(", ") : "3, 7, 14"
  );
  const [openDepositReminderDialog, setOpenDepositReminderDialog] = useState(false);

  const updateBusinessMutation = useMutation({
    mutationFn: async (data: typeof businessData) => {
      const response = await fetch("/api/business/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update business profile");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth"] });
      setHasChanges(false);
      toast({
        title: "Success",
        description: "Business profile updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update business profile",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateBusinessMutation.mutate(businessData);
  };

  return (
    <div className="space-y-6" style={pageStyle}>
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your business profile and preferences
        </p>
      </div>

      <Tabs defaultValue="business" className="space-y-4">
        <div className="overflow-x-auto -mx-6 px-6 md:mx-0 md:px-0">
          <TabsList className="inline-flex min-w-full md:min-w-0">
            <TabsTrigger value="business" className="whitespace-nowrap">Business</TabsTrigger>
            <TabsTrigger value="google" className="whitespace-nowrap">Google</TabsTrigger>
            <TabsTrigger value="calendar" className="whitespace-nowrap">Calendar</TabsTrigger>
            <TabsTrigger value="deposit" className="whitespace-nowrap">Deposit</TabsTrigger>
            <TabsTrigger value="whatsapp" className="whitespace-nowrap">WhatsApp</TabsTrigger>
            <TabsTrigger value="booking" className="whitespace-nowrap">Booking</TabsTrigger>
            <TabsTrigger value="payments" className="whitespace-nowrap">Payments</TabsTrigger>
            <TabsTrigger value="account" className="whitespace-nowrap">Account</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="business" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>
                Update your business details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="logoUrl">Business Logo URL</Label>
                <Input
                  id="logoUrl"
                  value={businessData.logoUrl}
                  onChange={(e) =>
                    setBusinessData({ ...businessData, logoUrl: e.target.value })
                  }
                  placeholder="https://example.com/logo.png"
                />
                <p className="text-xs text-muted-foreground">
                  URL to your business logo displayed on your website
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="primaryColor">Primary Brand Color</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="primaryColor"
                    type="color"
                    value={businessData.primaryColor}
                    onChange={(e) =>
                      setBusinessData({ ...businessData, primaryColor: e.target.value })
                    }
                    className="w-20 h-12 cursor-pointer"
                  />
                  <Input
                    value={businessData.primaryColor}
                    onChange={(e) =>
                      setBusinessData({ ...businessData, primaryColor: e.target.value })
                    }
                    placeholder="#217BF4"
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  This color is used for buttons, links, and accents on your website
                </p>
              </div>

              <Separator />

              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    value={businessData.businessName}
                    onChange={(e) =>
                      setBusinessData({ ...businessData, businessName: e.target.value })
                    }
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Business Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={businessData.email}
                    onChange={(e) =>
                      setBusinessData({ ...businessData, email: e.target.value })
                    }
                    className="w-full"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={businessData.phone}
                  onChange={(e) =>
                    setBusinessData({ ...businessData, phone: e.target.value })
                  }
                  placeholder="+27 11 123 4567"
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Industry & Description</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <select
                    id="industry"
                    value={businessData.industry}
                    onChange={(e) => {
                      setBusinessData({ ...businessData, industry: e.target.value });
                      setHasChanges(true);
                    }}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">Select Industry</option>
                    <option value="Plumbing">Plumbing</option>
                    <option value="Electrical">Electrical</option>
                    <option value="HVAC">HVAC</option>
                    <option value="Cleaning">Cleaning</option>
                    <option value="Landscaping">Landscaping</option>
                    <option value="Pool Maintenance">Pool Maintenance</option>
                    <option value="Pest Control">Pest Control</option>
                    <option value="Handyman">Handyman</option>
                    <option value="Painting">Painting</option>
                    <option value="Roofing">Roofing</option>
                    <option value="Construction">Construction</option>
                  </select>
                  <p className="text-xs text-muted-foreground">
                    Your industry helps us customize services and templates
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessDescription">Business Description</Label>
                  <Textarea
                    id="businessDescription"
                    value={businessData.businessDescription || business?.businessDescription || ""}
                    onChange={(e) =>
                      setBusinessData({ ...businessData, businessDescription: e.target.value })
                    }
                    placeholder="Describe your business and what makes it unique..."
                    rows={4}
                    maxLength={500}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>This appears in your website's About section and helps with SEO</span>
                    <span>{(businessData.businessDescription || business?.businessDescription || "").length}/500</span>
                  </div>
                </div>
              </div>

              <Separator />

              <AddressAutocomplete
                value={businessData.addressLine1 || ""}
                onAddressSelect={(address: AddressData) => {
                  setBusinessData({
                    ...businessData,
                    addressLine1: address.addressLine1,
                    city: address.city,
                    province: address.province,
                    postalCode: address.postalCode,
                  });
                }}
                label="Business Address"
                required
                placeholder="Start typing your business address..."
              />

              <div className="space-y-2">
                <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
                <Input
                  id="addressLine2"
                  value={businessData.addressLine2}
                  onChange={(e) =>
                    setBusinessData({ ...businessData, addressLine2: e.target.value })
                  }
                  placeholder="Unit, Suite, Building, etc."
                />
                <p className="text-xs text-muted-foreground">
                  Add unit/suite numbers if applicable
                </p>
              </div>

              <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={businessData.city}
                    onChange={(e) =>
                      setBusinessData({ ...businessData, city: e.target.value })
                    }
                    placeholder="Auto-filled from address"
                    readOnly
                    className="bg-gray-50 w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="province">Province</Label>
                  <Input
                    id="province"
                    value={businessData.province}
                    onChange={(e) =>
                      setBusinessData({ ...businessData, province: e.target.value })
                    }
                    placeholder="Auto-filled from address"
                    readOnly
                    className="bg-gray-50 w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    value={businessData.postalCode}
                    onChange={(e) =>
                      setBusinessData({ ...businessData, postalCode: e.target.value })
                    }
                    placeholder="Auto-filled from address"
                    readOnly
                    className="bg-gray-50 w-full"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Website Settings</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="slug">Website URL</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">smartwebsite.co.za/</span>
                    <Input
                      id="slug"
                      value={business?.slug || ""}
                      disabled
                      className="flex-1 bg-gray-50"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Your website slug cannot be changed after creation. Contact support if you need to change it.
                  </p>
                  <a 
                    href={window.location.origin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    View your website →
                  </a>
                </div>

                <div className="space-y-2">
                  <Label>Website Template</Label>
                  <div className="p-3 bg-gray-50 rounded-md">
                    <p className="text-sm font-medium">Classic Service Provider</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Professional template optimized for {business?.industry || "service businesses"}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Template switching coming soon. Use the Website Editor to customize your current template.
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Online Presence (Optional)</Label>

                <div className="space-y-2">
                  <Label htmlFor="websiteUrl" className="text-sm font-normal text-muted-foreground">External Website URL</Label>
                  <Input
                    id="websiteUrl"
                    value={businessData.websiteUrl}
                    onChange={(e) =>
                      setBusinessData({ ...businessData, websiteUrl: e.target.value })
                    }
                    placeholder="https://yourwebsite.com"
                  />
                  <p className="text-xs text-muted-foreground">
                    Link to an external website if you have one
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whatsappNumber" className="text-sm font-normal text-muted-foreground">WhatsApp Business Number</Label>
                  <Input
                    id="whatsappNumber"
                    value={businessData.whatsappNumber}
                    onChange={(e) =>
                      setBusinessData({ ...businessData, whatsappNumber: e.target.value })
                    }
                    placeholder="+27 11 123 4567"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Tax & Financial Settings</Label>

                <div className="space-y-2">
                  <Label htmlFor="vatNumber" className="text-sm font-normal text-muted-foreground">VAT/Tax Registration Number</Label>
                  <Input
                    id="vatNumber"
                    value={businessData.vatNumber || ""}
                    onChange={(e) =>
                      setBusinessData({ ...businessData, vatNumber: e.target.value })
                    }
                    placeholder="e.g., 4123456789"
                  />
                  <p className="text-xs text-muted-foreground">
                    Your VAT/Tax registration number (appears on invoices and quotes)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vatRate" className="text-sm font-normal text-muted-foreground">VAT/Tax Rate (%)</Label>
                  <Input
                    id="vatRate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={businessData.vatRate || 15}
                    onChange={(e) =>
                      setBusinessData({ ...businessData, vatRate: parseFloat(e.target.value) || 15 })
                    }
                    placeholder="15"
                  />
                  <p className="text-xs text-muted-foreground">
                    Default VAT/Tax rate applied to quotes and invoices (South Africa default is 15%)
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Email Settings</Label>

                <div className="space-y-2">
                  <Label htmlFor="senderName" className="text-sm font-normal text-muted-foreground">Sender Name</Label>
                  <Input
                    id="senderName"
                    value={businessData.senderName || businessData.businessName}
                    onChange={(e) =>
                      setBusinessData({ ...businessData, senderName: e.target.value })
                    }
                    placeholder={businessData.businessName}
                  />
                  <p className="text-xs text-muted-foreground">
                    Name that appears in email "From" field (defaults to business name)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="senderEmail" className="text-sm font-normal text-muted-foreground">Sender Email Address</Label>
                  <Input
                    id="senderEmail"
                    type="email"
                    value={businessData.senderEmail || ""}
                    onChange={(e) =>
                      setBusinessData({ ...businessData, senderEmail: e.target.value })
                    }
                    placeholder="noreply@yourdomain.com"
                  />
                  <p className="text-xs text-muted-foreground">
                    Custom sender email (requires domain verification). Leave blank to use default.
                  </p>
                  {business?.senderEmailVerified && businessData.senderEmail && (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <span>✓</span> Email verified
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Communication Settings</Label>

                <div className="space-y-2">
                  <Label htmlFor="businessWhatsapp" className="text-sm font-normal text-muted-foreground">Business WhatsApp Number</Label>
                  <Input
                    id="businessWhatsapp"
                    value={businessData.businessWhatsapp || ""}
                    onChange={(e) =>
                      setBusinessData({ ...businessData, businessWhatsapp: e.target.value })
                    }
                    placeholder="+27 11 123 4567"
                  />
                  <p className="text-xs text-muted-foreground">
                    WhatsApp Business number for future notifications (not yet active)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whatsappWasenderApiKey" className="text-sm font-normal text-muted-foreground">WaSender API Key (Optional)</Label>
                  <Input
                    id="whatsappWasenderApiKey"
                    type="password"
                    value={businessData.whatsappWasenderApiKey || ""}
                    onChange={(e) =>
                      setBusinessData({ ...businessData, whatsappWasenderApiKey: e.target.value })
                    }
                    placeholder="Enter your WaSender API key"
                  />
                  <p className="text-xs text-muted-foreground">
                    Alternative WhatsApp provider API key. Leave blank to use default Twilio integration.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-normal text-muted-foreground">WhatsApp Provider</Label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="whatsappProvider"
                        value="twilio"
                        checked={(businessData.whatsappProvider || 'twilio') === 'twilio'}
                        onChange={(e) =>
                          setBusinessData({ ...businessData, whatsappProvider: e.target.value })
                        }
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Twilio (Default)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="whatsappProvider"
                        value="wasender"
                        checked={businessData.whatsappProvider === 'wasender'}
                        onChange={(e) =>
                          setBusinessData({ ...businessData, whatsappProvider: e.target.value })
                        }
                        className="w-4 h-4"
                        disabled={!businessData.whatsappWasenderApiKey}
                      />
                      <span className="text-sm">WaSender {!businessData.whatsappWasenderApiKey && '(API key required)'}</span>
                    </label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Select which provider to use for WhatsApp messaging. WaSender requires an API key to be entered above.
                  </p>

                  {/* Provider Comparison Table */}
                  <div className="mt-4 rounded-lg border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left p-2 font-medium">Feature</th>
                          <th className="text-left p-2 font-medium">Twilio</th>
                          <th className="text-left p-2 font-medium">WaSender</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        <tr>
                          <td className="p-2">Cost per message</td>
                          <td className="p-2">R0.40</td>
                          <td className="p-2">Varies by plan</td>
                        </tr>
                        <tr>
                          <td className="p-2">Setup complexity</td>
                          <td className="p-2">✓ Built-in</td>
                          <td className="p-2">Requires API key</td>
                        </tr>
                        <tr>
                          <td className="p-2">Delivery tracking</td>
                          <td className="p-2">✓ Full support</td>
                          <td className="p-2">✓ Full support</td>
                        </tr>
                        <tr>
                          <td className="p-2">Best for</td>
                          <td className="p-2">Easy setup, reliable</td>
                          <td className="p-2">Custom pricing plans</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Automation Settings</Label>

                <div className="space-y-2">
                  <Label htmlFor="quoteFollowupDays" className="text-sm font-normal text-muted-foreground">Quote Follow-up Schedule (Days After)</Label>
                  <Input
                    id="quoteFollowupDays"
                    placeholder="3, 7, 14"
                    value={quoteFollowupInput}
                    onChange={(e) => {
                      setQuoteFollowupInput(e.target.value);
                      const values = e.target.value
                        .split(",")
                        .map(v => parseInt(v.trim()))
                        .filter(v => !isNaN(v) && v > 0);
                      setBusinessData({ ...businessData, quoteFollowupDays: values });
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Send automatic follow-up emails to customers X days after sending quote (e.g., 3, 7, 14)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jobReminderDays" className="text-sm font-normal text-muted-foreground">Job Reminder Schedule (Days Before)</Label>
                  <Input
                    id="jobReminderDays"
                    placeholder="1, 3, 7"
                    value={jobReminderInput}
                    onChange={(e) => {
                      setJobReminderInput(e.target.value);
                      const values = e.target.value
                        .split(",")
                        .map(v => parseInt(v.trim()))
                        .filter(v => !isNaN(v) && v > 0);
                      setBusinessData({ ...businessData, jobReminderDays: values });
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Send reminder emails to customers X days before their scheduled job
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Payment Settings</Label>

                <div className="space-y-2">
                  <Label htmlFor="defaultPaymentDueDays" className="text-sm font-normal text-muted-foreground">Default Payment Due Date (Days)</Label>
                  <Input
                    id="defaultPaymentDueDays"
                    type="number"
                    value={businessData.defaultPaymentDueDays}
                    onChange={(e) =>
                      setBusinessData({ ...businessData, defaultPaymentDueDays: parseInt(e.target.value) || 30 })
                    }
                    placeholder="30"
                  />
                  <p className="text-xs text-muted-foreground">
                    Number of days until payment is due for new invoices (e.g., 30 for net 30)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentReminderDays" className="text-sm font-normal text-muted-foreground">Payment Reminder Schedule (Days Overdue)</Label>
                  <Input
                    id="paymentReminderDays"
                    placeholder="3, 7, 14"
                    value={paymentReminderInput}
                    onChange={(e) => {
                      setPaymentReminderInput(e.target.value);
                      const values = e.target.value
                        .split(",")
                        .map(v => parseInt(v.trim()))
                        .filter(v => !isNaN(v) && v > 0);
                      setBusinessData({ ...businessData, paymentReminderDays: values });
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter comma-separated values. Automatic reminders will be sent when an invoice is overdue by these number of days.
                  </p>
                </div>
              </div>

              <Separator />

              <Button
                onClick={handleSave}
                disabled={updateBusinessMutation.isPending}
                style={{ backgroundColor: 'hsl(var(--brand))', borderColor: 'hsl(var(--brand))' }}
              >
                {updateBusinessMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="google" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Google Reviews</CardTitle>
              <CardDescription>
                Configure your Google Business Profile review link for automated review requests
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="gbpReviewUrl">Google Business Profile Review URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="gbpReviewUrl"
                    value={businessData.gbpReviewUrl}
                    onChange={(e) => {
                      setBusinessData({ ...businessData, gbpReviewUrl: e.target.value });
                      setHasChanges(true);
                    }}
                    placeholder="https://g.page/r/YOUR_PLACE_ID/review"
                    className="flex-1"
                  />
                  {businessData.gbpReviewUrl && (
                    <Button
                      variant="outline"
                      onClick={() => window.open(businessData.gbpReviewUrl, '_blank')}
                      type="button"
                    >
                      Preview
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  This link will be sent to customers after job completion to request Google reviews
                </p>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>How to find your review URL</AlertTitle>
                <AlertDescription>
                  <ol className="list-decimal list-inside space-y-2 mt-2 text-sm">
                    <li>Go to your Google Business Profile</li>
                    <li>Find the "Ask for reviews" or "Get more reviews" option</li>
                    <li>Copy the short URL (it starts with https://g.page/r/)</li>
                    <li>Paste it in the field above</li>
                  </ol>
                  <p className="mt-3 text-xs">
                    Need help? Visit{" "}
                    <a
                      href="https://support.google.com/business/answer/7035772"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Google's guide
                    </a>
                  </p>
                </AlertDescription>
              </Alert>

              <Button
                onClick={handleSave}
                disabled={updateBusinessMutation.isPending}
                style={{ backgroundColor: 'hsl(var(--brand))', borderColor: 'hsl(var(--brand))' }}
              >
                {updateBusinessMutation.isPending ? "Saving..." : "Save Review URL"}
              </Button>
            </CardContent>
          </Card>


        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Calendar Booking Settings</CardTitle>
              <CardDescription>
                Configure how customers can book site visits and appointments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Booking Rules</h3>

                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="bookingWindowDays">Booking Window (Days in Advance)</Label>
                    <Input
                      id="bookingWindowDays"
                      type="number"
                      min="1"
                      max="90"
                      value={businessData.bookingWindowDays}
                      onChange={(e) =>
                        setBusinessData({ ...businessData, bookingWindowDays: parseInt(e.target.value) || 14 })
                      }
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      How far in advance customers can book (1-90 days)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="minimumNoticeHours">Minimum Notice (Hours)</Label>
                    <Input
                      id="minimumNoticeHours"
                      type="number"
                      min="1"
                      max="168"
                      value={businessData.minimumNoticeHours}
                      onChange={(e) =>
                        setBusinessData({ ...businessData, minimumNoticeHours: parseInt(e.target.value) || 24 })
                      }
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      Minimum hours notice required before booking (1-168 hours)
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="timeSlotIntervalMinutes">Time Slot Interval (Minutes)</Label>
                    <Input
                      id="timeSlotIntervalMinutes"
                      type="number"
                      min="5"
                      max="120"
                      step="5"
                      value={businessData.timeSlotIntervalMinutes}
                      onChange={(e) =>
                        setBusinessData({ ...businessData, timeSlotIntervalMinutes: parseInt(e.target.value) || 15 })
                      }
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      Interval between available time slots (5-120 min)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quoteVisitDurationMinutes">Default Visit Duration (Minutes)</Label>
                    <Input
                      id="quoteVisitDurationMinutes"
                      type="number"
                      min="15"
                      max="480"
                      step="15"
                      value={businessData.quoteVisitDurationMinutes}
                      onChange={(e) =>
                        setBusinessData({ ...businessData, quoteVisitDurationMinutes: parseInt(e.target.value) || 60 })
                      }
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      How long each site visit takes (15-480 min)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bufferBetweenVisitsMinutes">Buffer Between Visits (Minutes)</Label>
                    <Input
                      id="bufferBetweenVisitsMinutes"
                      type="number"
                      min="0"
                      max="120"
                      step="5"
                      value={businessData.bufferBetweenVisitsMinutes}
                      onChange={(e) =>
                        setBusinessData({ ...businessData, bufferBetweenVisitsMinutes: parseInt(e.target.value) || 15 })
                      }
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      Break time between appointments (0-120 min)
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Availability Schedule</h3>
                <p className="text-sm text-muted-foreground">
                  Set your working hours for each day of the week. Uncheck to mark a day as closed.
                </p>

                {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                  const dayData = (businessData.calendarHours as any)[day];
                  const isOpen = dayData !== null;

                  return (
                    <div key={day} className="grid gap-4 grid-cols-1 md:grid-cols-4 items-end">
                      <div className="space-y-2">
                        <Label className="capitalize">{day}</Label>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`${day}-open`}
                            checked={isOpen}
                            onCheckedChange={(checked) => {
                              const newCalendarHours = { ...businessData.calendarHours };
                              (newCalendarHours as any)[day] = checked
                                ? { start: "09:00", end: "17:00" }
                                : null;
                              setBusinessData({ ...businessData, calendarHours: newCalendarHours });
                            }}
                          />
                          <label
                            htmlFor={`${day}-open`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            Open
                          </label>
                        </div>
                      </div>

                      {isOpen && (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor={`${day}-start`}>Start Time</Label>
                            <Input
                              id={`${day}-start`}
                              type="time"
                              value={dayData.start}
                              onChange={(e) => {
                                const newCalendarHours = { ...businessData.calendarHours };
                                (newCalendarHours as any)[day] = {
                                  ...(newCalendarHours as any)[day],
                                  start: e.target.value,
                                };
                                setBusinessData({ ...businessData, calendarHours: newCalendarHours });
                              }}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`${day}-end`}>End Time</Label>
                            <Input
                              id={`${day}-end`}
                              type="time"
                              value={dayData.end}
                              onChange={(e) => {
                                const newCalendarHours = { ...businessData.calendarHours };
                                (newCalendarHours as any)[day] = {
                                  ...(newCalendarHours as any)[day],
                                  end: e.target.value,
                                };
                                setBusinessData({ ...businessData, calendarHours: newCalendarHours });
                              }}
                            />
                          </div>

                          <div className="text-sm text-muted-foreground pt-2">
                            {dayData.start} - {dayData.end}
                          </div>
                        </>
                      )}

                      {!isOpen && (
                        <div className="md:col-span-3 text-sm text-muted-foreground pt-2">
                          Closed
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <Separator />

              <Button
                onClick={handleSave}
                disabled={updateBusinessMutation.isPending}
                style={{ backgroundColor: 'hsl(var(--brand))', borderColor: 'hsl(var(--brand))' }}
              >
                {updateBusinessMutation.isPending ? "Saving..." : "Save Calendar Settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Deposit Policies Section */}
        <TabsContent value="deposit" className="space-y-4" style={pageStyle}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Deposit Policies
              </CardTitle>
              <CardDescription>
                Configure deposit requirements and automatic cancellation rules
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Require Deposits by Default */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Require deposits by default</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically enable deposits for new quotes
                  </p>
                </div>
                <Switch
                  checked={businessData.requireDepositByDefault || false}
                  onCheckedChange={(checked) => {
                    setBusinessData({ ...businessData, requireDepositByDefault: checked as boolean });
                  }}
                />
              </div>

              <Separator />

              {/* Default Deposit Percentage */}
              <div className="space-y-2">
                <Label htmlFor="defaultDepositPercentage">
                  Default deposit percentage
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="defaultDepositPercentage"
                    type="number"
                    min="0"
                    max="100"
                    step="5"
                    value={businessData.defaultDepositPercentage || 30}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      setBusinessData({
                        ...businessData,
                        defaultDepositPercentage: isNaN(value) ? 30 : value
                      });
                    }}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Default percentage of quote total required as deposit
                </p>
              </div>

              <Separator />

              {/* Cancellation Mode */}
              <div className="space-y-3">
                <Label>Cancellation mode</Label>
                <RadioGroup
                  value={businessData.depositCancellationMode || 'manual'}
                  onValueChange={(value) => {
                    setBusinessData({
                      ...businessData,
                      depositCancellationMode: value as 'auto' | 'manual'
                    });
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="manual" id="manual" />
                    <Label htmlFor="manual" className="font-normal cursor-pointer">
                      <div>
                        <div className="font-medium">Manual</div>
                        <div className="text-sm text-muted-foreground">
                          You'll be notified to manually cancel unpaid bookings
                        </div>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="auto" id="auto" />
                    <Label htmlFor="auto" className="font-normal cursor-pointer">
                      <div>
                        <div className="font-medium">Automatic</div>
                        <div className="text-sm text-muted-foreground">
                          Jobs will be automatically cancelled if deposit isn't paid
                        </div>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <Separator />

              {/* Cancellation Threshold */}
              <div className="space-y-2">
                <Label htmlFor="cancellationThreshold">
                  Cancellation threshold
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="cancellationThreshold"
                    type="number"
                    min="1"
                    max="168"
                    value={businessData.depositCancellationThresholdHours || 48}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      setBusinessData({
                        ...businessData,
                        depositCancellationThresholdHours: isNaN(value) ? 48 : value
                      });
                    }}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">hours before job</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {businessData.depositCancellationMode === 'auto'
                    ? `Jobs will be cancelled ${businessData.depositCancellationThresholdHours || 48} hours before start if unpaid`
                    : `You'll be alerted ${businessData.depositCancellationThresholdHours || 48} hours before job start`
                  }
                </p>
              </div>

              <Separator />

              {/* Reminder Schedule */}
              <div className="space-y-3">
                <Label>Reminder schedule</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Send automatic deposit reminders at these intervals (hours before deposit deadline)
                </p>
                <div className="flex flex-wrap gap-2">
                  {(businessData.depositReminderHours || [48, 24, 12]).map((hours, index) => (
                    <div key={index} className="flex items-center gap-1">
                      <Badge variant="secondary" className="gap-1">
                        {hours}h
                        <button
                          onClick={() => {
                            const newHours = [...(businessData.depositReminderHours || [48, 24, 12])];
                            newHours.splice(index, 1);
                            setBusinessData({ ...businessData, depositReminderHours: newHours });
                          }}
                          className="ml-1 hover:text-destructive"
                        >
                          ×
                        </button>
                      </Badge>
                    </div>
                  ))}
                  <Dialog open={openDepositReminderDialog} onOpenChange={setOpenDepositReminderDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Plus className="h-3 w-3 mr-1" />
                        Add
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Reminder</DialogTitle>
                        <DialogDescription>
                          Set how many hours before the deposit deadline to send a reminder
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Hours before deadline</Label>
                          <Input
                            type="number"
                            min="1"
                            max="168"
                            placeholder="e.g., 6"
                            id="newReminderHours"
                          />
                        </div>
                        <Button
                          onClick={() => {
                            const input = document.getElementById('newReminderHours') as HTMLInputElement;
                            const hours = parseInt(input.value);
                            if (!isNaN(hours) && hours > 0) {
                              const currentHours = businessData.depositReminderHours || [48, 24, 12];
                              if (!currentHours.includes(hours)) {
                                setBusinessData({
                                  ...businessData,
                                  depositReminderHours: [...currentHours, hours].sort((a, b) => b - a)
                                });
                                setOpenDepositReminderDialog(false);
                              } else {
                                toast({
                                  title: "Reminder exists",
                                  description: `A ${hours}h reminder is already added`,
                                  variant: "destructive"
                                });
                              }
                            } else {
                              toast({
                                title: "Invalid input",
                                description: "Please enter a valid number between 1 and 168",
                                variant: "destructive"
                              });
                            }
                          }}
                          className="w-full"
                        >
                          Add Reminder
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <Separator />

              {/* Preview */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Preview</AlertTitle>
                <AlertDescription>
                  {businessData.depositCancellationMode === 'auto' ? (
                    <>
                      Jobs will be <strong>automatically cancelled</strong> {businessData.depositCancellationThresholdHours || 48} hours before start if deposit is unpaid.
                      Reminders will be sent at: {(businessData.depositReminderHours || [48, 24, 12]).join('h, ')}h before deadline.
                    </>
                  ) : (
                    <>
                      You'll receive <strong>alerts</strong> {businessData.depositCancellationThresholdHours || 48} hours before job start for unpaid deposits.
                      Reminders will be sent at: {(businessData.depositReminderHours || [48, 24, 12]).join('h, ')}h before deadline.
                    </>
                  )}
                </AlertDescription>
              </Alert>

              <Button
                onClick={handleSave}
                disabled={updateBusinessMutation.isPending}
                style={{ backgroundColor: 'hsl(var(--brand))', borderColor: 'hsl(var(--brand))' }}
              >
                {updateBusinessMutation.isPending ? "Saving..." : "Save Deposit Policies"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="whatsapp" className="space-y-4" style={pageStyle}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                WhatsApp Integration
              </CardTitle>
              <CardDescription>
                Connect your WhatsApp Business account to send automated messages
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">
                  💡 <strong>WhatsApp messaging is configured and ready!</strong> Messages will be sent automatically when you send quotes, invoices, and job reminders to customers who have opted in.
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>WhatsApp Provider</Label>
                <div className="p-3 bg-gray-50 rounded-md">
                  <p className="text-sm font-medium">Twilio WhatsApp Business API</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Messages are billed by your WhatsApp provider
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h3 className="text-lg font-semibold">WhatsApp Account Connection</h3>
                <p className="text-sm text-muted-foreground">
                  Link your WhatsApp Business account to send messages directly from your phone
                </p>
                <WaSenderQRLink 
                  defaultSessionName={business?.businessName || "My Business WhatsApp"}
                  compact={true}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsappMonthlyLimit">Monthly Message Limit</Label>
                <Input
                  id="whatsappMonthlyLimit"
                  type="number"
                  value={businessData.whatsappMonthlyLimit || 1000}
                  onChange={(e) =>
                    setBusinessData({
                      ...businessData,
                      whatsappMonthlyLimit: parseInt(e.target.value) || 1000
                    })
                  }
                  min="100"
                  max="10000"
                />
                <p className="text-xs text-muted-foreground">
                  Maximum WhatsApp messages allowed per month (prevents unexpected costs)
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Current Usage</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.href = '/dashboard/whatsapp-analytics'}
                  >
                    View Analytics →
                  </Button>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">
                        {businessData.whatsappCurrentUsage || 0} / {businessData.whatsappMonthlyLimit || 1000} messages
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {Math.round(((businessData.whatsappCurrentUsage || 0) / (businessData.whatsappMonthlyLimit || 1000)) * 100)}%
                      </span>
                    </div>
                    <Progress
                      value={((businessData.whatsappCurrentUsage || 0) / (businessData.whatsappMonthlyLimit || 1000)) * 100}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Estimated monthly cost: R{((businessData.whatsappCurrentUsage || 0) * 0.40).toFixed(2)}
                  </p>
                  {((businessData.whatsappCurrentUsage || 0) / (businessData.whatsappMonthlyLimit || 1000)) >= 0.8 && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <p className="text-sm text-yellow-800">
                        ⚠️ You've used {Math.round(((businessData.whatsappCurrentUsage || 0) / (businessData.whatsappMonthlyLimit || 1000)) * 100)}% of your monthly limit
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              <Button
                onClick={handleSave}
                disabled={updateBusinessMutation.isPending}
                style={{ backgroundColor: 'hsl(var(--brand))', borderColor: 'hsl(var(--brand))' }}
              >
                {updateBusinessMutation.isPending ? "Saving..." : "Save WhatsApp Settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="booking" className="space-y-4" style={pageStyle}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                How customers book
              </CardTitle>
              <CardDescription>
                Choose the flow that matches how you price your work.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <RadioGroup
                value={businessData.bookingMode || "quote_first"}
                onValueChange={(value) => {
                  setBusinessData({ ...businessData, bookingMode: value });
                }}
                className="space-y-4"
              >
                <label
                  htmlFor="mode-direct"
                  className="flex gap-3 rounded-lg border p-4 cursor-pointer hover:bg-accent/50"
                >
                  <RadioGroupItem value="direct" id="mode-direct" className="mt-1" data-testid="radio-mode-direct" />
                  <div className="space-y-1">
                    <p className="font-medium">Book straight away</p>
                    <p className="text-sm text-muted-foreground">
                      Customers pick a service and a time slot, and the booking is
                      confirmed immediately. Best when your prices and appointment
                      lengths are fixed — salons, tutors, physios, consultations.
                    </p>
                  </div>
                </label>

                <label
                  htmlFor="mode-quote-first"
                  className="flex gap-3 rounded-lg border p-4 cursor-pointer hover:bg-accent/50"
                >
                  <RadioGroupItem value="quote_first" id="mode-quote-first" className="mt-1" data-testid="radio-mode-quote-first" />
                  <div className="space-y-1">
                    <p className="font-medium">Quote first, then book</p>
                    <p className="text-sm text-muted-foreground">
                      Customers describe the job, receive a quote, and book a time
                      once they accept it. Best when the price depends on the work —
                      plumbers, electricians, builders.
                    </p>
                  </div>
                </label>

                <label
                  htmlFor="mode-quote-only"
                  className="flex gap-3 rounded-lg border p-4 cursor-pointer hover:bg-accent/50"
                >
                  <RadioGroupItem value="quote_only" id="mode-quote-only" className="mt-1" data-testid="radio-mode-quote-only" />
                  <div className="space-y-1">
                    <p className="font-medium">Quotes only</p>
                    <p className="text-sm text-muted-foreground">
                      Customers request a quote, and you arrange the timing yourself.
                      No online calendar booking.
                    </p>
                  </div>
                </label>
              </RadioGroup>

              {businessData.bookingMode === "direct" && (
                <div className="flex gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-blue-900">
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium">Check your services first</p>
                    <p className="mt-1">
                      With instant booking, customers see each service's price and
                      length before they book. Make sure every active service in
                      Services has both set correctly.
                    </p>
                  </div>
                </div>
              )}

              <Button
                onClick={() => updateBusinessMutation.mutate(businessData)}
                disabled={updateBusinessMutation.isPending}
                style={{ backgroundColor: 'hsl(var(--brand))', borderColor: 'hsl(var(--brand))' }}
                data-testid="button-save-booking-mode"
              >
                {updateBusinessMutation.isPending ? "Saving..." : "Save Booking Settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4" style={pageStyle}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Online Payments
              </CardTitle>
              <CardDescription>
                Let customers pay invoices and deposits online by card or EFT via PayFast.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Whether PayFast keys are present on the server. The owner
                  cannot fix this from here, so say so plainly. */}
              {paymentStatus && !paymentStatus.credentialsConfigured && (
                <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium">PayFast is not connected yet</p>
                    <p className="mt-1">
                      Your PayFast merchant details need to be added to the server
                      configuration before online payments can go live. Ask whoever
                      set up your site to add them. You can still switch this on now —
                      it will start working as soon as they are added.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Accept online payments</Label>
                  <p className="text-sm text-muted-foreground">
                    Shows a "Pay now" button to your customers. Turn this off to take
                    payment by EFT or in person instead.
                  </p>
                </div>
                <Switch
                  checked={businessData.onlinePaymentsEnabled || false}
                  onCheckedChange={(checked) => {
                    setBusinessData({ ...businessData, onlinePaymentsEnabled: checked as boolean });
                  }}
                  data-testid="switch-online-payments"
                />
              </div>

              {businessData.onlinePaymentsEnabled && (
                <div className="space-y-6 border-l-2 pl-4 ml-1">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Invoices</Label>
                      <p className="text-sm text-muted-foreground">
                        Customers can pay an invoice online.
                      </p>
                    </div>
                    <Switch
                      checked={businessData.acceptInvoicePayments !== false}
                      onCheckedChange={(checked) => {
                        setBusinessData({ ...businessData, acceptInvoicePayments: checked as boolean });
                      }}
                      data-testid="switch-invoice-payments"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Deposits</Label>
                      <p className="text-sm text-muted-foreground">
                        Customers can pay a booking deposit online to secure their slot.
                      </p>
                    </div>
                    <Switch
                      checked={businessData.acceptDepositPayments !== false}
                      onCheckedChange={(checked) => {
                        setBusinessData({ ...businessData, acceptDepositPayments: checked as boolean });
                      }}
                      data-testid="switch-deposit-payments"
                    />
                  </div>
                </div>
              )}

              {paymentStatus?.sandbox && paymentStatus.credentialsConfigured && (
                <p className="text-sm text-muted-foreground">
                  PayFast is in <strong>sandbox</strong> mode — payments are simulated,
                  no real money moves. Switch the server to live mode when you are ready
                  to take real payments.
                </p>
              )}

              <Button
                onClick={() => updateBusinessMutation.mutate(businessData)}
                disabled={updateBusinessMutation.isPending}
                style={{ backgroundColor: 'hsl(var(--brand))', borderColor: 'hsl(var(--brand))' }}
                data-testid="button-save-payments"
              >
                {updateBusinessMutation.isPending ? "Saving..." : "Save Payment Settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="space-y-4" style={pageStyle}>
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>
                Manage your personal account information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input value={user?.firstName || ""} disabled className="w-full" />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input value={user?.lastName || ""} disabled className="w-full" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input value={user?.email || ""} disabled />
              </div>
              <p className="text-xs text-muted-foreground">
                Account details are managed through your authentication provider
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PasswordChangeForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4">
          <Card className="border-dashed">
            <CardHeader className="text-center pb-4">
              <CardTitle>Coming Soon</CardTitle>
              <CardDescription>
                Notification and display preferences will be available here
              </CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}