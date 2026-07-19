import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, Check, Upload, MapPin, User, Phone, Mail, AlertCircle, Loader2 } from "lucide-react";
import { AddressAutocomplete, type AddressData } from "@/components/ui/address-autocomplete";
import { CalendarBooking } from "@/components/CalendarBooking";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { AIProgressOrb } from "@/components/AIProgressOrb";


interface ImageAnalysisConfig {
  enabled: boolean;
  requiredPhotos: string[];
  analysisHints?: string;
}

interface ImageAnalysisResult {
  success: boolean;
  extractedData: Record<string, any>;
  detectedIssues: string[];
  confidence: number;
  summary: string;
  recommendations: string[];
}

interface Service {
  id: string;
  serviceName: string;
  description: string;
  category: string;
  basePrice: string;
  serviceQuestions: Array<{
    question: string;
    type: "text" | "number" | "select";
    options?: string[];
    required?: boolean;
  }>;
  imageAnalysisConfig?: ImageAnalysisConfig;
}

interface Business {
  id: string;
  businessName: string;
  slug: string;
  logoUrl: string;
  primaryColor: string;
}

export default function PublicQuoteRequest() {
  const [, params] = useRoute("/:slug/quote");
  const [, navigate] = useLocation();
  const slug = params?.slug;

  const [step, setStep] = useState(1);
  const [business, setBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [declineReason, setDeclineReason] = useState("");

  // Form data
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [address, setAddress] = useState("");
  const [serviceLocationType, setServiceLocationType] = useState<"customer" | "business">("customer");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [emailOptIn, setEmailOptIn] = useState(true);
  const [whatsappOptIn, setWhatsappOptIn] = useState(false);
  const [quoteResult, setQuoteResult] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [bookingNotes, setBookingNotes] = useState("");
  const [availableSlots, setAvailableSlots] = useState<Record<string, string[]>>({});
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [imageAnalysisResult, setImageAnalysisResult] = useState<ImageAnalysisResult | null>(null);
  const [analyzingPhotos, setAnalyzingPhotos] = useState(false);
  const [aiProgress, setAiProgress] = useState(0);
  const [aiStatus, setAiStatus] = useState<'analyzing' | 'generating' | 'finalizing'>('analyzing');
  const [showAiOrb, setShowAiOrb] = useState(false);

  const totalSteps = 7;
  const progress = (step / totalSteps) * 100;

  useEffect(() => {
    const fetchServices = async () => {
      if (!slug) return;

      try {
        const response = await fetch(`/api/public/services/${slug}`);
        if (!response.ok) throw new Error("Business not found");

        const data = await response.json();
        setBusiness(data.business);
        setServices(data.services);
      } catch (err) {
        setError("Unable to load services. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [slug]);

  const selectedService = services.find(s => s.id === selectedServiceId);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const photoUrls: string[] = [];
    for (let i = 0; i < files.length && i < 5; i++) {
      const reader = new FileReader();
      reader.onloadend = () => {
        photoUrls.push(reader.result as string);
        if (photoUrls.length === Math.min(files.length, 5)) {
          setPhotos(photoUrls);
          // Photos are now stored locally, analysis will happen at submission
        }
      };
      reader.readAsDataURL(files[i]);
    }
  };

  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const analyzePhotos = async (photoUrls: string[]) => {
    if (!slug || !selectedServiceId) return;
    
    setAnalyzingPhotos(true);
    setImageAnalysisResult(null);
    setAnalysisError(null);

    try {
      const response = await fetch(`/api/public/analyze-photos/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: selectedServiceId,
          photos: photoUrls,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.analysisResult) {
          setImageAnalysisResult(data.analysisResult);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        setAnalysisError(errorData.message || "Failed to analyze photos");
      }
    } catch (err) {
      console.error("Photo analysis error:", err);
      setAnalysisError("Failed to analyze photos. Your quote can still be generated.");
    } finally {
      setAnalyzingPhotos(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    setShowAiOrb(true);
    setAiProgress(0);
    setAiStatus('analyzing');

    try {
      let analysisResult: ImageAnalysisResult | null = null;

      // Step 1: Analyze photos if provided and analysis is enabled (0-40%)
      if (photos.length > 0 && selectedService?.imageAnalysisConfig?.enabled) {
        setAiStatus('analyzing');
        setAiProgress(5);

        const analysisResponse = await fetch(`/api/public/analyze-photos/${slug}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            serviceId: selectedServiceId,
            photos: photos,
          }),
        });

        setAiProgress(30);

        if (analysisResponse.ok) {
          const data = await analysisResponse.json();
          analysisResult = data.analysisResult;
        }

        setAiProgress(40);
      } else {
        // Skip analysis phase if no photos
        setAiProgress(40);
      }

      // Step 2: Generate quote (40-100%)
      setAiStatus('generating');
      setAiProgress(45);

      // Calculate preferred channel based on selections
      let preferredChannel = "email"; // default
      if (emailOptIn && whatsappOptIn) {
        preferredChannel = "both";
      } else if (whatsappOptIn) {
        preferredChannel = "whatsapp";
      } else if (emailOptIn) {
        preferredChannel = "email";
      }

      setAiProgress(50);

      const response = await fetch(`/api/public/quote-request/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: selectedServiceId,
          customerInput: description,
          photos,
          address: serviceLocationType === "business" ? "" : address,
          serviceLocationType,
          contactInfo: {
            fullName,
            email,
            phone,
            whatsappOptIn,
            preferredChannel,
          },
          answers,
          imageAnalysisData: analysisResult,
        }),
      });

      setAiProgress(85);

      if (!response.ok) throw new Error("Failed to submit request");

      const result = await response.json();
      
      // Step 3: Finalizing (85-100%)
      setAiStatus('finalizing');
      setAiProgress(90);
      
      await new Promise(resolve => setTimeout(resolve, 500)); // Brief pause for effect
      setAiProgress(100);
      
      await new Promise(resolve => setTimeout(resolve, 300)); // Show 100% briefly
      
      setQuoteResult(result);
      setShowAiOrb(false);
      setStep(step + 1);
    } catch (err) {
      setError("Failed to generate quote. Please try again.");
      setShowAiOrb(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecline = async () => {
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(`/api/public/quote/${quoteResult.quote.id}/decline?token=${quoteResult.quote.publicToken}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: declineReason,
        }),
      });

      if (!response.ok) throw new Error("Failed to decline quote");

      setShowDeclineDialog(false);
      
      // Update quote result to show declined status
      setQuoteResult({
        ...quoteResult,
        quote: {
          ...quoteResult.quote,
          status: 'declined'
        }
      });

      // Move to a thank you step
      setStep(8);
    } catch (err) {
      setError("Failed to process decline. Please try again.");
      setShowDeclineDialog(false);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-[#0b66e4]" strokeWidth={2.5} />
          <p className="text-gray-600 font-medium" style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif' }}>
            Loading quote request experience...
          </p>
        </div>
      </div>
    );
  }

  if (error && !business) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-center text-red-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      {/* AI Progress Orb Overlay */}
      {showAiOrb && (
        <AIProgressOrb 
          progress={aiProgress} 
          status={aiStatus}
          statusText={
            aiStatus === 'analyzing' 
              ? 'Analyzing your photos...' 
              : aiStatus === 'generating' 
              ? 'Processing your quote...' 
              : 'Almost there...'
          }
        />
      )}
      
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 mb-4">
              {business?.logoUrl && (
                <img src={business.logoUrl} alt={business.businessName} className="h-12 w-12 object-contain" />
              )}
              <div>
                <h1 className="text-2xl font-bold">{business?.businessName}</h1>
                <p className="text-sm text-gray-600">Request a Quote</p>
              </div>
            </div>
            <Progress 
              value={progress} 
              className="h-2" 
              style={{ 
                '--progress-foreground': business?.primaryColor || '#0b66e4',
                '--progress-background': '#e5e7eb'
              } as React.CSSProperties}
            />
            <p className="text-xs text-gray-500 mt-2">Step {step} of 7</p>
          </CardContent>
        </Card>

        {/* Step 1: Select Service */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Select a Service</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {services.map(service => (
                <div
                  key={service.id}
                  onClick={() => setSelectedServiceId(service.id)}
                  className={`p-4 border rounded-lg cursor-pointer transition ${
                    selectedServiceId === service.id
                      ? "bg-muted"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  style={selectedServiceId === service.id ? { borderColor: business?.primaryColor || '#0b66e4', borderWidth: '2px' } : {}}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold">{service.serviceName}</h3>
                      <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                      {service.basePrice && (
                        <p className="text-sm text-gray-900 mt-2 font-medium">
                          From R{parseFloat(service.basePrice).toFixed(2)}
                        </p>
                      )}
                    </div>
                    {selectedServiceId === service.id && (
                      <Check className="h-6 w-6 flex-shrink-0" style={{ color: business?.primaryColor || '#0b66e4' }} />
                    )}
                  </div>
                </div>
              ))}
              <Button
                onClick={() => setStep(2)}
                disabled={!selectedServiceId}
                className="w-full text-white"
                style={{ backgroundColor: business?.primaryColor || '#0b66e4' }}
              >
                Continue
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Service Questions */}
        {step === 2 && selectedService && (
          <Card>
            <CardHeader>
              <CardTitle>Tell Us More</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedService.serviceQuestions?.length > 0 ? (
                <>
                  {selectedService.serviceQuestions.map((q, idx) => (
                    <div key={idx} className="space-y-2">
                      <Label>
                        {q.question}
                        {q.required && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      {q.type === "select" ? (
                        <Select
                          value={answers[q.question] || ""}
                          onValueChange={(value) => setAnswers({ ...answers, [q.question]: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select an option" />
                          </SelectTrigger>
                          <SelectContent>
                            {q.options?.map(opt => (
                              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          type={q.type === "number" ? "number" : "text"}
                          value={answers[q.question] || ""}
                          onChange={(e) => setAnswers({ ...answers, [q.question]: e.target.value })}
                          placeholder="Enter your answer"
                        />
                      )}
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                      Back
                    </Button>
                    <Button 
                      onClick={() => setStep(3)} 
                      className="flex-1 text-white"
                      style={{ backgroundColor: business?.primaryColor || '#0b66e4' }}
                    >
                      Continue
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-600 mb-4">No additional questions for this service.</p>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                      Back
                    </Button>
                    <Button 
                      onClick={() => setStep(3)} 
                      className="flex-1 text-white"
                      style={{ backgroundColor: business?.primaryColor || '#0b66e4' }}
                    >
                      Continue
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 3: Description & Photos */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Describe Your Request</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">What do you need? *</Label>
                <Textarea
                  id="description"
                  data-testid="input-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the work you need done..."
                  rows={5}
                />
              </div>
              
              {/* Photo Upload Section */}
              <div className="space-y-2">
                <Label>
                  Upload Photos {selectedService?.imageAnalysisConfig?.enabled ? "(Recommended)" : "(Optional)"}
                </Label>
                
                {/* Show service-specific photo requirements if enabled */}
                {selectedService?.imageAnalysisConfig?.enabled && selectedService.imageAnalysisConfig.requiredPhotos.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2">
                    <p className="text-sm font-medium text-blue-800 mb-2">
                      Photos help us give you a more accurate quote. Please include:
                    </p>
                    <ul className="text-sm text-blue-700 space-y-1">
                      {selectedService.imageAnalysisConfig.requiredPhotos.map((photo, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <span className="text-blue-500">•</span>
                          {photo}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="border-2 border-dashed rounded-lg p-4 text-center">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="photo-upload"
                    data-testid="input-photo-upload"
                  />
                  <label htmlFor="photo-upload" className="cursor-pointer text-sm text-blue-600">
                    Click to upload (max 5 photos)
                  </label>
                  {photos.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2 justify-center">
                      {photos.map((photo, idx) => (
                        <img 
                          key={idx} 
                          src={photo} 
                          alt={`Upload ${idx + 1}`} 
                          className="w-16 h-16 object-cover rounded-lg border"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {photos.length > 0 && selectedService?.imageAnalysisConfig?.enabled && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    ✓ {photos.length} photo{photos.length > 1 ? 's' : ''} uploaded. AI analysis will occur when you submit your request.
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1" data-testid="button-back">
                  Back
                </Button>
                <Button 
                  onClick={() => setStep(4)} 
                  disabled={!description} 
                  className="flex-1 text-white"
                  data-testid="button-continue"
                  style={{ backgroundColor: business?.primaryColor || '#0b66e4' }}
                >
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Address */}
        {step === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>
                <MapPin className="inline h-5 w-5 mr-2" />
                Where is the work needed?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2 p-4 bg-muted rounded-lg">
                <Checkbox
                  id="businessLocation"
                  checked={serviceLocationType === "business"}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setServiceLocationType("business");
                      setAddress(""); // Clear address when switching to business location
                    } else {
                      setServiceLocationType("customer");
                    }
                  }}
                />
                <label htmlFor="businessLocation" className="text-sm font-medium cursor-pointer">
                  I will come to your business location (no travel charge)
                </label>
              </div>

              {serviceLocationType === "customer" ? (
                <AddressAutocomplete
                  value={address}
                  onAddressSelect={(addressData: AddressData) => {
                    setAddress(addressData.fullAddress);
                  }}
                  label="Service Location"
                  required
                  placeholder="Start typing the service address..."
                />
              ) : (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    ✓ Service will be performed at the business location. No travel charges will apply.
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(3)} className="flex-1">
                  Back
                </Button>
                <Button 
                  onClick={() => setStep(5)} 
                  disabled={serviceLocationType === "customer" && !address} 
                  className="flex-1 text-white"
                  style={{ backgroundColor: business?.primaryColor || '#0b66e4' }}
                >
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 5: Contact Details */}
        {step === 5 && (
          <Card>
            <CardHeader>
              <CardTitle>Your Contact Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+27 XX XXX XXXX"
                />
              </div>
              <div className="space-y-3">
                <p className="text-sm font-medium">How would you like to receive your quote?</p>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="emailOptIn"
                    checked={emailOptIn}
                    onCheckedChange={(checked) => setEmailOptIn(checked as boolean)}
                  />
                  <label htmlFor="emailOptIn" className="text-sm cursor-pointer">
                    Send quote via email
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="whatsappOptIn"
                    checked={whatsappOptIn}
                    onCheckedChange={(checked) => setWhatsappOptIn(checked as boolean)}
                  />
                  <label htmlFor="whatsappOptIn" className="text-sm cursor-pointer">
                    Send quote via WhatsApp
                  </label>
                </div>
              </div>
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(4)} className="flex-1">
                  Back
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={!fullName || !email || !phone || submitting}
                  className="flex-1 text-white"
                  style={{ backgroundColor: business?.primaryColor || '#0b66e4' }}
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Generate Quote"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 6: Quote Preview */}
        {step === 6 && quoteResult && (
          <Card>
            <CardHeader className="bg-gray-900 text-white">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle className="text-2xl">QUOTATION</CardTitle>
                  <p className="text-gray-300 mt-1">Quote #{quoteResult.quote.quoteNumber}</p>
                </div>
                <Badge variant="secondary" className="text-sm">
                  AI GENERATED
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* AI Analysis Section */}
              {quoteResult.aiAnalysis && (
                <div 
                  className="p-4 rounded-lg border"
                  style={{ 
                    backgroundColor: `${business?.primaryColor}11` || 'rgba(11, 102, 228, 0.07)',
                    borderColor: `${business?.primaryColor}33` || 'rgba(11, 102, 228, 0.2)'
                  }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="h-5 w-5" style={{ color: business?.primaryColor || '#0b66e4' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <h3 className="font-semibold" style={{ color: business?.primaryColor || '#0b66e4' }}>AI-Powered Quote Analysis</h3>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm text-gray-700">Confidence Score:</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full"
                          style={{ 
                            width: `${(quoteResult.aiAnalysis.confidence * 100)}%`,
                            backgroundColor: business?.primaryColor || '#0b66e4'
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium">{(quoteResult.aiAnalysis.confidence * 100).toFixed(0)}%</span>
                    </div>
                    {quoteResult.aiAnalysis.reasoning && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-gray-600">{quoteResult.aiAnalysis.reasoning}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <Separator />

              {/* Line Items */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-900">
                      <th className="text-left py-3 px-2 font-semibold text-gray-900">DESCRIPTION</th>
                      <th className="text-right py-3 px-2 font-semibold text-gray-900 hidden sm:table-cell">QTY</th>
                      <th className="text-right py-3 px-2 font-semibold text-gray-900 hidden sm:table-cell">RATE</th>
                      <th className="text-right py-3 px-2 font-semibold text-gray-900">AMOUNT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quoteResult.quote.items?.map((item: any, index: number) => (
                      <tr key={index} className="border-b border-gray-200">
                        <td className="py-4 px-2">
                          <div className="text-gray-900">{item.description}</div>
                          <div className="sm:hidden text-xs text-gray-500 mt-1">
                            {parseFloat(item.quantity).toFixed(2)} × R{parseFloat(item.unitPrice).toFixed(2)}
                          </div>
                        </td>
                        <td className="text-right py-4 px-2 text-gray-700 hidden sm:table-cell">
                          {parseFloat(item.quantity).toFixed(2)}
                        </td>
                        <td className="text-right py-4 px-2 text-gray-700 hidden sm:table-cell">
                          R{parseFloat(item.unitPrice).toFixed(2)}
                        </td>
                        <td className="text-right py-4 px-2 font-medium text-gray-900">
                          R{parseFloat(item.lineTotal).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Separator />

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-full sm:w-80 space-y-2">
                  <div className="flex justify-between text-gray-700">
                    <span>Subtotal:</span>
                    <span>R{parseFloat(quoteResult.quote.subtotal).toFixed(2)}</span>
                  </div>
                  {parseFloat(quoteResult.quote.discountAmount || '0') > 0 && (
                    <div className="flex justify-between text-gray-700">
                      <span>Discount:</span>
                      <span>-R{parseFloat(quoteResult.quote.discountAmount).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-700">
                    <span>VAT (15%):</span>
                    <span>R{parseFloat(quoteResult.quote.taxAmount).toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-xl font-bold text-gray-900">
                    <span>TOTAL:</span>
                    <span>R{parseFloat(quoteResult.quote.totalAmount).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="mt-6 p-4 bg-gray-100 border border-gray-300 rounded-md">
                <p className="text-xs text-gray-600 text-center">
                  <strong>This is an estimate based on the information provided.</strong>
                  <br />
                  Final pricing may vary after an on-site assessment. This quote is valid for 14 days.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <Button onClick={() => setStep(7)} className="w-full bg-green-600 hover:bg-green-700" size="lg">
                  Accept & Schedule Visit
                </Button>
                <Button variant="destructive" onClick={() => setShowDeclineDialog(true)} className="w-full">
                  Decline Quote
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 7: Calendar Booking */}
        {step === 7 && quoteResult && (
          <Card>
            <CardHeader>
              <CardTitle>
                <Calendar className="inline h-5 w-5 mr-2" />
                Schedule Your Site Visit
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <AlertCircle className="inline h-5 w-5 mr-2 text-yellow-600" />
                  <strong>Important:</strong> For large bookings, a site visit is required to confirm the final quote. Please select a suitable date and time.
                </p>
              </div>
              <CalendarBooking
                businessSlug={slug!}
                quoteId={quoteResult.quote.id}
                token={quoteResult.quote.publicToken || ""}
                onBookingComplete={() => {
                  setStep(8);
                }}
              />
            </CardContent>
          </Card>
        )}

        {/* Step 8: Booking Confirmation or Decline Thank You */}
        {step === 8 && (
          <Card>
            <CardHeader>
              <CardTitle>
                {quoteResult?.quote?.status === 'declined' ? (
                  <>
                    Thank You for Your Consideration
                  </>
                ) : (
                  <>
                    <Check className="inline h-5 w-5 mr-2 text-green-600" />
                    Booking Confirmed!
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              {quoteResult?.quote?.status === 'declined' ? (
                <>
                  <p className="text-lg text-gray-700">
                    Thank you for letting us know. We appreciate you taking the time to review our quote.
                  </p>
                  {declineReason && (
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-md text-left">
                      <p className="text-sm text-gray-600">
                        <strong>Your feedback:</strong>
                      </p>
                      <p className="text-sm text-gray-700 mt-2">{declineReason}</p>
                    </div>
                  )}
                  <p className="text-sm text-gray-600">
                    If you change your mind or need assistance in the future, please don't hesitate to reach out.
                  </p>
                </>
              ) : (
                <p className="text-lg text-gray-700">
                  Thank you for booking your site visit. We will be in touch shortly to confirm the details.
                </p>
              )}
              <Button onClick={() => navigate(`/${slug}`)} className="w-full text-white" style={{ backgroundColor: business?.primaryColor || '#0b66e4' }}>
                Back to Business Page
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Decline Dialog */}
        <Dialog open={showDeclineDialog} onOpenChange={setShowDeclineDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Are you sure you want to decline this quote?</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Label htmlFor="declineReason">Please provide a reason for declining (optional)</Label>
              <Textarea
                id="declineReason"
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="e.g., Price is too high, found a better offer, etc."
                rows={4}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeclineDialog(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDecline} disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Decline Quote"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}