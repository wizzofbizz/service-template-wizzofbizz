import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Wrench, Sparkles, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { AIProgressOrb } from "@/components/AIProgressOrb";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface Service {
  id: string;
  serviceName: string;
  description?: string;
  basePrice?: string;
  pricingFormula?: string;
  aiGuidancePrompt?: string;
  ruleConfig?: Record<string, any>;
  isActive: boolean;
}

interface ServiceTemplate {
  serviceName: string;
  description: string;
  category?: string;
  basePrice: string;
  pricingFormula: string;
  ruleConfig: Record<string, any>;
  aiGuidancePrompt: string;
  durationMinutes: number;
  requiresSiteVisit: boolean;
  pricingType: string;
}

export default function ServicesPage() {
  const pageStyle = { fontFamily: 'var(--font-sans)' };
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);

  // Form state
  const [serviceName, setServiceName] = useState("");
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [pricingFormula, setPricingFormula] = useState("");
  const [aiGuidancePrompt, setAiGuidancePrompt] = useState("");
  const [ruleConfigJson, setRuleConfigJson] = useState("{}");
  const [isActive, setIsActive] = useState(true);
  const [serviceQuestions, setServiceQuestions] = useState<Array<{
    question: string;
    type: "text" | "number" | "select";
    options?: string[];
    required?: boolean;
  }>>([]);
  const [imageAnalysisEnabled, setImageAnalysisEnabled] = useState(false);
  const [requiredPhotos, setRequiredPhotos] = useState<string[]>([]);
  const [analysisHints, setAnalysisHints] = useState("");
  const [materialCostConfig, setMaterialCostConfig] = useState<Record<string, any>>({});

  // Fetch current business to get industry
  const { data: businessData } = useQuery<{ business: { industry: string } }>({
    queryKey: ["/api/auth/me"],
  });

  // Fetch services
  const { data: services = [], isLoading } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  // Fetch service templates based on business industry
  const { data: serviceTemplates = [], isLoading: isLoadingTemplates } = useQuery<ServiceTemplate[]>({
    queryKey: ["/api/services/templates", businessData?.business?.industry],
    enabled: !!businessData?.business?.industry && showTemplateSelector,
    queryFn: async () => {
      const industry = businessData?.business?.industry;
      if (!industry) return [];

      const response = await fetch(`/api/services/templates/${encodeURIComponent(industry)}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch service templates");
      }

      return response.json();
    },
  });

  // Create service mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create service");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      toast({ title: "Success", description: "Service created" });
      resetForm();
      setIsNewDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create service", variant: "destructive" });
    },
  });

  // Update service mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/services/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update service");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      toast({ title: "Success", description: "Service updated" });
      resetForm();
      setIsEditDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update service", variant: "destructive" });
    },
  });

  // Delete service mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/services/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete service");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      toast({ title: "Success", description: "Service deleted" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete service", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setServiceName("");
    setDescription("");
    setBasePrice("");
    setPricingFormula("");
    setAiGuidancePrompt("");
    setRuleConfigJson("{}");
    setIsActive(true);
    setServiceQuestions([]);
    setImageAnalysisEnabled(false);
    setRequiredPhotos([]);
    setAnalysisHints("");
    setMaterialCostConfig({});
    setSelectedService(null);
  };

  const openEditDialog = (service: Service) => {
    setSelectedService(service);
    setServiceName(service.serviceName);
    setDescription(service.description || "");
    setBasePrice(service.basePrice || "");
    setPricingFormula(service.pricingFormula || "");
    setAiGuidancePrompt(service.aiGuidancePrompt || "");
    setRuleConfigJson(JSON.stringify(service.ruleConfig || {}, null, 2));
    setIsActive(service.isActive);
    setServiceQuestions((service as any).serviceQuestions || []);
    const imgConfig = (service as any).imageAnalysisConfig;
    setImageAnalysisEnabled(imgConfig?.enabled || false);
    setRequiredPhotos(imgConfig?.requiredPhotos || []);
    setAnalysisHints(imgConfig?.analysisHints || "");
    setMaterialCostConfig((service as any).materialCostConfig || {});
    setIsEditDialogOpen(true);
  };

  const applyTemplate = (template: ServiceTemplate) => {
    setServiceName(template.serviceName);
    setDescription(template.description || "");
    setBasePrice(template.basePrice);
    setPricingFormula(template.pricingFormula);
    setRuleConfigJson(JSON.stringify(template.ruleConfig, null, 2));
    setAiGuidancePrompt(template.aiGuidancePrompt);
    setServiceQuestions((template as any).serviceQuestions || []);
    const imgConfig = (template as any).imageAnalysisConfig;
    setImageAnalysisEnabled(imgConfig?.enabled || false);
    setRequiredPhotos(imgConfig?.requiredPhotos || []);
    setAnalysisHints(imgConfig?.analysisHints || "");
    setMaterialCostConfig((template as any).materialCostConfig || {});
    setShowTemplateSelector(false);
  };

  const openNewDialog = () => {
    resetForm();
    setShowTemplateSelector(false);
    setIsNewDialogOpen(true);
  };

  const openTemplateSelector = () => {
    resetForm();
    setShowTemplateSelector(true);
    setIsNewDialogOpen(true);
  };

  const handleSave = () => {
    let parsedRuleConfig;
    try {
      parsedRuleConfig = JSON.parse(ruleConfigJson);
    } catch {
      toast({ title: "Error", description: "Invalid JSON in Rule Configuration", variant: "destructive" });
      return;
    }

    // Sanitize requiredPhotos: trim whitespace and remove empty entries
    const sanitizedPhotos = requiredPhotos
      .map(p => p.trim())
      .filter(p => p.length > 0);

    const data = {
      serviceName,
      description: description || undefined,
      basePrice: basePrice || undefined,
      pricingFormula: pricingFormula || undefined,
      aiGuidancePrompt: aiGuidancePrompt || undefined,
      ruleConfig: parsedRuleConfig,
      isActive,
      pricingType: "custom",
      serviceQuestions,
      imageAnalysisConfig: {
        enabled: imageAnalysisEnabled,
        requiredPhotos: sanitizedPhotos,
        analysisHints: analysisHints?.trim() || undefined,
      },
      materialCostConfig,
    };

    if (selectedService) {
      updateMutation.mutate({ id: selectedService.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const testFormula = () => {
    try {
      const config = JSON.parse(ruleConfigJson);

      // Comprehensive default values for all common template variables
      const defaultValues = {
        // Universal variables
        base_price: parseFloat(basePrice) || 500,
        hours: 2,
        km: 10,
        urgency_multiplier: 1.0,
        complexity_multiplier: 1.0,

        // Common pricing variables
        hourly_rate: 600,
        travel_rate: 15,

        // Materials and parts
        materials_cost: 200,
        materials_markup: 1.3,
        parts_cost: 300,
        parts_markup: 1.25,

        // Emergency and urgency
        emergency_multiplier: 2.0,
        emergency_rate: 400,

        // Size and area
        sqm: 50,
        pool_size: 40000,
        garden_size: 100,
        property_size: 150,
        size_rate: 5,
        size_multiplier: 50,
        sqm_rate: 10,

        // Rates and multipliers
        point_rate: 150,
        circuit_rate: 150,
        unit_rate: 2500,
        unit_service_rate: 350,
        gas_rate: 600,
        leak_repair_rate: 500,
        room_rate: 200,
        window_rate: 50,
        meter_rate: 25,
        tree_rate: 400,
        difficulty_rate: 400,
        treatment_rate: 1.5,
        severity_multiplier: 1.5,
        type_multiplier: 1.2,
        fixture_rate: 200,
        item_rate: 200,
        tile_rate: 45,
        paver_type: 1,
        bathroom_rate: 20000,
        luxury_multiplier: 1.5,
        wall_type_multiplier: 1.2,
        height_multiplier: 1,
        height_multiplier_rate: 200,
        coat_multiplier: 1.4,
        roof_type_multiplier: 1.2,
        infestation_multiplier: 1.3,
        treatment_type_multiplier: 1.0,
        pest_severity: 2,

        // Quantities
        units: 2,
        leak_repair: 0,
        windows: 10,
        linear_meters: 20,
        trees: 2,
        difficulty: 1,
        geyser_size: 150,
        severity: 2,
        fixtures: 3,
        stain_treatment: 1,
        stain_treatment_rate: 100,
        rooms: 3,
        treatment_rounds: 2,
        items: 5,
        coats: 2,
        tiles: 50,
        downpipes: 4,
        downpipe_rate: 250,
        bathrooms: 1,

        // Discounts
        frequency_discount: 0,
        frequency_discount_factor: 0.15,
      };

      // Merge defaults with actual config (config overrides defaults)
      const testContext = {
        ...defaultValues,
        ...config,
      };

      let formula = pricingFormula;

      // Sort keys by length (longest first) to avoid partial replacements
      const sortedKeys = Object.keys(testContext).sort((a, b) => b.length - a.length);

      sortedKeys.forEach(key => {
        // Use word boundary regex to match whole variable names only
        const regex = new RegExp(`\\b${key}\\b`, 'g');
        formula = formula.replace(regex, testContext[key].toString());
      });

      const result = eval(formula);
      toast({
        title: "Formula Test Result",
        description: `Estimated Price: R ${result.toFixed(2)} (Sample values used)`
      });
    } catch (error) {
      toast({
        title: "Formula Error",
        description: error instanceof Error ? error.message : "Invalid formula",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6" style={pageStyle}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Services</h1>
          <p className="text-muted-foreground mt-1">
            Manage your service catalog with AI-powered pricing
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={openTemplateSelector} variant="outline" className="shrink-0">
            <Sparkles className="h-4 w-4 mr-2" />
            Use Template
          </Button>
          <Button onClick={openNewDialog} className="shrink-0" style={{ backgroundColor: 'hsl(var(--brand))', borderColor: 'hsl(var(--brand))' }}>
            <Plus className="h-4 w-4 mr-2" />
            Create Custom
          </Button>
        </div>
      </div>

      {/* Services List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Services</CardTitle>
          <CardDescription>Configure pricing rules and AI guidance for each service</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-4 text-muted-foreground font-medium">Loading your services...</p>
            </div>
          ) : services.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              No services yet. Create your first service to get started.
            </p>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {services.map((service) => (
                  <Card key={service.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{service.serviceName}</h3>
                          {service.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {service.description}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2 ml-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(service)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setServiceToDelete(service)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Base Price:</span>
                          <span className="font-semibold text-lg text-green-600">
                            {service.basePrice ? `R ${parseFloat(service.basePrice).toFixed(2)}` : "-"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">AI Pricing:</span>
                          {service.pricingFormula ? (
                            <Badge variant="default" className="bg-green-600">
                              <Sparkles className="h-3 w-3 mr-1" />
                              Enabled
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Not Configured</Badge>
                          )}
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Status:</span>
                          <Badge variant={service.isActive ? "default" : "secondary"}>
                            {service.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service Name</TableHead>
                      <TableHead>Base Price</TableHead>
                      <TableHead>AI Enabled</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {services.map((service) => (
                      <TableRow key={service.id}>
                        <TableCell className="font-medium">{service.serviceName}</TableCell>
                        <TableCell>
                          {service.basePrice ? `R ${parseFloat(service.basePrice).toFixed(2)}` : "-"}
                        </TableCell>
                        <TableCell>
                          {service.pricingFormula ? (
                            <Badge variant="default" className="bg-green-600">
                              <Sparkles className="h-3 w-3 mr-1" />
                              Yes
                            </Badge>
                          ) : (
                            <Badge variant="secondary">No</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={service.isActive ? "default" : "secondary"}>
                            {service.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(service)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setServiceToDelete(service)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit/Create Dialog */}
      <Dialog open={isEditDialogOpen || isNewDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsEditDialogOpen(false);
          setIsNewDialogOpen(false);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedService ? "Edit Service" : "Create Service"}
            </DialogTitle>
            <DialogDescription>
              Configure service details and AI pricing rules
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Basic Info */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="serviceName">Service Name *</Label>
                <Input
                  id="serviceName"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  placeholder="e.g., Window Repair"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="basePrice">Base Price (R)</Label>
                <Input
                  id="basePrice"
                  type="number"
                  step="0.01"
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the service"
                rows={2}
              />
            </div>

            {/* Service Templates Selector */}
            {showTemplateSelector && !selectedService && (
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Select a Service Template
                </h3>
                {isLoadingTemplates ? (
                  <p className="text-sm text-muted-foreground">Loading templates...</p>
                ) : serviceTemplates.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No templates available for your industry.</p>
                ) : (
                  <div className="grid gap-2 max-h-64 overflow-y-auto">
                    {serviceTemplates.map((template, index) => (
                      <Card
                        key={index}
                        className="cursor-pointer hover:border-primary transition-colors"
                        onClick={() => applyTemplate(template)}
                      >
                        <CardContent className="p-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-semibold text-sm">{template.serviceName}</h4>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {template.description}
                              </p>
                              {template.category && (
                                <Badge variant="outline" className="mt-2 text-xs">
                                  {template.category}
                                </Badge>
                              )}
                            </div>
                            <div className="text-right ml-2">
                              <p className="font-semibold text-green-600">
                                R {parseFloat(template.basePrice).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTemplateSelector(false)}
                  className="w-full mt-2"
                >
                  Start from scratch instead
                </Button>
              </div>
            )}

            {/* AI Configuration */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI Pricing Configuration
              </h3>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pricingFormula">Pricing Formula</Label>
                  <Input
                    id="pricingFormula"
                    value={pricingFormula}
                    onChange={(e) => setPricingFormula(e.target.value)}
                    placeholder="base_price + (hours * hourly_rate) + (km * travel_rate)"
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Variables: base_price, hours, km, urgency_multiplier, complexity_multiplier,
                    plus any from Rule Config
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="aiGuidancePrompt">AI Guidance Prompt</Label>
                  <Textarea
                    id="aiGuidancePrompt"
                    value={aiGuidancePrompt}
                    onChange={(e) => setAiGuidancePrompt(e.target.value)}
                    placeholder="Guide AI on what to extract from customer requests and suggest related services..."
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    Tell the AI what to look for and what upsells to suggest
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ruleConfig">Rule Configuration (JSON)</Label>
                  <Textarea
                    id="ruleConfig"
                    value={ruleConfigJson}
                    onChange={(e) => setRuleConfigJson(e.target.value)}
                    placeholder='{"hourly_rate": 600, "travel_rate": 15, "material_markup": 1.3}'
                    rows={4}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Define custom pricing variables as JSON
                  </p>
                </div>

                {pricingFormula && (
                  <Button variant="outline" onClick={testFormula} className="w-full">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Test Formula
                  </Button>
                )}
              </div>
            </div>

            {/* Service Questions */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-3">Customer Questions</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Ask customers specific questions when they request a quote for this service
              </p>

              <div className="space-y-3">
                {serviceQuestions.map((q, idx) => (
                  <div key={idx} className="border p-3 rounded-md space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Question"
                        value={q.question}
                        onChange={(e) => {
                          const updated = [...serviceQuestions];
                          updated[idx].question = e.target.value;
                          setServiceQuestions(updated);
                        }}
                        className="flex-1"
                      />
                      <Select
                        value={q.type}
                        onValueChange={(val: "text" | "number" | "select") => {
                          const updated = [...serviceQuestions];
                          updated[idx].type = val;
                          if (val !== "select") {
                            delete updated[idx].options;
                          }
                          setServiceQuestions(updated);
                        }}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="number">Number</SelectItem>
                          <SelectItem value="select">Select</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setServiceQuestions(serviceQuestions.filter((_, i) => i !== idx));
                        }}
                      >
                        ✕
                      </Button>
                    </div>

                    {q.type === "select" && (
                      <Input
                        placeholder="Options (comma-separated)"
                        value={q.options?.join(", ") || ""}
                        onChange={(e) => {
                          const updated = [...serviceQuestions];
                          updated[idx].options = e.target.value.split(",").map(s => s.trim());
                          setServiceQuestions(updated);
                        }}
                      />
                    )}

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="Variable name (optional, e.g., hours, rooms)"
                          value={(q as any).variableName || ""}
                          onChange={(e) => {
                            const updated = [...serviceQuestions];
                            const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_');
                            (updated[idx] as any).variableName = value;
                            setServiceQuestions(updated);
                          }}
                          className="flex-1 text-sm"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Maps answer to pricing formula variable. Available in formula: {pricingFormula || 'base_price + (hours * hourly_rate)'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={q.required || false}
                        onCheckedChange={(checked) => {
                          const updated = [...serviceQuestions];
                          updated[idx].required = checked as boolean;
                          setServiceQuestions(updated);
                        }}
                      />
                      <Label className="text-sm">Required</Label>
                    </div>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setServiceQuestions([...serviceQuestions, {
                      question: "",
                      type: "text",
                      required: false
                    }]);
                  }}
                  className="w-full"
                >
                  + Add Question
                </Button>
              </div>
            </div>

            {/* Photo Analysis Configuration */}
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="imageAnalysis">Photo Analysis (AI)</Label>
                  <p className="text-xs text-muted-foreground">
                    Enable AI to analyze customer photos for better quotes
                  </p>
                </div>
                <Switch
                  id="imageAnalysis"
                  data-testid="switch-image-analysis"
                  checked={imageAnalysisEnabled}
                  onCheckedChange={setImageAnalysisEnabled}
                />
              </div>

              {imageAnalysisEnabled && (
                <div className="space-y-4 pl-4 border-l-2 border-primary/20">
                  <div className="space-y-2">
                    <Label>Required Photos</Label>
                    <p className="text-xs text-muted-foreground">
                      Tell customers what photos to upload for accurate quotes
                    </p>
                    <div className="space-y-2">
                      {requiredPhotos.map((photo, idx) => (
                        <div key={idx} className="flex gap-2">
                          <Input
                            value={photo}
                            onChange={(e) => {
                              const updated = [...requiredPhotos];
                              updated[idx] = e.target.value;
                              setRequiredPhotos(updated);
                            }}
                            placeholder="e.g., Photo of the damaged area"
                            className="flex-1"
                            data-testid={`input-required-photo-${idx}`}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setRequiredPhotos(requiredPhotos.filter((_, i) => i !== idx))}
                            data-testid={`button-remove-photo-${idx}`}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setRequiredPhotos([...requiredPhotos, ""])}
                        data-testid="button-add-required-photo"
                      >
                        + Add Photo Requirement
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="analysisHints">Analysis Hints (Optional)</Label>
                    <Textarea
                      id="analysisHints"
                      value={analysisHints}
                      onChange={(e) => setAnalysisHints(e.target.value)}
                      placeholder="e.g., Look for: damage severity, material type, estimated area..."
                      rows={3}
                      data-testid="input-analysis-hints"
                    />
                    <p className="text-xs text-muted-foreground">
                      Guide the AI on what to look for in the photos
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Materials Configuration */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-3">Materials List</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add materials that may be used for this service. The AI will select which ones apply based on the customer's request.
              </p>

              <div className="space-y-3">
                {/* Simple materials table */}
                {((materialCostConfig as any)?.materials || []).map((material: any, idx: number) => (
                  <div key={idx} className="grid grid-cols-[2fr_1fr_auto_auto] gap-2 items-center bg-gray-50 p-3 rounded-lg">
                    <div>
                      <Input
                        placeholder="e.g., Bathroom tap, Piping (per meter), Tiles (per sqm)"
                        value={material.name || ''}
                        onChange={(e) => {
                          const updatedMaterials = [...((materialCostConfig as any)?.materials || [])];
                          updatedMaterials[idx] = {
                            ...updatedMaterials[idx],
                            name: e.target.value
                          };
                          setMaterialCostConfig({
                            ...materialCostConfig,
                            materials: updatedMaterials
                          });
                        }}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Tip: Include unit in name for per-unit materials (e.g., "per meter", "per sqm")
                      </p>
                    </div>
                    <Input
                      type="number"
                      placeholder="Cost (R)"
                      value={material.cost || ''}
                      onChange={(e) => {
                        const updatedMaterials = [...((materialCostConfig as any)?.materials || [])];
                        updatedMaterials[idx] = {
                          ...updatedMaterials[idx],
                          cost: parseFloat(e.target.value) || 0
                        };
                        setMaterialCostConfig({
                          ...materialCostConfig,
                          materials: updatedMaterials
                        });
                      }}
                    />
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={material.showSeparately || false}
                        onCheckedChange={(checked) => {
                          const updatedMaterials = [...((materialCostConfig as any)?.materials || [])];
                          updatedMaterials[idx] = {
                            ...updatedMaterials[idx],
                            showSeparately: checked
                          };
                          setMaterialCostConfig({
                            ...materialCostConfig,
                            materials: updatedMaterials
                          });
                        }}
                      />
                      <Label className="text-xs whitespace-nowrap">Show separately</Label>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const updatedMaterials = ((materialCostConfig as any)?.materials || [])
                          .filter((_: any, i: number) => i !== idx);
                        setMaterialCostConfig({
                          ...materialCostConfig,
                          materials: updatedMaterials
                        });
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const currentMaterials = (materialCostConfig as any)?.materials || [];
                    setMaterialCostConfig({
                      ...materialCostConfig,
                      materials: [
                        ...currentMaterials,
                        { name: '', cost: 0, showSeparately: false }
                      ]
                    });
                  }}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Material
                </Button>

                {/* Info box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                  <p className="text-sm text-blue-900 font-semibold mb-2">💡 How it works:</p>
                  <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                    <li>Add all materials you typically use for this service</li>
                    <li>The AI will analyze the customer's request and select relevant materials</li>
                    <li>Materials marked "Show separately" appear as individual line items on quotes</li>
                    <li>Other materials are bundled together under "Materials & Supplies"</li>
                    <li>For per-unit materials (tiles, piping), include the unit in the name - AI will extract quantities</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center justify-between border-t pt-4">
              <div>
                <Label htmlFor="isActive">Service Active</Label>
                <p className="text-xs text-muted-foreground">
                  Inactive services won't appear in quotes
                </p>
              </div>
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsEditDialogOpen(false);
              setIsNewDialogOpen(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!serviceName} style={{ backgroundColor: 'hsl(var(--brand))', borderColor: 'hsl(var(--brand))' }}>
              {selectedService ? "Update" : "Create"} Service
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!serviceToDelete} onOpenChange={() => setServiceToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Service?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{serviceToDelete?.serviceName}</strong>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (serviceToDelete) {
                  deleteMutation.mutate(serviceToDelete.id);
                  setServiceToDelete(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}