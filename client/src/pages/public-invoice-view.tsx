
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Building2, Mail, Phone, MapPin, Calendar, FileText, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface InvoiceData {
  invoice: {
    id: string;
    invoiceNumber: string;
    title?: string;
    status: string;
    dueDate: string;
    paidAt: string | null;
    subtotal: string;
    taxAmount: string;
    totalAmount: string;
    notes: string;
    createdAt: string;
    invoiceType?: string;
    depositAmount?: string;
    balanceDue?: string;
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
    slug: string;
  };
  contact: {
    fullName: string;
    email: string;
    phone?: string;
  };
}

export default function PublicInvoiceView() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Online payment is optional, so the button only appears when the business
  // has switched it on and the server can actually reach PayFast.
  const [paymentsEnabled, setPaymentsEnabled] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState("");

  useEffect(() => {
    fetch("/api/public/payments/status")
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => setPaymentsEnabled(Boolean(s?.enabled && s?.acceptInvoicePayments)))
      .catch(() => setPaymentsEnabled(false));
  }, []);

  /**
   * Asks the server for a signed PayFast form, then POSTs it.
   * The amount and signature are built server-side from the stored invoice —
   * nothing about the payment is decided by this page.
   */
  const handlePayNow = async () => {
    setPayLoading(true);
    setPayError("");

    try {
      const params = new URLSearchParams(window.location.search);
      const pathParts = window.location.pathname.split('/');
      const invoiceId = pathParts[pathParts.length - 2];
      const token = params.get('token');

      const response = await fetch(
        `/api/public/payments/invoice/${invoiceId}?token=${token}`,
        { method: "POST" }
      );

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setPayError(body.message || "Unable to start payment. Please try again.");
        setPayLoading(false);
        return;
      }

      const { paymentUrl, formData } = await response.json();

      // PayFast expects a form POST, not a redirect.
      const form = document.createElement("form");
      form.method = "POST";
      form.action = paymentUrl;
      Object.entries(formData as Record<string, string>).forEach(([key, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = value ?? "";
        form.appendChild(input);
      });
      document.body.appendChild(form);
      form.submit();
    } catch (err) {
      setPayError("Unable to start payment. Please try again.");
      setPayLoading(false);
    }
  };

  useEffect(() => {
    const fetchInvoice = async () => {
      const params = new URLSearchParams(window.location.search);
      const pathParts = window.location.pathname.split('/');
      const invoiceId = pathParts[pathParts.length - 2]; // Get invoice ID from path like /invoices/:id/view
      const token = params.get('token');

      if (!invoiceId || !token) {
        setError("Invalid invoice link");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/public/invoice/${invoiceId}?token=${token}`);
        if (!response.ok) throw new Error("Invoice not found");

        const data = await response.json();
        setInvoiceData(data);
      } catch (err) {
        setError("Unable to load invoice. Please check your link.");
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (error || !invoiceData) {
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

  const { invoice, business, contact } = invoiceData;
  const formatCurrency = (amount: string) => `R ${parseFloat(amount).toFixed(2)}`;
  const formatDate = (date: string) => new Date(date).toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-800",
    sent: "bg-blue-100 text-blue-800",
    paid: "bg-green-100 text-green-800",
    overdue: "bg-red-100 text-red-800",
    cancelled: "bg-orange-100 text-orange-800",
  };

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
              <Badge className={statusColors[invoice.status] || "bg-gray-100 text-gray-800"}>
                {invoice.status.toUpperCase()}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Invoice Details Card */}
        <Card className="mb-6">
          <CardHeader className="bg-gray-900 text-white">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-2xl">INVOICE</CardTitle>
                {invoice.title && (
                  <p className="text-gray-100 mt-2 font-medium">{invoice.title}</p>
                )}
                <p className="text-gray-300 mt-1">Invoice #{invoice.invoiceNumber}</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(invoice.createdAt)}</span>
                </div>
                {invoice.dueDate && (
                  <p className="text-sm text-gray-300 mt-1">
                    Due: {formatDate(invoice.dueDate)}
                  </p>
                )}
                {invoice.paidAt && (
                  <p className="text-sm text-green-300 mt-1">
                    Paid: {formatDate(invoice.paidAt)}
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
                  {invoice.items.map((item, index) => (
                    <tr key={index} className="border-b border-gray-200">
                      <td className="py-4 px-2">
                        <div className="text-gray-900">{item.description}</div>
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
                  ))}
                </tbody>
              </table>
            </div>

            <Separator className="my-6" />

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-full sm:w-80 space-y-2">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(invoice.subtotal)}</span>
                </div>
                {parseFloat(invoice.taxAmount) > 0 && (
                  <div className="flex justify-between text-gray-700">
                    <span>VAT (15%):</span>
                    <span>{formatCurrency(invoice.taxAmount)}</span>
                  </div>
                )}
                
                {/* Show deposit deduction for final invoices */}
                {invoice.invoiceType === 'final' && invoice.depositAmount && parseFloat(invoice.depositAmount) > 0 && (
                  <div className="flex justify-between text-gray-700">
                    <span>Less: Previous Deposit Paid:</span>
                    <span>-{formatCurrency(invoice.depositAmount)}</span>
                  </div>
                )}
                
                <Separator />
                
                {/* Show balance due for final invoices, otherwise show total */}
                {invoice.invoiceType === 'final' && invoice.balanceDue !== undefined ? (
                  <div className="flex justify-between text-xl font-bold text-gray-900">
                    <span>BALANCE DUE:</span>
                    <span>{formatCurrency(invoice.balanceDue)}</span>
                  </div>
                ) : (
                  <div className="flex justify-between text-xl font-bold text-gray-900">
                    <span>TOTAL:</span>
                    <span>{formatCurrency(invoice.totalAmount)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            {invoice.notes && (
              <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-md">
                <div className="flex items-start gap-2">
                  <FileText className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-amber-900 mb-2">Notes:</h4>
                    <p className="text-sm text-amber-800 whitespace-pre-wrap">{invoice.notes}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Status */}
            {invoice.status === 'paid' && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
                <p className="text-green-800 text-center font-medium">
                  ✓ Payment Received - Thank You!
                </p>
              </div>
            )}

            {invoice.status === 'overdue' && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-800 text-center font-medium">
                  This invoice is overdue. Please arrange payment as soon as possible.
                </p>
              </div>
            )}

            {/* Pay now — only when the business has switched online payments on
                AND the server has PayFast credentials. */}
            {invoice.status !== 'paid' && paymentsEnabled && (
              <div className="mt-6">
                <Button
                  onClick={handlePayNow}
                  disabled={payLoading}
                  className="w-full h-12 text-base"
                  data-testid="button-pay-now"
                >
                  {payLoading ? "Redirecting to PayFast..." : `Pay ${formatCurrency(invoice.totalAmount)} now`}
                </Button>
                {payError && (
                  <p className="mt-2 text-sm text-red-600 text-center">{payError}</p>
                )}
                <p className="mt-2 text-xs text-gray-500 text-center">
                  You'll be taken to PayFast to complete payment securely.
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
      </div>
    </div>
  );
}
