import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Mail, Phone, MapPin, Calendar, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface QuoteData {
  quote: {
    id: string;
    quoteNumber: string;
    title?: string;
    status: string;
    validUntil: string;
    subtotal: string;
    taxAmount: string;
    discountAmount: string;
    totalAmount: string;
    notes: string;
    createdAt: string;
    latestVersionId?: string;
    requiresDeposit?: boolean;
    depositPercentage?: string;
    depositAmount?: string;
    items: Array<{
      description: string;
      quantity: string;
      unitPrice: string;
      lineTotal: string;
    }>;
  };
  business: {
    businessName: string;
    email: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    province: string;
    postalCode: string;
    logoUrl?: string;
    depositCancellationThresholdHours?: number;
    slug?: string; // Added slug here based on usage in fetchAvailableSlots
  };
  contact: {
    fullName: string;
    email: string;
    phone?: string;
  };
  version?: {
    aiExtractedFeatures: any;
    aiConfidenceScore: string;
    aiReasoning: string;
  };
}

export default function PublicQuoteView() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [quoteData, setQuoteData] = useState<QuoteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showChangesDialog, setShowChangesDialog] = useState(false);
  const [changeRequest, setChangeRequest] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showBookVisit, setShowBookVisit] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [preferredTime, setPreferredTime] = useState("");
  const [bookingNotes, setBookingNotes] = useState("");
  const [availableSlots, setAvailableSlots] = useState<Record<string, string[]>>({});
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [existingBooking, setExistingBooking] = useState<{
    jobId: string;
    scheduledDate: string;
    scheduledStartTime: string;
    scheduledEndTime: string;
  } | null>(null);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [depositDeadline, setDepositDeadline] = useState<Date | undefined>(undefined); // Added state for deposit deadline
  const [jobStatus, setJobStatus] = useState<string | null>(null); // Track the job status for UI logic
  const [jobCompletedAt, setJobCompletedAt] = useState<string | null>(null); // Track when job was completed

  const availableTimesForDate = selectedDate
    ? availableSlots[selectedDate.toISOString().split('T')[0]] || []
    : [];

  useEffect(() => {
    const fetchQuote = async () => {
      const params = new URLSearchParams(window.location.search);
      const pathParts = window.location.pathname.split('/');
      const quoteId = pathParts[pathParts.length - 2]; // Get quote ID from path like /quotes/:id/view
      const token = params.get('token');

      if (!quoteId || !token) {
        setError("Invalid quote link");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/public/quote/${quoteId}?token=${token}`);
        if (!response.ok) throw new Error("Quote not found");

        const data = await response.json();

        // Fetch quote version if available
        if (data.quote.latestVersionId) {
          try {
            const versionResponse = await fetch(`/api/public/quote-version/${data.quote.latestVersionId}?token=${token}`);
            if (versionResponse.ok) {
              const versionData = await versionResponse.json();
              data.version = versionData;
            }
          } catch (err) {
            console.error("Failed to fetch quote version:", err);
          }
        }

        // Check for existing booking (job) - fetch if quote was ever accepted or deposit was paid, regardless of current status
        if (data.quote.status === 'accepted' || data.quote.status === 'deposit_paid') {
          try {
            const jobResponse = await fetch(`/api/public/quote/${quoteId}/job?token=${token}`);
            if (jobResponse.ok) {
              const jobData = await jobResponse.json();
              if (jobData.job) {
                setExistingBooking({
                  jobId: jobData.job.id,
                  scheduledDate: jobData.job.scheduledDate,
                  scheduledStartTime: jobData.job.scheduledStartTime,
                  scheduledEndTime: jobData.job.scheduledEndTime,
                });

                // Track job status for UI logic
                setJobStatus(jobData.job.status);

                // Set deposit deadline if job is pending deposit
                if (jobData.job.status === 'pending_deposit' && jobData.job.depositDeadline) {
                  setDepositDeadline(new Date(jobData.job.depositDeadline));
                }

                // Track completion date if job is completed
                if (jobData.job.status === 'completed' && jobData.job.actualEndTime) {
                  setJobCompletedAt(jobData.job.actualEndTime);
                }
              }
            }
          } catch (err) {
            console.error("Failed to fetch existing booking:", err);
          }
        }

        setQuoteData(data);
      } catch (err) {
        setError("Unable to load quote. Please check your link.");
      } finally {
        setLoading(false);
      }
    };

    fetchQuote();
  }, []);

  // Fetch available slots when the dialog opens or date changes
  useEffect(() => {
    if (showBookVisit && quoteData?.business) {
      fetchAvailableSlots();
    }
  }, [showBookVisit, quoteData]);

  const fetchAvailableSlots = async () => {
    if (!quoteData?.business) return;

    setLoadingSlots(true);
    try {
      // Get the business slug from the URL or business data
      const pathParts = window.location.pathname.split('/');
      const slug = quoteData.business.slug || pathParts[pathParts.length - 2]; // Use slug from business data if available

      const response = await fetch(`/api/public/${slug}/availability?quoteId=${quoteData.quote.id}`);
      if (!response.ok) throw new Error("Failed to fetch availability");

      const slots = await response.json();
      setAvailableSlots(slots);
    } catch (err) {
      console.error("Failed to fetch available slots:", err);
      setError("Could not load available booking slots. Please try again later.");
    } finally {
      setLoadingSlots(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading quote...</p>
        </div>
      </div>
    );
  }

  if (error || !quoteData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <p className="text-center text-red-600">{error}</p>
            <Button onClick={() => navigate("/")} className="w-full mt-4">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { quote, business, contact, version } = quoteData;
  const formatCurrency = (amount: string) => `R ${parseFloat(amount).toFixed(2)}`;
  const formatDate = (date: string) => new Date(date).toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const handleAcceptQuote = async () => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (!token) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/public/quote/${quote.id}/accept?token=${token}`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error("Failed to accept quote");

      const result = await response.json();

      // Update quote data with the returned quote object
      if (result.quote && quoteData) {
        setQuoteData({ 
          ...quoteData, 
          quote: {
            ...quoteData.quote,
            ...result.quote
          }
        });
      }

      if (result.job) {
        setExistingBooking({
          jobId: result.job.id,
          scheduledDate: result.job.scheduledDate,
          scheduledStartTime: result.job.scheduledStartTime,
          scheduledEndTime: result.job.scheduledEndTime,
        });
        setJobStatus(result.job.status);
        if (result.job.status === 'pending_deposit' && result.job.depositDeadline) {
          setDepositDeadline(new Date(result.job.depositDeadline));
        } else if (result.job.status !== 'pending_deposit') {
          setDepositDeadline(undefined); // Clear deadline if not pending deposit
        }
        if (result.job.status === 'completed' && result.job.actualEndTime) {
          setJobCompletedAt(result.job.actualEndTime);
        }
      } else {
        setExistingBooking(null); // Clear existing booking if not present in response
        setDepositDeadline(undefined); // Clear deadline if no job info
        setJobStatus(null);
      }

      // Always show success message
      toast({
        title: "Quote Accepted",
        description: result.requiresDepositPayment
          ? "Please pay the deposit to confirm your booking."
          : result.requiresBooking
          ? "Great! Now let's schedule your appointment."
          : "We'll be in touch soon to schedule your appointment.",
      });

      // Show booking dialog if required (even if deposit required - they still need to schedule)
      if (result.requiresBooking) {
        setShowBookVisit(true);
        // Fetch availability
        await fetchAvailableSlots();
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to accept quote. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeclineQuote = async () => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (!token) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/public/quote/${quote.id}/decline?token=${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: declineReason.trim() || '' }),
      });

      if (!response.ok) throw new Error("Failed to decline quote");

      const result = await response.json();
      setQuoteData({ ...quoteData, quote: result.quote });

      setShowDeclineDialog(false);
      setDeclineReason("");

      toast({
        title: "Quote Declined",
        description: "Thank you for letting us know. We appreciate your consideration.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to process your response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestChanges = async () => {
    if (!changeRequest.trim()) {
      toast({
        title: "Missing Information",
        description: "Please describe the changes you'd like to request.",
        variant: "destructive",
      });
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (!token) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/public/quote/${quote.id}/request-changes?token=${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ changes: changeRequest }),
      });

      if (!response.ok) throw new Error("Failed to submit changes");

      setShowChangesDialog(false);
      setChangeRequest("");
      toast({
        title: "Request Sent",
        description: "We'll review your changes and get back to you shortly.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to submit request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleBookVisit = async () => {
    if (!selectedDate || !preferredTime) {
      toast({
        title: "Missing Information",
        description: "Please select a date and time for your site visit.",
        variant: "destructive",
      });
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (!token) return;

    setSubmitting(true);
    try {
      const endpoint = isRescheduling
        ? `/api/public/quotes/${quote.id}/reschedule`
        : `/api/public/quotes/${quote.id}/book`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          date: selectedDate.toISOString().split('T')[0],
          time: preferredTime,
          notes: bookingNotes,
          ...(isRescheduling && existingBooking ? { oldJobId: existingBooking.jobId } : {}),
        }),
      });

      if (!response.ok) throw new Error("Failed to book visit");

      const result = await response.json();

      // Update existing booking state and deposit deadline
      setExistingBooking({
        jobId: result.job.id,
        scheduledDate: result.job.scheduledDate,
        scheduledStartTime: result.job.scheduledStartTime,
        scheduledEndTime: result.job.scheduledEndTime,
      });
      if (result.job.status === 'pending_deposit' && result.job.depositDeadline) {
        setDepositDeadline(new Date(result.job.depositDeadline));
      } else {
        setDepositDeadline(undefined); // Clear deadline if not pending deposit
      }

      setShowBookVisit(false);
      setIsRescheduling(false);
      setSelectedDate(undefined);
      setPreferredTime("");
      setBookingNotes("");

      toast({
        title: isRescheduling ? "Booking Rescheduled" : "Booking Confirmed",
        description: "You'll receive a confirmation email shortly.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: `Failed to ${isRescheduling ? 'reschedule' : 'book'} visit. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const depositExpiresSoon = depositDeadline && depositDeadline.getTime() - new Date().getTime() < (quoteData?.business?.depositCancellationThresholdHours || 24) * 60 * 60 * 1000;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Card */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-4">
                {business.logoUrl && (
                  <img
                    src={business.logoUrl}
                    alt={business.businessName}
                    className="h-16 w-16 object-contain"
                  />
                )}
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{business.businessName}</h1>
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                    <Mail className="h-4 w-4" />
                    <span>{business.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="h-4 w-4" />
                    <span>{business.phone}</span>
                  </div>
                </div>
              </div>
              <Badge variant={quote.status === 'accepted' ? 'default' : 'secondary'} className="text-sm">
                {quote.status.toUpperCase()}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* AI Analysis Section - Only show for ai_sent status */}
        {version && quote.status === 'ai_sent' && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                AI-Powered Quote Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="bg-white p-4 rounded-lg">
                  <h3 className="font-semibold text-sm text-gray-700 mb-2">Confidence Score</h3>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${parseFloat(version.aiConfidenceScore) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{(parseFloat(version.aiConfidenceScore) * 100).toFixed(0)}%</span>
                  </div>
                </div>

                {version.aiExtractedFeatures && (
                  <div className="bg-white p-4 rounded-lg">
                    <h3 className="font-semibold text-sm text-gray-700 mb-2">Extracted Details</h3>
                    <div className="space-y-1 text-sm">
                      {version.aiExtractedFeatures.estimatedHours && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Est. Hours:</span>
                          <span className="font-medium">{version.aiExtractedFeatures.estimatedHours}h</span>
                        </div>
                      )}
                      {version.aiExtractedFeatures.distance && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Distance:</span>
                          <span className="font-medium">{version.aiExtractedFeatures.distance}km</span>
                        </div>
                      )}
                      {version.aiExtractedFeatures.urgency && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Urgency:</span>
                          <span className="font-medium capitalize">{version.aiExtractedFeatures.urgency}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {version.aiReasoning && (
                <div className="bg-white p-4 rounded-lg">
                  <h3 className="font-semibold text-sm text-gray-700 mb-2">How This Price Was Calculated</h3>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{version.aiReasoning}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Quote Details Card */}
        <Card className="mb-6">
          <CardHeader className="bg-gray-900 text-white">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex-1">
                <CardTitle className="text-2xl">QUOTATION</CardTitle>
                {quote.title && (
                  <p className="text-gray-100 mt-2 font-medium">{quote.title}</p>
                )}
                <p className="text-gray-300 mt-1">Quote #{quote.quoteNumber}</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(quote.createdAt)}</span>
                </div>
                {quote.validUntil && (
                  <p className="text-sm text-gray-300 mt-1">
                    Valid until: {formatDate(quote.validUntil)}
                  </p>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {/* Bill To */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">BILL TO:</h3>
              <div className="text-gray-700">
                <p className="font-medium">{contact.fullName}</p>
                <p className="text-sm">{contact.email}</p>
                {contact.phone && <p className="text-sm">{contact.phone}</p>}
              </div>
            </div>

            <Separator className="my-6" />

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
                  {quote.items.map((item, index) => {
                    // Check if this is a labor, material, or bundled item
                    const isLabor = item.description.includes('- Labor');
                    const isMaterial = item.description.includes('Materials & Supplies') || 
                                      (!isLabor && index > 0);
                    
                    return (
                      <tr key={index} className={`border-b border-gray-200 ${isMaterial ? 'bg-blue-50/30' : ''}`}>
                        <td className="py-4 px-2">
                          <div className={`${isLabor ? 'font-semibold' : ''} text-gray-900`}>
                            {item.description}
                          </div>
                          {isMaterial && item.description === 'Materials & Supplies' && (
                            <div className="text-xs text-gray-600 mt-1">
                              Bundled materials and supplies
                            </div>
                          )}
                          <div className="sm:hidden text-xs text-gray-500 mt-1">
                            {parseFloat(item.quantity).toFixed(2)} × {formatCurrency(item.unitPrice)}
                          </div>
                        </td>
                        <td className="text-right py-4 px-2 text-gray-700 hidden sm:table-cell">
                          {parseFloat(item.quantity).toFixed(2)}
                        </td>
                        <td className="text-right py-4 px-2 text-gray-700 hidden sm:table-cell">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="text-right py-4 px-2 font-medium text-gray-900">
                          {formatCurrency(item.lineTotal)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <Separator className="my-6" />

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-full sm:w-80 space-y-2">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(quote.subtotal)}</span>
                </div>
                {parseFloat(quote.discountAmount) > 0 && (
                  <div className="flex justify-between text-gray-700">
                    <span>Discount:</span>
                    <span>-{formatCurrency(quote.discountAmount)}</span>
                  </div>
                )}
                {parseFloat(quote.taxAmount) > 0 && (
                  <div className="flex justify-between text-gray-700">
                    <span>VAT (15%):</span>
                    <span>{formatCurrency(quote.taxAmount)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-xl font-bold text-gray-900">
                  <span>TOTAL:</span>
                  <span>{formatCurrency(quote.totalAmount)}</span>
                </div>

                {/* Deposit Requirement Display */}
                {quote.requiresDeposit && (
                  <div className={`mt-4 p-4 rounded-md border ${quote.status === 'deposit_paid' ? 'bg-emerald-50 border-emerald-200' : 'bg-blue-50 border-blue-200'}`}>
                    <p className={`text-sm font-semibold mb-2 ${quote.status === 'deposit_paid' ? 'text-emerald-900' : 'text-blue-900'}`}>
                      {quote.status === 'deposit_paid' ? 'Deposit Paid' : 'Deposit Deadline'}
                    </p>
                    <div className={`text-sm ${quote.status === 'deposit_paid' ? 'text-emerald-800' : 'text-blue-800'}`}>
                      {quote.depositPercentage && (
                        <p>Deposit: {parseFloat(quote.depositPercentage).toFixed(0)}% = {formatCurrency((parseFloat(quote.totalAmount) * parseFloat(quote.depositPercentage) / 100).toFixed(2))}</p>
                      )}
                      {quote.depositAmount && !quote.depositPercentage && (
                        <p>Deposit: {formatCurrency(quote.depositAmount)}</p>
                      )}
                      {quote.status === 'deposit_paid' && (
                        <p className="text-xs mt-1 text-emerald-700 font-medium">
                          ✓ Your deposit has been received. We will proceed with your booking.
                        </p>
                      )}
                      {(quote.status === 'sent' || quote.status === 'ai_quote' || quote.status === 'viewed' || quote.status === 'accepted') && (
                        <p className={`text-xs mt-1 ${quote.status === 'accepted' ? 'text-green-700 font-medium' : 'text-blue-600'}`}>
                          {quote.status === 'accepted' && '✓ '}We require deposits of {quote.depositPercentage ? `${parseFloat(quote.depositPercentage).toFixed(0)}%` : 'the quoted amount'} to be made at least {quoteData?.business?.depositCancellationThresholdHours || 24} hours before the start of the job.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            {quote.notes && (
              <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-md">
                <div className="flex items-start gap-2">
                  <FileText className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-amber-900 mb-2">Important Notes:</h4>
                    <p className="text-sm text-amber-800 whitespace-pre-wrap">{quote.notes}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Disclaimer */}
            <div className="mt-6 p-4 bg-gray-100 border border-gray-300 rounded-md">
              <p className="text-xs text-gray-600 text-center">
                <strong>This is an estimate based on the information provided.</strong>
                <br />
                Final pricing may vary after an on-site assessment. This quote is valid for {quote.validUntil ?
                  `${Math.ceil((new Date(quote.validUntil).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days` : '14 days'}.
              </p>
            </div>

            {/* Actions */}
            {(quote.status === 'sent' || quote.status === 'ai_quote' || quote.status === 'viewed') && (
              <div className="mt-6">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    size="lg"
                    onClick={handleAcceptQuote}
                    disabled={submitting}
                  >
                    {submitting ? 'Processing...' : 'Accept Quote'}
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    size="lg"
                    onClick={() => setShowDeclineDialog(true)}
                    disabled={submitting}
                  >
                    Decline
                  </Button>
                </div>
              </div>
            )}

            {quote.status === 'accepted' && (
              <div className="mt-6 space-y-3">
                {/* Job In Progress State */}

                {jobStatus === 'in_progress' && existingBooking?.scheduledDate && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-blue-900 text-center font-semibold mb-3">
                      ⚙️ Your Job is Currently In Progress
                    </p>
                    <div className="bg-white p-3 rounded border border-blue-300">
                      <div className="text-sm space-y-1">
                        <p className="text-gray-600">
                          Started on:
                        </p>
                        <p className="font-semibold text-gray-900">
                          📅 {new Date(existingBooking.scheduledDate).toLocaleDateString('en-ZA', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                        {existingBooking.scheduledStartTime && (
                          <p className="text-gray-700">
                            🕐 {existingBooking.scheduledStartTime}
                            {existingBooking.scheduledEndTime && ` - ${existingBooking.scheduledEndTime}`}
                          </p>
                        )}
                        {quote.locationAddress && (
                          <p className="text-gray-600 text-xs mt-2">
                            📍 {quote.locationAddress}
                          </p>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-blue-800 mt-3 text-center">
                      This job cannot be rescheduled while in progress. We'll notify you when it's complete.
                    </p>
                  </div>
                )}

                {/* Job Completed State */}
                {jobStatus === 'completed' && existingBooking?.scheduledDate && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-md">
                    <p className="text-emerald-900 text-center font-semibold mb-3">
                      ✓ Job Completed
                    </p>
                    <div className="bg-white p-3 rounded border border-emerald-300">
                      <div className="text-sm space-y-2">
                        <div>
                          <p className="text-gray-600 text-xs">Scheduled Date:</p>
                          <p className="font-semibold text-gray-900">
                            📅 {new Date(existingBooking.scheduledDate).toLocaleDateString('en-ZA', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                        {jobCompletedAt && (
                          <div>
                            <p className="text-gray-600 text-xs">Completed On:</p>
                            <p className="font-semibold text-emerald-900">
                              ✓ {new Date(jobCompletedAt).toLocaleDateString('en-ZA', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        )}
                        {quote.locationAddress && (
                          <p className="text-gray-600 text-xs mt-2">
                            📍 {quote.locationAddress}
                          </p>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-emerald-800 mt-3 text-center">
                      Thank you for your business! This job has been completed and cannot be rescheduled.
                    </p>
                  </div>
                )}

                {/* Job Cancelled State */}
                {jobStatus === 'cancelled' && (
                  <div className="p-4 bg-gray-100 border border-gray-300 rounded-md">
                    <p className="text-gray-800 text-center font-semibold mb-3">
                      ✗ Booking Cancelled
                    </p>
                    <p className="text-sm text-gray-700 text-center">
                      This booking has been cancelled and is no longer available. Please contact us if you'd like to reschedule.
                    </p>
                  </div>
                )}

                {/* Job Scheduled State - Can Reschedule */}
                {existingBooking && existingBooking.scheduledDate && jobStatus === 'scheduled' ? (
                  <>
                    <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                      <p className="text-green-800 text-center font-medium mb-3">
                        ✓ Your appointment is scheduled!
                      </p>
                      <div className="bg-white p-3 rounded border border-green-300">
                        <div className="text-sm space-y-1">
                          <p className="font-semibold text-gray-900">
                            📅 {new Date(existingBooking.scheduledDate).toLocaleDateString('en-ZA', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                          {existingBooking.scheduledStartTime && (
                            <p className="text-gray-700">
                              🕐 {existingBooking.scheduledStartTime}
                              {existingBooking.scheduledEndTime && ` - ${existingBooking.scheduledEndTime}`}
                            </p>
                          )}
                          {quote.locationAddress && (
                            <p className="text-gray-600 text-xs mt-2">
                              📍 {quote.locationAddress}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    {!depositDeadline && (
                      <Button
                        variant="outline"
                        className="w-full"
                        size="lg"
                        onClick={() => {
                          setIsRescheduling(true);
                          setShowBookVisit(true);
                        }}
                      >
                        Reschedule Appointment
                      </Button>
                    )}
                  </>
                ) : (!existingBooking?.scheduledDate || !jobStatus) && (
                  <>
                    <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                      <p className="text-green-800 text-center font-medium">
                        ✓ Quote Accepted! Now let's schedule your appointment.
                      </p>
                      {depositDeadline && (
                        <p className="text-sm text-green-700 mt-2 text-center">
                          You'll need to pay the deposit after scheduling to confirm your booking.
                        </p>
                      )}
                    </div>
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={() => {
                        setIsRescheduling(false);
                        setShowBookVisit(true);
                      }}
                    >
                      Schedule Appointment
                    </Button>
                  </>
                )}
              </div>
            )}

            {quote.status === 'declined' && (
              <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
                <p className="text-gray-800 text-center font-medium">
                  Quote Declined
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4 mt-0.5" />
              <div>
                <p>{business.addressLine1}</p>
                {business.addressLine2 && <p>{business.addressLine2}</p>}
                <p>{business.city}, {business.province} {business.postalCode}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Request Changes Dialog */}
        <Dialog open={showChangesDialog} onOpenChange={setShowChangesDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Changes to Quote</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Please describe the changes you'd like:
                </label>
                <Textarea
                  placeholder="E.g., Could you include additional services? Can we adjust the timeline?"
                  value={changeRequest}
                  onChange={(e) => setChangeRequest(e.target.value)}
                  rows={5}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowChangesDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleRequestChanges} disabled={submitting}>
                {submitting ? 'Sending...' : 'Submit Request'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Decline Quote Dialog */}
        <Dialog open={showDeclineDialog} onOpenChange={setShowDeclineDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Decline Quote</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                We're sorry this quote doesn't meet your needs. Would you like to tell us why? This helps us improve our service.
              </p>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Reason for declining (Optional)
                </label>
                <Textarea
                  placeholder="e.g., Price is too high, Need more time to decide, Found another provider..."
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowDeclineDialog(false);
                setDeclineReason("");
              }}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeclineQuote}
                disabled={submitting}
              >
                {submitting ? 'Declining...' : 'Decline Quote'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Book Site Visit Dialog */}
        <Dialog open={showBookVisit} onOpenChange={(open) => {
          setShowBookVisit(open);
          if (!open) {
            setIsRescheduling(false);
            setSelectedDate(undefined);
            setPreferredTime("");
            setBookingNotes("");
            setDepositDeadline(undefined); // Clear deposit deadline when closing dialog
          }
        }}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {isRescheduling ? 'Reschedule Your Appointment' : (quote.status === 'accepted' ? 'Schedule Your Appointment' : 'Book Site Visit')}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Date</label>
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => {
                      const dateStr = date.toISOString().split('T')[0];
                      return !availableSlots[dateStr] || availableSlots[dateStr].length === 0;
                    }}
                    className="rounded-md border"
                  />
                  {loadingSlots && (
                    <p className="text-xs text-gray-500">Loading available dates...</p>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Available Times
                      {selectedDate && ` for ${selectedDate.toLocaleDateString()}`}
                    </label>
                    {!selectedDate ? (
                      <div className="text-sm text-gray-500 py-8 text-center border rounded-lg">
                        Select a date to see available times
                      </div>
                    ) : availableTimesForDate.length === 0 ? (
                      <div className="text-sm text-gray-500 py-8 text-center border rounded-lg">
                        No available times for this date
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto p-2 border rounded-lg">
                        {availableTimesForDate.map((time) => (
                          <Button
                            key={time}
                            variant={preferredTime === time ? "default" : "outline"}
                            size="sm"
                            onClick={() => setPreferredTime(time)}
                            className="w-full"
                          >
                            {time}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Notes (Optional)</label>
                    <Textarea
                      value={bookingNotes}
                      onChange={(e) => setBookingNotes(e.target.value)}
                      placeholder="e.g., Please call when arriving, gate code is 1234"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {selectedDate && preferredTime && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-sm mb-2">Booking Summary</h4>
                  <div className="text-sm space-y-1">
                    <p><strong>Date:</strong> {selectedDate.toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    <p><strong>Time:</strong> {preferredTime}</p>
                    <p><strong>Duration:</strong> ~60 minutes</p>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowBookVisit(false);
                setIsRescheduling(false);
              }}>
                Cancel
              </Button>
              <Button onClick={handleBookVisit} disabled={!selectedDate || !preferredTime || submitting}>
                {submitting ? (isRescheduling ? "Rescheduling..." : "Booking...") : (isRescheduling ? "Confirm Reschedule" : "Confirm Booking")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}