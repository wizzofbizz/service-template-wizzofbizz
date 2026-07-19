
import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { AddressAutocomplete, type AddressData } from "@/components/ui/address-autocomplete";
import { JobCalendarBooking } from "@/components/JobCalendarBooking";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type JobStatus = "draft" | "scheduled" | "in_progress" | "completed" | "cancelled";

interface Contact {
  id: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
}

interface Quote {
  id: string;
  quoteNumber: string;
  contactId: string;
  status: string;
  totalAmount: string;
  validUntil: string;
  createdAt: string;
  notes?: string;
  items?: QuoteItem[];
}

interface QuoteItem {
  id: string;
  description: string;
  quantity: string;
  unitPrice: string;
  lineTotal: string;
}

export default function JobFormPage() {
  const pageStyle = { fontFamily: 'var(--font-sans)' };
  const [, setLocation] = useLocation();
  const [matchEdit, paramsEdit] = useRoute("/dashboard/jobs/:id/edit");
  const [matchNew] = useRoute("/dashboard/jobs/new");

  const isEdit = matchEdit && !!paramsEdit?.id;
  const isNew = matchNew;
  const jobId = paramsEdit?.id || null;

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Check for contactId and quoteId in URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const urlContactId = urlParams.get('contactId');
  const urlQuoteId = urlParams.get('quoteId');

  const [contactId, setContactId] = useState(urlContactId || "");
  const [contactSearch, setContactSearch] = useState("");
  const [quoteId, setQuoteId] = useState(urlQuoteId || "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [serviceType, setServiceType] = useState("regular");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [scheduledDate, setScheduledDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [estimatedDuration, setEstimatedDuration] = useState("");
  const [locationAddress, setLocationAddress] = useState("");
  const [serviceLocationType, setServiceLocationType] = useState<"customer" | "business">("customer");
  const [internalNotes, setInternalNotes] = useState("");
  const [lineItems, setLineItems] = useState<Array<{
    id?: string;
    description: string;
    quantity: string;
    unitPrice: string;
    lineTotal: string;
  }>>([]);

  const { data: contacts = [] } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
    queryFn: async () => {
      const res = await fetch("/api/contacts", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch contacts");
      return res.json();
    },
  });

  const { data: allQuotes = [] } = useQuery<Quote[]>({
    queryKey: ["/api/quotes"],
    queryFn: async () => {
      const res = await fetch("/api/quotes", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch quotes");
      return res.json();
    },
  });

  // Filter quotes for selected customer (only sent, viewed, and ai_quote statuses)
  const customerQuotes = contactId && Array.isArray(allQuotes)
    ? allQuotes.filter(q => 
        q?.contactId === contactId && 
        (q?.status === "sent" || q?.status === "viewed" || q?.status === "ai_quote")
      )
    : [];

  // Get selected quote details
  const selectedQuote = quoteId && Array.isArray(allQuotes) 
    ? allQuotes.find(q => q?.id === quoteId) || null 
    : null;

  // Auto-select customer from quote if quoteId came from URL
  useEffect(() => {
    if (urlQuoteId && allQuotes.length > 0 && !contactId) {
      const quote = allQuotes.find(q => q?.id === urlQuoteId);
      if (quote) {
        setContactId(quote.contactId);
      }
    }
  }, [allQuotes, urlQuoteId, contactId]);

  // Reset quote selection when customer changes
  useEffect(() => {
    if (contactId && quoteId && Array.isArray(allQuotes)) {
      const quote = allQuotes.find(q => q?.id === quoteId);
      if (!quote || quote.contactId !== contactId) {
        setQuoteId("");
      }
    }
  }, [contactId, quoteId, allQuotes]);

  // Auto-populate job details from selected quote
  useEffect(() => {
    if (selectedQuote && !isEdit && selectedQuote.quoteNumber) {
      // Only auto-populate on new jobs, not when editing
      if (!title) {
        setTitle(selectedQuote.title || `Service from Quote ${selectedQuote.quoteNumber}`);
      }
      if (!description && selectedQuote.notes) {
        setDescription(selectedQuote.notes);
      }
      // Auto-populate address from quote
      if (!locationAddress && selectedQuote.locationAddress) {
        setLocationAddress(selectedQuote.locationAddress);
      }
      // Auto-populate line items from quote
      if (selectedQuote.items && Array.isArray(selectedQuote.items) && selectedQuote.items.length > 0) {
        setLineItems(selectedQuote.items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal: item.lineTotal,
        })));
      }
    }
  }, [selectedQuote, isEdit, title, description, locationAddress]);

  const { data: existingJob, isLoading: isLoadingJob } = useQuery({
    queryKey: ["/api/jobs", jobId],
    queryFn: async () => {
      if (!jobId) return null;
      const res = await fetch(`/api/jobs/${jobId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch job");
      return res.json();
    },
    enabled: !!jobId,
  });

  // Load existing job data
  useEffect(() => {
    if (existingJob && !title) {
      setContactId(existingJob.contactId);
      setQuoteId(existingJob.quoteId || "");
      setTitle(existingJob.title);
      setDescription(existingJob.description || "");
      setServiceType(existingJob.serviceType || "");
      setPriority(existingJob.priority || "medium");
      setScheduledDate(existingJob.scheduledDate?.split("T")[0] || "");
      setStartTime(existingJob.scheduledStartTime || "");
      setEndTime(existingJob.scheduledEndTime || "");
      setEstimatedDuration(existingJob.estimatedDuration || "");
      setLocationAddress(existingJob.locationAddress || "");
      setInternalNotes(existingJob.internalNotes || "");
      if (existingJob.items && Array.isArray(existingJob.items)) {
        setLineItems(existingJob.items);
      }
    }
  }, [existingJob, title]);

  // Filter contacts based on search
  const filteredContacts = contacts.filter((contact) => {
    if (!contactSearch) return true;
    const searchLower = contactSearch.toLowerCase();
    return (
      contact.fullName?.toLowerCase().includes(searchLower) ||
      contact.email?.toLowerCase().includes(searchLower) ||
      contact.phone?.toLowerCase().includes(searchLower)
    );
  });

  const saveMutation = useMutation({
    mutationFn: async (status: JobStatus) => {
      const payload = {
        contactId,
        quoteId: quoteId || undefined,
        title,
        description: description || undefined,
        serviceType: serviceType || undefined,
        priority,
        scheduledDate: scheduledDate || undefined,
        scheduledStartTime: startTime || undefined,
        scheduledEndTime: endTime || undefined,
        estimatedDuration: estimatedDuration || undefined,
        locationAddress: locationAddress || undefined,
        internalNotes: internalNotes || undefined,
        status,
        items: lineItems.length > 0 ? lineItems : undefined,
      };

      const url = isEdit ? `/api/jobs/${jobId}` : "/api/jobs";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to save job");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      toast({
        title: "Success",
        description: `Job ${isEdit ? "updated" : "created"} successfully`,
      });
      setLocation("/dashboard/jobs");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save job",
        variant: "destructive",
      });
    },
  });

  const handleSave = (status: JobStatus) => {
    // Build list of missing fields
    const missingFields = [];
    
    if (!contactId) missingFields.push("Customer");
    if (!title) missingFields.push("Job Title");
    
    // For scheduled jobs, require date and time
    if (status !== "draft") {
      if (!scheduledDate) missingFields.push("Scheduled Date");
      if (!startTime) missingFields.push("Start Time");
    }
    
    if (missingFields.length > 0) {
      toast({
        title: "Missing required fields",
        description: `Please fill in: ${missingFields.join(", ")}`,
        variant: "destructive",
      });
      return;
    }
    
    saveMutation.mutate(status);
  };

  return (
    <div className="space-y-6" style={pageStyle}>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/dashboard/jobs")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {isEdit ? "Edit Job" : "Schedule New Job"}
          </h1>
          {isEdit && existingJob && (
            <p className="text-muted-foreground mt-1">
              Job #{existingJob.jobNumber}
            </p>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Job Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="customer">Customer *</Label>
              <div className="space-y-2">
                <Input
                  placeholder="Search by name, email, or phone..."
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                />
                <Select value={contactId} onValueChange={setContactId}>
                  <SelectTrigger id="customer">
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredContacts.length === 0 ? (
                      <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                        No customers found
                      </div>
                    ) : (
                      filteredContacts.map((contact) => (
                        <SelectItem key={contact.id} value={contact.id}>
                          {contact.fullName}
                          {contact.email && ` (${contact.email})`}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quoteReference">Quote Reference (Optional)</Label>
              {!contactId ? (
                <p className="text-sm text-muted-foreground py-2">
                  Select a customer first to link a quote
                </p>
              ) : customerQuotes.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  No open quotes available for this customer
                </p>
              ) : (
                <>
                  <div className="space-y-2">
                    <Select value={quoteId || "none"} onValueChange={(val) => setQuoteId(val === "none" ? "" : val)}>
                      <SelectTrigger id="quoteReference">
                        <SelectValue placeholder="Select a quote to link" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None (No quote linked)</SelectItem>
                        {customerQuotes.map((quote) => (
                          <SelectItem key={quote.id} value={quote.id}>
                            {quote.quoteNumber} - {formatCurrency(parseFloat(quote.totalAmount || "0"))} ({quote.status})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {quoteId && (
                      <Button 
                        type="button"
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setQuoteId("")}
                        className="text-xs"
                      >
                        Clear quote selection
                      </Button>
                    )}
                  </div>
                  {selectedQuote && (
                    <div className="mt-2 p-3 bg-muted rounded-md space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium">Linked Quote: {selectedQuote.quoteNumber || "N/A"}</p>
                          <p className="text-xs text-muted-foreground">
                            Amount: {formatCurrency(parseFloat(selectedQuote.totalAmount || "0"))} • Status: {selectedQuote.status || "N/A"}
                          </p>
                        </div>
                      </div>
                      {selectedQuote.items && Array.isArray(selectedQuote.items) && selectedQuote.items.length > 0 && (
                        <div className="border-t pt-2">
                          <p className="text-xs font-medium mb-2">Quote Line Items (will be copied to job):</p>
                          <div className="space-y-1">
                            {selectedQuote.items.map((item, idx) => (
                              <div key={item?.id || idx} className="flex justify-between text-xs bg-background p-2 rounded">
                                <span className="font-medium">{item?.description || "N/A"}</span>
                                <span className="text-muted-foreground">
                                  {item?.quantity || "0"} × {formatCurrency(parseFloat(item?.unitPrice || "0"))} = {formatCurrency(parseFloat(item?.lineTotal || "0"))}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {selectedQuote.notes && (
                        <div className="border-t pt-2">
                          <p className="text-xs font-medium mb-1">Quote Notes:</p>
                          <p className="text-xs text-muted-foreground whitespace-pre-wrap">{selectedQuote.notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Job Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Fix Kitchen Sink Leak"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="serviceType">Service Type</Label>
              <Select value={serviceType || "regular"} onValueChange={setServiceType}>
                <SelectTrigger id="serviceType">
                  <SelectValue placeholder="Select service type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="regular">Regular</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                  <SelectItem value="installation">Installation</SelectItem>
                  <SelectItem value="repair">Repair</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="inspection">Inspection</SelectItem>
                  <SelectItem value="consultation">Consultation</SelectItem>
                  <SelectItem value="quote_visit">Quote Visit</SelectItem>
                  <SelectItem value="follow_up">Follow-up</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                <SelectTrigger id="priority">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed description of the work to be done"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Scheduling</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {user?.businessId ? (
            <JobCalendarBooking
              businessId={user.businessId}
              selectedDate={scheduledDate}
              selectedStartTime={startTime}
              onDateTimeSelect={(date, start, end) => {
                setScheduledDate(date);
                setStartTime(start);
                setEndTime(end);
              }}
            />
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="scheduledDate">Scheduled Date *</Label>
                  <Input
                    id="scheduledDate"
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time *</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="estimatedDuration">Estimated Duration</Label>
                  <Select value={estimatedDuration} onValueChange={setEstimatedDuration}>
                    <SelectTrigger id="estimatedDuration">
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30min">30 minutes</SelectItem>
                      <SelectItem value="1hr">1 hour</SelectItem>
                      <SelectItem value="2hr">2 hours</SelectItem>
                      <SelectItem value="4hr">4 hours</SelectItem>
                      <SelectItem value="fullday">Full Day</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time (Optional)</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Line Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {lineItems.map((item, index) => (
              <div key={index} className="grid gap-2 md:grid-cols-[2fr_1fr_1fr_1fr_auto] items-end">
                <div>
                  <Label>Description</Label>
                  <Input
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => {
                      const updated = [...lineItems];
                      updated[index].description = e.target.value;
                      setLineItems(updated);
                    }}
                  />
                </div>
                <div>
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => {
                      const updated = [...lineItems];
                      updated[index].quantity = e.target.value;
                      const qty = parseFloat(e.target.value) || 0;
                      const price = parseFloat(updated[index].unitPrice) || 0;
                      updated[index].lineTotal = (qty * price).toFixed(2);
                      setLineItems(updated);
                    }}
                  />
                </div>
                <div>
                  <Label>Unit Price (R)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice === "0" ? "" : item.unitPrice}
                    onChange={(e) => {
                      const updated = [...lineItems];
                      updated[index].unitPrice = e.target.value || "0";
                      const qty = parseFloat(updated[index].quantity) || 0;
                      const price = parseFloat(e.target.value) || 0;
                      updated[index].lineTotal = (qty * price).toFixed(2);
                      setLineItems(updated);
                    }}
                    onFocus={(e) => e.target.select()}
                  />
                </div>
                <div>
                  <Label>Amount</Label>
                  <Input value={`R ${parseFloat(item.lineTotal).toFixed(2)}`} disabled />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setLineItems(lineItems.filter((_, i) => i !== index));
                  }}
                  disabled={lineItems.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setLineItems([...lineItems, {
                description: "",
                quantity: "1",
                unitPrice: "0",
                lineTotal: "0",
              }]);
            }}
          >
            Add Line Item
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Location & Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <AddressAutocomplete
            value={locationAddress || ""}
            onAddressSelect={(address: AddressData) => {
              setLocationAddress(address.fullAddress);
            }}
            label="Location Address"
            placeholder="Start typing the job location..."
          />
          <div className="space-y-2">
            <Label htmlFor="internalNotes">Internal Notes</Label>
            <Textarea
              id="internalNotes"
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="Notes not visible to customer"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => setLocation("/dashboard/jobs")}>
          Cancel
        </Button>
        <Button variant="outline" onClick={() => handleSave("draft")}>
          Save as Draft
        </Button>
        <Button onClick={() => handleSave("scheduled")} style={{ backgroundColor: 'hsl(var(--brand))', borderColor: 'hsl(var(--brand))' }}>
          Schedule Job
        </Button>
      </div>
    </div>
  );
}
