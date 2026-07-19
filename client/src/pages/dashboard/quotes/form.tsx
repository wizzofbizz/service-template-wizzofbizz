import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { formatDateSA } from "@/lib/date-utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ContactDialog } from "@/components/contacts/ContactDialog";
import { AddressAutocomplete, type AddressData } from "@/components/ui/address-autocomplete";
import { PhotoGallery } from "@/components/PhotoGallery";

interface Contact {
  id: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
}

interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

// Helper function to format currency
const formatCurrency = (amount: number): string => {
  return `R ${amount.toFixed(2)}`;
};

export default function QuoteFormPage() {
  const pageStyle = { fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif' };
  const [, setLocation] = useLocation();
  const [matchEdit, paramsEdit] = useRoute("/dashboard/quotes/:id/edit");
  const [matchView, paramsView] = useRoute("/dashboard/quotes/:id/view");
  const [matchNew] = useRoute("/dashboard/quotes/new");

  const isEdit = matchEdit && !!paramsEdit?.id;
  const isView = matchView && !!paramsView?.id;
  const isNew = matchNew;
  const quoteId = paramsEdit?.id || paramsView?.id || null;

  console.log("Route detection:", { isEdit, isView, isNew, quoteId, matchEdit, matchView, matchNew });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [hasLoadedQuote, setHasLoadedQuote] = useState(false);
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [photos, setPhotos] = useState<any[]>([]);

  // Check for contactId in URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const urlContactId = urlParams.get('contactId');

  const [contactId, setContactId] = useState(urlContactId || "");
  const [contactSearch, setContactSearch] = useState("");
  const [title, setTitle] = useState("");
  const [validUntil, setValidUntil] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [locationAddress, setLocationAddress] = useState("");
  const [serviceLocationType, setServiceLocationType] = useState<"customer" | "business">("customer");
  const [items, setItems] = useState<QuoteItem[]>([
    { id: crypto.randomUUID(), description: "", quantity: 1, unitPrice: 0, amount: 0 },
  ]);
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);

  // Deposit settings (Phase 2)
  const [requiresDeposit, setRequiresDeposit] = useState(false);
  const [depositType, setDepositType] = useState<"percentage" | "fixed">("percentage");
  const [depositPercentage, setDepositPercentage] = useState(30);
  const [depositAmount, setDepositAmount] = useState(0);

  const { data: existingQuote, isLoading: isLoadingQuote } = useQuery({
    queryKey: ["/api/quotes", quoteId],
    queryFn: async () => {
      if (!quoteId) return null;
      const res = await fetch(`/api/quotes/${quoteId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch quote");
      return res.json();
    },
    enabled: !!quoteId,
  });

  // Fetch attachments/photos for this quote
  const { data: attachments = [] } = useQuery({
    queryKey: ["/api/attachments/quote", quoteId],
    queryFn: async () => {
      if (!quoteId) return [];
      const res = await fetch(`/api/attachments?relatedType=quote&relatedId=${quoteId}`, { 
        credentials: "include" 
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!quoteId,
  });

  // Fetch business settings to get VAT rate
  const { data: businessSettings } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch business settings");
      return res.json();
    },
  });

  // Set VAT from business settings for new quotes
  useEffect(() => {
    // Only set VAT from business settings if:
    // 1. We have business settings with a VAT rate
    // 2. We're creating a new quote (not editing an existing one)
    // 3. The existing quote hasn't loaded yet
    if (businessSettings?.business?.vatRate && !existingQuote && !isLoadingQuote && !hasLoadedQuote) {
      setTax(parseFloat(businessSettings.business.vatRate));
    }
  }, [businessSettings, existingQuote, isLoadingQuote, hasLoadedQuote]);

  const { data: services = [] } = useQuery({
    queryKey: ["/api/services"],
    queryFn: async () => {
      const res = await fetch("/api/services", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch services");
      return res.json();
    },
  });

  const { data: contacts = [] } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
    queryFn: async () => {
      const res = await fetch("/api/contacts", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch contacts");
      return res.json();
    },
  });

  // Auto-populate address when contact is selected
  useEffect(() => {
    const selectedContact = contacts.find(c => c.id === contactId);
    if (selectedContact && selectedContact.address && !locationAddress && !existingQuote) {
      setLocationAddress(selectedContact.address);
    }
  }, [contactId, contacts, locationAddress, existingQuote]);

  // Update photos when attachments load
  useEffect(() => {
    if (attachments && attachments.length > 0) {
      const photoAttachments = attachments.filter((att: any) => 
        att.mimeType?.startsWith('image/')
      );
      setPhotos(photoAttachments);
    }
  }, [attachments]);

  // Load existing quote data
  useEffect(() => {
    if (existingQuote && !isLoadingQuote && !hasLoadedQuote) {
      setContactId(existingQuote.contactId || "");
      setTitle(existingQuote.title || "");
      setValidUntil(existingQuote.validUntil?.split("T")[0] || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
      setIssueDate(existingQuote.createdAt?.split("T")[0] || new Date().toISOString().split("T")[0]);
      setNotes(existingQuote.notes || "");
      setLocationAddress(existingQuote.locationAddress || "");

      // Load deposit settings
      setRequiresDeposit(existingQuote.requiresDeposit || false);
      if (existingQuote.depositPercentage) {
        setDepositType("percentage");
        setDepositPercentage(parseFloat(existingQuote.depositPercentage));
      } else if (existingQuote.depositAmount) {
        setDepositType("fixed");
        setDepositAmount(parseFloat(existingQuote.depositAmount));
      }

      if (existingQuote.items && existingQuote.items.length > 0) {
        setItems(existingQuote.items.map((item: any) => ({
          id: item.id || crypto.randomUUID(),
          description: item.description,
          quantity: parseFloat(item.quantity),
          unitPrice: parseFloat(item.unitPrice),
          amount: parseFloat(item.lineTotal),
        })));

        const subtotalFromItems = existingQuote.items.reduce(
          (sum: number, item: any) => sum + parseFloat(item.lineTotal),
          0
        );
        const discountAmt = parseFloat(existingQuote.discountAmount || "0");
        const taxAmt = parseFloat(existingQuote.taxAmount || "0");

        if (subtotalFromItems > 0) {
          const discountPct = (discountAmt / subtotalFromItems) * 100;
          const taxPct = (taxAmt / (subtotalFromItems - discountAmt)) * 100;
          setDiscount(discountPct);
          setTax(taxPct);
        }
      }

      setHasLoadedQuote(true);
    }
  }, [existingQuote, isLoadingQuote, hasLoadedQuote]);

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

  const addItem = () => {
    setItems([
      ...items,
      { id: crypto.randomUUID(), description: "", quantity: 1, unitPrice: 0, amount: 0 },
    ]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const updateItem = (id: string, field: keyof QuoteItem, value: string | number) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === "quantity" || field === "unitPrice") {
            updated.amount = updated.quantity * updated.unitPrice;
          }
          return updated;
        }
        return item;
      })
    );
  };

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const discountAmount = subtotal * (discount / 100);
  const taxAmount = (subtotal - discountAmount) * (tax / 100);
  const total = subtotal - discountAmount + taxAmount;

  // Calculate deposit amount
  const calculatedDepositAmount = requiresDeposit 
    ? (depositType === "percentage" 
        ? total * (depositPercentage / 100) 
        : depositAmount)
    : 0;

  const shouldBeReadOnly = isView || (!['draft', 'ai_quote', 'sent', 'viewed'].includes(existingQuote?.status || '') && !isNew);

  const saveMutation = useMutation({
    mutationFn: async (status: "draft" | "sent") => {
      // Comprehensive validation
      if (!contactId || contactId.trim() === "") {
        throw new Error("Please select a customer before saving the quote");
      }

      // Verify the contact still exists in the contacts list
      const selectedContact = contacts.find(c => c.id === contactId);
      if (!selectedContact) {
        throw new Error("Selected customer not found. Please refresh the page and select a customer again.");
      }

      if (items.length === 0 || items.every(item => !item.description || item.description.trim() === "")) {
        throw new Error("Please add at least one line item with a description");
      }

      // Filter out empty items
      const validItems = items.filter(item => item.description && item.description.trim() !== "");

      if (validItems.some(item => item.unitPrice === 0)) {
        throw new Error("Please enter a unit price greater than 0 for all line items");
      }

      if (!validUntil || validUntil === "") {
        throw new Error("Please select a valid until date");
      }

      const payload = {
        contactId: contactId.trim(), // Ensure no whitespace
        title: title.trim() || undefined,
        validUntil,
        subtotal: subtotal.toString(),
        taxAmount: taxAmount.toString(),
        discountAmount: discountAmount.toString(),
        totalAmount: total.toString(),
        notes,
        locationAddress: locationAddress || undefined,
        status,
        requiresDeposit,
        depositPercentage: requiresDeposit && depositType === "percentage" ? depositPercentage.toString() : undefined,
        depositAmount: requiresDeposit && depositType === "fixed" ? depositAmount.toString() : calculatedDepositAmount.toString(),
        items: validItems.map((item) => ({
          description: item.description.trim(),
          quantity: item.quantity.toString(),
          unitPrice: item.unitPrice.toString(),
          lineTotal: item.amount.toString(),
        })),
      };

      // Debug logging (remove after testing)
      console.log("Submitting quote with payload:", {
        contactId: payload.contactId,
        contactExists: !!selectedContact,
        contactName: selectedContact?.fullName,
        itemCount: validItems.length,
        status
      });

      const url = isEdit ? `/api/quotes/${quoteId}` : "/api/quotes";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Unknown error occurred" }));
        console.error("Quote save error:", errorData);

        // Provide user-friendly error messages
        if (errorData.message?.includes("duplicate key")) {
          throw new Error("A quote with this number already exists. Please try again.");
        }
        if (errorData.message?.includes("customer") || errorData.message?.includes("contact")) {
          throw new Error("Invalid customer selected. Please select a valid customer from the list.");
        }
        if (errorData.message?.includes("line item")) {
          throw new Error("Please ensure all line items have valid descriptions and prices.");
        }
        if (errorData.message?.includes("Validation")) {
          throw new Error(errorData.message);
        }
        throw new Error(errorData.message || "Failed to save quote. Please check all required fields and try again.");
      }
      return res.json();
    },
    onSuccess: async (data, variables) => {
      // Invalidate both the quotes list AND the specific quote
      await queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      if (quoteId) {
        await queryClient.invalidateQueries({ queryKey: ["/api/quotes", quoteId] });
      }

      toast({
        title: "Success",
        description: `Quote ${isEdit ? "updated" : "created"} successfully`,
      });

      // Always redirect to quotes list
      setLocation("/dashboard/quotes");
    },
    onError: (error: Error) => {
      console.error("Quote mutation error:", error);
      toast({
        title: "Failed to Save Quote",
        description: error.message || "An unexpected error occurred. Please check all fields and try again.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6" style={pageStyle}>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/dashboard/quotes")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {isView ? "View Quote" : isEdit ? "Edit Quote" : "Create Quote"}
          </h1>
        </div>
      </div>

      {!isView && (
        <Card>
          <CardHeader>
            <CardTitle>Quote Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contact">Customer *</Label>
              <div className="space-y-2">
                <Input
                  placeholder="Search by name, email, or phone..."
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                  disabled={shouldBeReadOnly}
                />
                <Select value={contactId} onValueChange={setContactId} disabled={shouldBeReadOnly}>
                  <SelectTrigger id="contact">
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
                    <div className="px-2 py-2 border-t mt-1">
                      <Button
                        type="button"
                        variant="ghost"
                        className="w-full justify-start text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={(e) => {
                          e.preventDefault();
                          setIsContactDialogOpen(true);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create new client
                      </Button>
                    </div>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Title (Optional)</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Kitchen Renovation"
                disabled={shouldBeReadOnly}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="issueDate">Issue Date</Label>
              <Input
                id="issueDate"
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                disabled={shouldBeReadOnly}
              />
              <p className="text-xs text-muted-foreground">
                {issueDate && formatDateSA(issueDate)}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="validUntil">Valid Until</Label>
              <Input
                id="validUntil"
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                disabled={shouldBeReadOnly}
              />
              <p className="text-xs text-muted-foreground">
                {validUntil && formatDateSA(validUntil)}
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center space-x-2 p-4 bg-muted rounded-lg">
              <Checkbox
                id="businessLocationQuote"
                checked={serviceLocationType === "business"}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setServiceLocationType("business");
                    setLocationAddress(""); // Clear address when switching to business location
                  } else {
                    setServiceLocationType("customer");
                  }
                }}
                disabled={shouldBeReadOnly}
              />
              <label htmlFor="businessLocationQuote" className="text-sm font-medium cursor-pointer">
                Service at business location (no travel charge)
              </label>
            </div>

            {serviceLocationType === "customer" ? (
              <AddressAutocomplete
                value={locationAddress || ""}
                onAddressSelect={(address: AddressData) => {
                  setLocationAddress(address.fullAddress);
                }}
                label="Service Address"
                placeholder="Start typing the service address..."
                disabled={shouldBeReadOnly}
              />
            ) : (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  ✓ Service will be performed at the business location. No travel charges will apply.
                </p>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes for Customer</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes..."
              rows={3}
              disabled={shouldBeReadOnly}
            />
          </div>
        </CardContent>
      </Card>
      )}

      {!isView && (
        <Card>
          <CardHeader>
            <CardTitle>Line Items</CardTitle>
          </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="grid gap-2 md:grid-cols-[2fr_1fr_1fr_1fr_auto] items-end">
                <div>
                  <Label>Description</Label>
                  <div className="space-y-1">
                    <Select 
                      value={item.description}
                      onValueChange={(value) => {
                        updateItem(item.id, "description", value);
                      }}
                      disabled={shouldBeReadOnly}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select service or enter custom below" />
                      </SelectTrigger>
                      <SelectContent>
                        {services?.map((service: any) => (
                          <SelectItem key={service.id} value={service.serviceName}>
                            {service.serviceName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Or type custom description"
                      value={item.description}
                      onChange={(e) => updateItem(item.id, "description", e.target.value)}
                      disabled={shouldBeReadOnly}
                    />
                  </div>
                </div>
                <div>
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, "quantity", parseInt(e.target.value) || 0)}
                    disabled={shouldBeReadOnly}
                  />
                </div>
                <div>
                  <Label>Unit Price (R)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice === 0 ? "" : item.unitPrice}
                    onChange={(e) => {
                      const val = e.target.value;
                      updateItem(item.id, "unitPrice", val === "" ? 0 : parseFloat(val));
                    }}
                    onFocus={(e) => e.target.select()}
                    disabled={shouldBeReadOnly}
                  />
                </div>
                <div>
                  <Label>Amount</Label>
                  <Input value={`R ${item.amount.toFixed(2)}`} disabled />
                </div>
                {!shouldBeReadOnly && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(item.id)}
                    disabled={items.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          {!shouldBeReadOnly && (
            <Button variant="outline" onClick={addItem}>
              <Plus className="h-4 w-4 mr-2" />
              Add Line Item
            </Button>
          )}
        </CardContent>
      </Card>
      )}

      {!isView && (
        <Card>
          <CardHeader>
            <CardTitle>Totals</CardTitle>
          </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="discount">Discount (%)</Label>
              <Input
                id="discount"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={discount}
                onChange={(e) => {
                  const val = e.target.value;
                  setDiscount(val === "" ? 0 : parseFloat(val));
                }}
                onFocus={(e) => e.target.select()}
                disabled={shouldBeReadOnly}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tax">Tax/VAT (%)</Label>
              <Input
                id="tax"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={tax}
                onChange={(e) => {
                  const val = e.target.value;
                  setTax(val === "" ? 0 : parseFloat(val));
                }}
                onFocus={(e) => e.target.select()}
                disabled={shouldBeReadOnly}
              />
            </div>
          </div>
          <div className="space-y-2 text-right">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal:</span>
              <span>R {subtotal.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discount ({discount}%):</span>
                <span className="text-red-600">- R {discountAmount.toFixed(2)}</span>
              </div>
            )}
            {tax > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax ({tax}%):</span>
                <span>R {taxAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-xl font-bold border-t pt-2">
              <span>Total:</span>
              <span>R {total.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
      )}

      {!isView && (
        <Card>
          <CardHeader>
            <CardTitle>Deposit Settings</CardTitle>
            <CardDescription>
              Require customers to pay a deposit before booking their appointment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="requiresDeposit"
                checked={requiresDeposit}
                onCheckedChange={(checked) => setRequiresDeposit(checked as boolean)}
                disabled={shouldBeReadOnly}
              />
              <label htmlFor="requiresDeposit" className="text-sm font-medium cursor-pointer">
                Require deposit before booking
              </label>
            </div>

            {requiresDeposit && (
              <>
                <div className="space-y-2">
                  <Label>Deposit Type</Label>
                  <Select value={depositType} onValueChange={(value: "percentage" | "fixed") => setDepositType(value)} disabled={shouldBeReadOnly}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage of Total</SelectItem>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {depositType === "percentage" ? (
                  <div className="space-y-2">
                    <Label htmlFor="depositPercentage">Deposit Percentage (%)</Label>
                    <Input
                      id="depositPercentage"
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={depositPercentage}
                      onChange={(e) => setDepositPercentage(parseFloat(e.target.value) || 0)}
                      disabled={shouldBeReadOnly}
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="depositAmount">Deposit Amount (R)</Label>
                    <Input
                      id="depositAmount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(parseFloat(e.target.value) || 0)}
                      disabled={shouldBeReadOnly}
                    />
                  </div>
                )}

                {/* Payment Preview */}
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg space-y-2">
                  <p className="text-sm font-semibold text-blue-900">💳 Payment Preview</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-blue-700 font-medium">Deposit Required:</p>
                      <p className="text-blue-900 text-lg font-bold">R {calculatedDepositAmount.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-blue-700 font-medium">Balance on Completion:</p>
                      <p className="text-blue-900 text-lg font-bold">R {(total - calculatedDepositAmount).toFixed(2)}</p>
                    </div>
                  </div>
                  <p className="text-xs text-blue-600 pt-2 border-t border-blue-200">
                    Customer must pay deposit before booking appointment
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {isView ? (
        <Card id="quote-preview-content" className="print:shadow-none print:border-0">
          <CardHeader className="print:pb-8">
            <div className="flex justify-between items-center print:hidden">
              <div>
                <CardTitle className="text-2xl">Quote Preview</CardTitle>
                <p className="text-muted-foreground mt-1">
                  Quote #{existingQuote?.quoteNumber}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setLocation("/dashboard/quotes")}>
                  Back to Quotes
                </Button>
                <Button onClick={async () => {
                  try {
                    const element = document.getElementById('quote-preview-content');
                    if (!element) {
                      toast({ 
                        title: "Error", 
                        description: "Quote preview not found",
                        variant: "destructive"
                      });
                      return;
                    }

                    // Show loading toast
                    toast({ 
                      title: "Generating PDF", 
                      description: "Please wait..." 
                    });

                    // Clone the element to avoid modifying the original
                    const clonedElement = element.cloneNode(true) as HTMLElement;

                    // Remove print:hidden elements from clone
                    const printHiddenElements = clonedElement.querySelectorAll('.print\\:hidden');
                    printHiddenElements.forEach(el => el.remove());

                    // Temporarily add clone to DOM (needed for html2canvas)
                    clonedElement.style.position = 'absolute';
                    clonedElement.style.left = '-9999px';
                    clonedElement.style.top = '0';
                    document.body.appendChild(clonedElement);

                    // Wait a moment for layout to settle
                    await new Promise(resolve => setTimeout(resolve, 100));

                    const canvas = await html2canvas(clonedElement, {
                      scale: 2,
                      useCORS: true,
                      logging: false,
                      allowTaint: true,
                      backgroundColor: '#ffffff',
                      ignoreElements: (element) => {
                        // Ignore elements that might have problematic styles
                        return false;
                      },
                    });

                    // Remove cloned element from DOM
                    document.body.removeChild(clonedElement);

                    const imgData = canvas.toDataURL('image/png');
                    const pdf = new jsPDF({
                      orientation: 'portrait',
                      unit: 'mm',
                      format: 'a4',
                    });

                    const imgWidth = 210; // A4 width in mm
                    const pageHeight = 297; // A4 height in mm
                    const imgHeight = (canvas.height * imgWidth) / canvas.width;
                    let heightLeft = imgHeight;
                    let position = 0;

                    // Add first page
                    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                    heightLeft -= pageHeight;

                    // Add additional pages if content is longer than one page
                    while (heightLeft > 0) {
                      position = heightLeft - imgHeight;
                      pdf.addPage();
                      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                      heightLeft -= pageHeight;
                    }

                    // Open PDF in new tab instead of downloading
                    const pdfBlob = pdf.output('blob');
                    const pdfUrl = URL.createObjectURL(pdfBlob);
                    window.open(pdfUrl, '_blank');

                    toast({ 
                      title: "Success", 
                      description: "PDF opened in new tab" 
                    });
                  } catch (error) {
                    console.error('PDF generation error:', error);
                    toast({ 
                      title: "Error", 
                      description: `Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`,
                      variant: "destructive"
                    });
                  }
                }}>
                  View PDF
                </Button>
              </div>
            </div>
            {/* Print-only header */}
            <div className="hidden print:block text-center mb-6">
              <h1 className="text-3xl font-bold mb-2">QUOTATION</h1>
              <p className="text-lg text-muted-foreground">Quote #{existingQuote?.quoteNumber}</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Customer Info */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-lg mb-2">Bill To:</h3>
                <div className="text-sm space-y-1">
                  <p className="font-medium">{contacts.find(c => c.id === contactId)?.fullName}</p>
                  <p>{contacts.find(c => c.id === contactId)?.email}</p>
                  <p>{contacts.find(c => c.id === contactId)?.phone}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm space-y-1">
                  <p><span className="font-semibold">Issue Date:</span> {new Date(issueDate).toLocaleDateString()}</p>
                  <p><span className="font-semibold">Valid Until:</span> {new Date(validUntil).toLocaleDateString()}</p>
                  <p><span className="font-semibold">Status:</span> <Badge className="ml-2">{existingQuote?.status}</Badge></p>
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div>
              <h3 className="font-semibold text-lg mb-3">Items</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <tbody>
                {items.map((item, index) => {
                  const isLabor = item.description.includes('- Labor');
                  const isMaterial = item.description.includes('Materials & Supplies') || 
                                    (!isLabor && index > 0);

                  return (
                    <tr key={item.id} className={`border-b border-gray-200 ${isMaterial ? 'bg-blue-50/30' : ''}`}>
                      <td className={`py-3 ${isLabor ? 'font-semibold' : ''} text-gray-900`}>
                        {item.description}
                        {isMaterial && item.description === 'Materials & Supplies' && (
                          <div className="text-xs text-gray-600 mt-1">
                            Bundled materials and supplies
                          </div>
                        )}
                      </td>
                      <td className="py-3 text-right text-gray-700">{parseFloat(item.quantity).toFixed(2)}</td>
                      <td className="py-3 text-right text-gray-700">{formatCurrency(parseFloat(item.unitPrice))}</td>
                      <td className="py-3 text-right font-medium text-gray-900">{formatCurrency(parseFloat(item.amount))}</td>
                    </tr>
                  );
                })}
              </tbody>
              </Table>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-full md:w-1/2 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-medium">R {subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Discount ({discount}%):</span>
                    <span className="text-red-600 font-medium">- R {discountAmount.toFixed(2)}</span>
                  </div>
                )}
                {tax > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax ({tax}%):</span>
                    <span className="font-medium">R {taxAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-bold border-t pt-2 mt-2">
                  <span>Total:</span>
                  <span>R {total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Service Address */}
            {locationAddress && (
              <div>
                <h3 className="font-semibold text-lg mb-2">Service Address</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{locationAddress}</p>
              </div>
            )}

            {/* Notes */}
            {notes && (
              <div>
                <h3 className="font-semibold text-lg mb-2">Notes</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{notes}</p>
              </div>
            )}

            {/* Photos */}
            {photos.length > 0 && (
              <div>
                <PhotoGallery photos={photos} title="Attached Photos" />
              </div>
            )}

            {/* Footer message */}
            <div className="border-t pt-4 mt-6">
              <p className="text-sm text-muted-foreground text-center">
                This quote has been {existingQuote?.status}. It cannot be edited directly.
                You can duplicate it to create a new quote.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setLocation("/dashboard/quotes")}>
            Cancel
          </Button>
          <Button variant="outline" onClick={() => saveMutation.mutate("draft")}>
            Save as Draft
          </Button>
          <Button onClick={() => saveMutation.mutate("sent")} style={{ backgroundColor: '#612fff', borderColor: '#612fff' }}>
            Save & Send
          </Button>
        </div>
      )}

      {/* Contact Dialog */}
      <ContactDialog
        open={isContactDialogOpen}
        onOpenChange={setIsContactDialogOpen}
        contact={null}
        onContactCreated={(newContact) => {
          // Auto-select the newly created contact
          setContactId(newContact.id);
          setContactSearch("");
        }}
      />
    </div>
  );
}