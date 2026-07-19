
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { AddressAutocomplete, type AddressData } from "@/components/ui/address-autocomplete";

type Contact = {
  id: string;
  fullName: string;
  email: string | null;
};

type Job = {
  id: string;
  jobNumber: string;
  title: string;
  description?: string | null;
  locationAddress?: string | null;
  contactId: string;
  items?: JobItem[];
};

type JobItem = {
  id: string;
  description: string;
  quantity: string;
  unitPrice: string;
  lineTotal: string;
};

type LineItem = {
  id: string;
  description: string;
  quantity: string;
  unitPrice: string;
  lineTotal: string;
};

export default function NewInvoicePage() {
  const pageStyle = { fontFamily: 'var(--font-sans)' };
  const [location, setLocation] = useLocation();
  const invoiceId = location.split('/').pop() !== 'new' ? location.split('/')[3] : undefined;
  const isEdit = !!invoiceId;
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const urlParams = new URLSearchParams(window.location.search);
  const urlContactId = urlParams.get('contactId');

  const [contactId, setContactId] = useState(urlContactId || "");
  const [jobId, setJobId] = useState("");
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [notes, setNotes] = useState("");
  const [locationAddress, setLocationAddress] = useState("");
  const [taxRate, setTaxRate] = useState("15");
  const [items, setItems] = useState<LineItem[]>([
    { id: crypto.randomUUID(), description: "", quantity: "1", unitPrice: "0", lineTotal: "0" }
  ]);

  const { data: existingInvoice } = useQuery({
    queryKey: ["/api/invoices", invoiceId],
    queryFn: async () => {
      if (!invoiceId) return null;
      const res = await fetch(`/api/invoices/${invoiceId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch invoice");
      return res.json();
    },
    enabled: isEdit,
  });

  useEffect(() => {
    if (existingInvoice && isEdit) {
      setContactId(existingInvoice.contactId);
      setJobId(existingInvoice.jobId || "");
      setTitle(existingInvoice.title || "");
      setDueDate(existingInvoice.dueDate || "");
      setPaymentMethod(existingInvoice.paymentMethod || "bank_transfer");
      setNotes(existingInvoice.notes || "");
      setLocationAddress(existingInvoice.locationAddress || "");
      
      const subtotal = parseFloat(existingInvoice.subtotal || "0");
      const tax = parseFloat(existingInvoice.taxAmount || "0");
      if (subtotal > 0 && tax > 0) {
        const rate = ((tax / subtotal) * 100).toFixed(2);
        setTaxRate(rate);
      }
      
      if (existingInvoice.items && existingInvoice.items.length > 0) {
        setItems(existingInvoice.items.map((item: any) => ({
          id: crypto.randomUUID(),
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal: item.lineTotal,
        })));
      }
    }
  }, [existingInvoice, isEdit]);

  const { data: contacts = [] } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
  });

  const { data: allJobs = [] } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });

  const jobs = contactId 
    ? allJobs.filter(job => job.contactId === contactId)
    : allJobs;

  const { data: selectedJob } = useQuery<Job>({
    queryKey: ["/api/jobs", jobId],
    queryFn: async () => {
      if (!jobId) return null;
      const res = await fetch(`/api/jobs/${jobId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch job");
      return res.json();
    },
    enabled: !!jobId,
  });

  useEffect(() => {
    if (selectedJob) {
      if (selectedJob.items && selectedJob.items.length > 0) {
        setItems(selectedJob.items.map(item => ({
          id: crypto.randomUUID(),
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal: item.lineTotal,
        })));
      }
      if (selectedJob.locationAddress && !locationAddress) {
        setLocationAddress(selectedJob.locationAddress);
      }
      if (selectedJob.title && !title) {
        setTitle(selectedJob.title);
      }
      if (selectedJob.description && !notes) {
        setNotes(selectedJob.description);
      }
    }
  }, [selectedJob, locationAddress, title, notes]);

  useEffect(() => {
    if (selectedJob && selectedJob.contactId) {
      setContactId(selectedJob.contactId);
    }
  }, [selectedJob]);

  const subtotal = items.reduce((sum, item) => sum + parseFloat(item.lineTotal || "0"), 0);
  const taxAmount = subtotal * (parseFloat(taxRate) / 100);
  const totalAmount = subtotal + taxAmount;

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const url = isEdit ? `/api/invoices/${invoiceId}` : "/api/invoices";
      const method = isEdit ? "PATCH" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({ title: isEdit ? "Invoice updated successfully" : "Invoice created successfully" });
      setLocation("/dashboard/invoices");
    },
    onError: (error: Error) => {
      toast({ 
        title: isEdit ? "Error updating invoice" : "Error creating invoice", 
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const handleAddItem = () => {
    setItems([...items, { 
      id: crypto.randomUUID(), 
      description: "", 
      quantity: "1", 
      unitPrice: "0", 
      lineTotal: "0" 
    }]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const handleItemChange = (id: string, field: keyof LineItem, value: string) => {
    setItems(items.map(item => {
      if (item.id !== id) return item;
      
      const updated = { ...item, [field]: value };
      
      if (field === "quantity" || field === "unitPrice") {
        const qty = parseFloat(field === "quantity" ? value : updated.quantity) || 0;
        const price = parseFloat(field === "unitPrice" ? value : updated.unitPrice) || 0;
        updated.lineTotal = (qty * price).toFixed(2);
      }
      
      return updated;
    }));
  };

  const handleSubmit = (status: "draft" | "sent") => {
    if (!contactId) {
      toast({ title: "Please select a customer", variant: "destructive" });
      return;
    }

    const hasValidItems = items.some(item => item.description.trim() !== "");
    if (!hasValidItems) {
      toast({ title: "Please add at least one line item with a description", variant: "destructive" });
      return;
    }

    const validItems = items.filter(item => item.description.trim() !== "");

    const payload = {
      contactId,
      jobId: jobId || undefined,
      title: title || undefined,
      dueDate: dueDate || undefined,
      paymentMethod,
      subtotal: subtotal.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      totalAmount: totalAmount.toFixed(2),
      notes,
      locationAddress: locationAddress || undefined,
      status,
      items: validItems.map(({ id, ...item }) => item),
    };

    createMutation.mutate(payload);
  };

  return (
    <div className="space-y-6" style={pageStyle}>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/dashboard/invoices")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">{isEdit ? "Edit Invoice" : "Create Invoice"}</h1>
      </div>

      {/* Invoice Details */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="customer">Customer *</Label>
              <Select value={contactId} onValueChange={setContactId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {contacts.map(contact => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="job">Linked Job (Optional)</Label>
              <Select value={jobId} onValueChange={setJobId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select job (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {jobs.map(job => (
                    <SelectItem key={job.id} value={job.id}>
                      {job.jobNumber} - {job.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title (Optional)</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Kitchen Renovation Invoice"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
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
                  <Input
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => handleItemChange(item.id, "description", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(item.id, "quantity", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Unit Price (R)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Unit Price"
                    value={item.unitPrice === "0" ? "" : item.unitPrice}
                    onChange={(e) => handleItemChange(item.id, "unitPrice", e.target.value || "0")}
                    onFocus={(e) => e.target.select()}
                  />
                </div>
                <div>
                  <Label>Amount</Label>
                  <Input
                    value={`R ${parseFloat(item.lineTotal).toFixed(2)}`}
                    disabled
                  />
                </div>
                {items.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          <Button variant="outline" onClick={handleAddItem}>
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </CardContent>
      </Card>

      {/* Location */}
      <Card>
        <CardHeader>
          <CardTitle>Location</CardTitle>
        </CardHeader>
        <CardContent>
          <AddressAutocomplete
            value={locationAddress || ""}
            onAddressSelect={(address: AddressData) => {
              setLocationAddress(address.fullAddress);
            }}
            label="Service Address (Optional)"
            placeholder="Start typing the service address..."
          />
        </CardContent>
      </Card>

      {/* Totals */}
      <Card>
        <CardHeader>
          <CardTitle>Totals</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tax">Tax/VAT (%)</Label>
              <Input
                id="tax"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value || "0")}
                onFocus={(e) => e.target.select()}
              />
            </div>
          </div>
          <div className="space-y-2 text-right">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal:</span>
              <span>R {subtotal.toFixed(2)}</span>
            </div>
            {parseFloat(taxRate) > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax ({taxRate}%):</span>
                <span>R {taxAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-xl font-bold border-t pt-2">
              <span>Total:</span>
              <span>R {totalAmount.toFixed(2)}</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Payment terms, thank you message, etc."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => setLocation("/dashboard/invoices")}
        >
          Cancel
        </Button>
        <Button
          variant="outline"
          onClick={() => handleSubmit("draft")}
          disabled={createMutation.isPending}
        >
          Save as Draft
        </Button>
        <Button
          onClick={() => handleSubmit("sent")}
          disabled={createMutation.isPending}
          style={{ backgroundColor: 'hsl(var(--brand))', borderColor: 'hsl(var(--brand))' }}
        >
          {createMutation.isPending ? "Creating..." : "Create & Send"}
        </Button>
      </div>
    </div>
  );
}
