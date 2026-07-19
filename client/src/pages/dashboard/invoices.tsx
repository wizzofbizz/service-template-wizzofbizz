import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Receipt, 
  Search, 
  Plus, 
  Eye, 
  Send, 
  DollarSign,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Download,
  Trash2,
  MoreVertical,
  Edit,
  User
} from "lucide-react";
import { 
  invoiceStatusColors, 
  invoiceStatusLabels,
  invoiceTypeColors,
  invoiceTypeLabels
} from "@/lib/statusColors";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled";

type Invoice = {
  id: string;
  invoiceNumber: string;
  contactId: string;
  jobId: string | null;
  title?: string;
  status: InvoiceStatus;
  invoiceType?: "standard" | "deposit" | "final";
  dueDate: string | null;
  paidAt: string | null;
  subtotal: string;
  taxAmount: string;
  totalAmount: string;
  depositAmount?: string;
  balanceDue?: string;
  linkedDepositInvoiceId?: string;
  createdAt: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  jobNumber?: string;
};

type InvoiceStats = {
  totalOutstanding: number;
  paidThisMonth: number;
  overdueCount: number;
  overdueAmount: number;
  averageDaysToPayment: number;
  totalInvoicesThisMonth: number;
};

const statusColors = {
  draft: "bg-gray-100 text-gray-800",
  sent: "bg-blue-100 text-blue-800",
  paid: "bg-green-100 text-green-800",
  overdue: "bg-red-100 text-red-800",
  cancelled: "bg-orange-100 text-orange-800",
};

const typeColors = {
  standard: "bg-slate-100 text-slate-800",
  deposit: "bg-purple-100 text-purple-800",
  final: "bg-teal-100 text-teal-800",
};

const typeIcons = {
  standard: Receipt,
  deposit: DollarSign,
  final: CheckCircle2,
};

const INVOICE_STORAGE_KEY = "invoice-status-filters";
const ALL_INVOICE_STATUSES: InvoiceStatus[] = ["draft", "sent", "paid", "overdue", "cancelled"];

const statusLabels: Record<InvoiceStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  paid: "Paid",
  overdue: "Overdue",
  cancelled: "Cancelled",
};

// Helper function to get display amount (balanceDue for final invoices, totalAmount otherwise)
const getDisplayAmount = (invoice: Invoice): string => {
  if (invoice.invoiceType === "final" && invoice.balanceDue) {
    return invoice.balanceDue;
  }
  return invoice.totalAmount;
};

// Helper function to get display label for amount
const getDisplayLabel = (invoice: Invoice): string => {
  if (invoice.invoiceType === "final" && invoice.balanceDue) {
    return "Balance Due";
  }
  return "Total";
};

export default function InvoicesPage() {
  const pageStyle = { fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif' };
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus[]>([]);
  const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showMarkPaidDialog, setShowMarkPaidDialog] = useState(false);
  const [showExtendDueDateDialog, setShowExtendDueDateDialog] = useState(false);
  const [paymentDate, setPaymentDate] = useState("");
  const [paymentMethodPaid, setPaymentMethodPaid] = useState("bank_transfer");
  const [newDueDate, setNewDueDate] = useState("");

  // Load filters from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(INVOICE_STORAGE_KEY);
    if (saved) {
      try {
        setStatusFilter(JSON.parse(saved));
      } catch {
        setStatusFilter([]);
      }
    }
  }, []);

  // Save filters to localStorage when they change
  useEffect(() => {
    localStorage.setItem(INVOICE_STORAGE_KEY, JSON.stringify(statusFilter));
  }, [statusFilter]);

  // Fetch invoices
  const { data: invoices = [], isLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices", statusFilter],
    queryFn: async () => {
      const url = statusFilter.length > 0 
        ? `/api/invoices?status=${statusFilter.join(',')}` 
        : "/api/invoices";
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch invoices");
      return res.json();
    },
  });

  // Fetch invoice stats
  const { data: stats } = useQuery<InvoiceStats>({
    queryKey: ["/api/invoices/stats"],
    queryFn: async () => {
      const res = await fetch("/api/invoices/stats", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
  });

  // Send invoice mutation
  const sendMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/invoices/${id}/send`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({ title: "Invoice sent successfully" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error sending invoice", 
        description: error.message,
        variant: "destructive"
      });
    },
  });

  // Mark as paid mutation
  const markPaidMutation = useMutation({
    mutationFn: async (data: { id: string; paymentDate: string; paymentMethod: string }) => {
      const res = await fetch(`/api/invoices/${data.id}/mark-paid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ 
          paymentDate: data.paymentDate,
          paymentMethod: data.paymentMethod
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices/stats"] });
      toast({ title: "Invoice marked as paid" });
      setShowMarkPaidDialog(false);
      setSelectedInvoice(null);
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error marking invoice as paid", 
        description: error.message,
        variant: "destructive"
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/invoices/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices/stats"] });
      toast({ title: "Invoice deleted" });
      setShowDeleteDialog(false);
      setSelectedInvoice(null);
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error deleting invoice", 
        description: error.message,
        variant: "destructive"
      });
    },
  });

  // Extend due date mutation
  const extendDueDateMutation = useMutation({
    mutationFn: async (data: { id: string; newDueDate: string }) => {
      const res = await fetch(`/api/invoices/${data.id}/extend-due-date`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ newDueDate: data.newDueDate }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices/stats"] });
      toast({ title: "Due date extended successfully" });
      setShowExtendDueDateDialog(false);
      setSelectedInvoice(null);
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error extending due date", 
        description: error.message,
        variant: "destructive"
      });
    },
  });

  // Send payment reminder mutation
  const sendReminderMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/invoices/${id}/send-reminder`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({ title: "Payment reminder sent successfully" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error sending reminder", 
        description: error.message,
        variant: "destructive"
      });
    },
  });

  // Filter invoices by search term and type
  const filteredInvoices = invoices.filter((invoice) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (
      invoice.invoiceNumber.toLowerCase().includes(searchLower) ||
      invoice.contactName?.toLowerCase().includes(searchLower) ||
      invoice.contactEmail?.toLowerCase().includes(searchLower) ||
      invoice.contactPhone?.toLowerCase().includes(searchLower) ||
      invoice.jobNumber?.toLowerCase().includes(searchLower)
    );

    const matchesType = typeFilter === "all" || invoice.invoiceType === typeFilter;

    return matchesSearch && matchesType;
  });

  const formatCurrency = (amount: string | number) => {
    return `R ${parseFloat(amount.toString()).toFixed(2)}`;
  };

  const getDaysOverdue = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    const diff = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  return (
    <div className="space-y-6" style={pageStyle}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Invoices</h1>
          <p className="text-muted-foreground mt-1">
            Track payments and manage invoices
          </p>
        </div>
        <Button onClick={() => setLocation("/dashboard/invoices/new")} size="default" style={{ backgroundColor: '#612fff', borderColor: '#612fff' }}>
          <Plus className="mr-2 h-4 w-4" />
          New Invoice
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalOutstanding)}</div>
              <p className="text-xs text-muted-foreground">Unpaid invoices</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Paid This Month</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.paidThisMonth)}</div>
              <p className="text-xs text-muted-foreground">{stats.totalInvoicesThisMonth} invoices</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{formatCurrency(stats.overdueAmount)}</div>
              <p className="text-xs text-muted-foreground">{stats.overdueCount} invoices</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Days to Payment</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageDaysToPayment}</div>
              <p className="text-xs text-muted-foreground">days</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by invoice #, name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="relative">
              <Button 
                variant="outline"
                className="w-full sm:w-[180px] justify-between"
                onClick={() => setIsStatusFilterOpen(!isStatusFilterOpen)}
              >
                <span className="truncate">
                  {statusFilter.length === 0 
                    ? "All Statuses" 
                    : statusFilter.length === 1 
                    ? statusLabels[statusFilter[0]]
                    : `${statusFilter.length} selected`}
                </span>
                <span className="text-xs text-muted-foreground ml-2">▼</span>
              </Button>
              {isStatusFilterOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-md z-50 p-2">
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    <button
                      className="w-full text-left px-2 py-1.5 text-sm hover:bg-accent rounded flex items-center gap-2"
                      onClick={() => {
                        if (statusFilter.length === ALL_INVOICE_STATUSES.length) {
                          setStatusFilter([]);
                        } else {
                          setStatusFilter([...ALL_INVOICE_STATUSES]);
                        }
                      }}
                    >
                      <Checkbox checked={statusFilter.length === ALL_INVOICE_STATUSES.length} />
                      <span className="font-semibold">Select All</span>
                    </button>
                    {ALL_INVOICE_STATUSES.map((status) => (
                      <button
                        key={status}
                        className="w-full text-left px-2 py-1.5 text-sm hover:bg-accent rounded flex items-center gap-2"
                        onClick={() => {
                          setStatusFilter(prev =>
                            prev.includes(status)
                              ? prev.filter(s => s !== status)
                              : [...prev, status]
                          );
                        }}
                      >
                        <Checkbox checked={statusFilter.includes(status)} />
                        <span>{statusLabels[status]}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="deposit">Deposit</SelectItem>
                <SelectItem value="final">Final</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {isLoading ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-muted-foreground">Loading invoices...</div>
            </CardContent>
          </Card>
        ) : filteredInvoices.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No invoices found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Complete a job to generate your first invoice
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredInvoices.map((invoice) => (
            <Card key={invoice.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-mono text-sm font-semibold">{invoice.invoiceNumber}</h3>
                      {invoice.invoiceType && invoice.invoiceType !== "standard" && (
                        <Badge className={`${invoiceTypeColors[invoice.invoiceType]} text-xs`}>
                          {invoiceTypeLabels[invoice.invoiceType]}
                        </Badge>
                      )}
                    </div>
                    <Badge className={`${invoiceStatusColors[invoice.status]} mt-1`}>
                      {invoice.status === "overdue" && invoice.dueDate
                        ? `${invoiceStatusLabels[invoice.status]} (${getDaysOverdue(invoice.dueDate)}d)`
                        : invoiceStatusLabels[invoice.status]}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        try {
                          const res = await fetch(`/api/invoices/${invoice.id}`);
                          if (res.ok) {
                            const invoiceData = await res.json();
                            if (invoiceData.publicToken) {
                              window.open(`/invoices/${invoice.id}/view?token=${invoiceData.publicToken}`, '_blank');
                            }
                          }
                        } catch (err) {
                          console.error('Failed to get invoice token:', err);
                        }
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          disabled={invoice.status !== "draft" && invoice.status !== "sent" && invoice.status !== "overdue"}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {invoice.status === "draft" && (
                          <>
                            <DropdownMenuItem onClick={() => setLocation(`/dashboard/invoices/${invoice.id}/edit`)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => sendMutation.mutate(invoice.id)}
                              disabled={sendMutation.isPending}
                            >
                              <Send className="mr-2 h-4 w-4" />
                              Send to customer
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => {
                                setSelectedInvoice(invoice);
                                setShowDeleteDialog(true);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </>
                        )}
                        {(invoice.status === "sent" || invoice.status === "overdue") && (
                          <>
                            <DropdownMenuItem 
                              onClick={() => {
                                setSelectedInvoice(invoice);
                                setPaymentDate(new Date().toISOString().split('T')[0]);
                                setShowMarkPaidDialog(true);
                              }}
                            >
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Mark as paid
                            </DropdownMenuItem>
                            {invoice.status === "overdue" && (
                              <>
                                <DropdownMenuItem 
                                  onClick={() => sendReminderMutation.mutate(invoice.id)}
                                  disabled={sendReminderMutation.isPending}
                                >
                                  <Send className="mr-2 h-4 w-4" />
                                  Send payment reminder
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setSelectedInvoice(invoice);
                                    const tomorrow = new Date();
                                    tomorrow.setDate(tomorrow.getDate() + 7);
                                    setNewDueDate(tomorrow.toISOString().split('T')[0]);
                                    setShowExtendDueDateDialog(true);
                                  }}
                                >
                                  <Calendar className="mr-2 h-4 w-4" />
                                  Extend due date
                                </DropdownMenuItem>
                              </>
                            )}
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>{invoice.contactName || "Unknown"}</span>
                  </div>
                  {invoice.title && (
                    <div className="font-medium text-base">{invoice.title}</div>
                  )}
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold text-lg text-green-600">
                      {formatCurrency(getDisplayAmount(invoice))}
                    </span>
                  </div>
                  {invoice.invoiceType === "final" && invoice.depositAmount && parseFloat(invoice.depositAmount) > 0 && (
                    <div className="text-xs text-muted-foreground">
                      Deposit paid: {formatCurrency(invoice.depositAmount)}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Due: {invoice.dueDate ? format(new Date(invoice.dueDate), "MMM d, yyyy") : "—"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      {isLoading ? (
        <Card className="hidden md:block">
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">Loading invoices...</div>
          </CardContent>
        </Card>
      ) : filteredInvoices.length === 0 ? (
        <Card className="hidden md:block">
          <CardContent className="pt-6 text-center py-12">
            <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No invoices found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Complete a job to generate your first invoice
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="hidden md:block">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-mono">Invoice #</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-mono text-sm">
                        {invoice.invoiceNumber}
                      </TableCell>
                      <TableCell>
                        {invoice.invoiceType && (
                          <Badge className={`${invoiceTypeColors[invoice.invoiceType || "standard"]} text-xs`}>
                            {invoiceTypeLabels[invoice.invoiceType || "standard"]}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {invoice.contactName || "Unknown"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {invoice.title || "—"}
                      </TableCell>
                      <TableCell className="font-semibold">
                        <div>
                          {formatCurrency(getDisplayAmount(invoice))}
                        </div>
                        {invoice.invoiceType === "final" && invoice.depositAmount && parseFloat(invoice.depositAmount) > 0 && (
                          <div className="text-xs text-muted-foreground">
                            Deposit: {formatCurrency(invoice.depositAmount)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={invoiceStatusColors[invoice.status]}>
                          {invoice.status === "overdue" && invoice.dueDate
                            ? `${invoiceStatusLabels[invoice.status]} (${getDaysOverdue(invoice.dueDate)}d)`
                            : invoiceStatusLabels[invoice.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(invoice.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className={`text-sm ${invoice.status === "overdue" ? "text-red-600 font-semibold" : ""}`}>
                        {invoice.dueDate ? format(new Date(invoice.dueDate), "MMM d, yyyy") : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              try {
                                const res = await fetch(`/api/invoices/${invoice.id}`);
                                if (res.ok) {
                                  const invoiceData = await res.json();
                                  if (invoiceData.publicToken) {
                                    window.open(`/invoices/${invoice.id}/view?token=${invoiceData.publicToken}`, '_blank');
                                  }
                                }
                              } catch (err) {
                                console.error('Failed to get invoice token:', err);
                              }
                            }}
                            title="View Invoice"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                disabled={invoice.status !== "draft" && invoice.status !== "sent" && invoice.status !== "overdue"}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                            {invoice.status === "draft" && (
                              <>
                                <DropdownMenuItem onClick={() => setLocation(`/dashboard/invoices/${invoice.id}/edit`)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => sendMutation.mutate(invoice.id)}
                                  disabled={sendMutation.isPending}
                                >
                                  <Send className="mr-2 h-4 w-4" />
                                  Send to customer
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => {
                                    setSelectedInvoice(invoice);
                                    setShowDeleteDialog(true);
                                  }}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </>
                            )}
                            {(invoice.status === "sent" || invoice.status === "overdue") && (
                              <>
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setSelectedInvoice(invoice);
                                    setPaymentDate(new Date().toISOString().split('T')[0]);
                                    setShowMarkPaidDialog(true);
                                  }}
                                >
                                  <CheckCircle2 className="mr-2 h-4 w-4" />
                                  Mark as paid
                                </DropdownMenuItem>
                                {invoice.status === "overdue" && (
                                  <>
                                    <DropdownMenuItem 
                                      onClick={() => sendReminderMutation.mutate(invoice.id)}
                                      disabled={sendReminderMutation.isPending}
                                    >
                                      <Send className="mr-2 h-4 w-4" />
                                      Send payment reminder
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      onClick={() => {
                                        setSelectedInvoice(invoice);
                                        const tomorrow = new Date();
                                        tomorrow.setDate(tomorrow.getDate() + 7);
                                        setNewDueDate(tomorrow.toISOString().split('T')[0]);
                                        setShowExtendDueDateDialog(true);
                                      }}
                                    >
                                      <Calendar className="mr-2 h-4 w-4" />
                                      Extend due date
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Invoice</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete invoice {selectedInvoice?.invoiceNumber}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => selectedInvoice && deleteMutation.mutate(selectedInvoice.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark as Paid Dialog */}
      <Dialog open={showMarkPaidDialog} onOpenChange={setShowMarkPaidDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Invoice as Paid</DialogTitle>
            <DialogDescription>
              Record payment for invoice {selectedInvoice?.invoiceNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="paymentDate">Payment Date</Label>
              <Input
                id="paymentDate"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select value={paymentMethodPaid} onValueChange={setPaymentMethodPaid}>
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
            <div className="bg-muted p-3 rounded-lg space-y-2">
              {selectedInvoice?.invoiceType === "final" && selectedInvoice?.depositAmount && parseFloat(selectedInvoice.depositAmount) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Invoice:</span>
                  <span>{formatCurrency(selectedInvoice.totalAmount)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold">
                <span>{selectedInvoice && getDisplayLabel(selectedInvoice)}:</span>
                <span className="text-green-600">
                  {selectedInvoice && formatCurrency(getDisplayAmount(selectedInvoice))}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMarkPaidDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => selectedInvoice && markPaidMutation.mutate({
                id: selectedInvoice.id,
                paymentDate,
                paymentMethod: paymentMethodPaid
              })}
              disabled={markPaidMutation.isPending || !paymentDate}
            >
              {markPaidMutation.isPending ? "Processing..." : "Mark as Paid"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Extend Due Date Dialog */}
      <Dialog open={showExtendDueDateDialog} onOpenChange={setShowExtendDueDateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Extend Due Date</DialogTitle>
            <DialogDescription>
              Set a new due date for invoice {selectedInvoice?.invoiceNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newDueDate">New Due Date</Label>
              <Input
                id="newDueDate"
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            {selectedInvoice && selectedInvoice.dueDate && (
              <div className="bg-muted p-3 rounded-lg">
                <div className="text-sm">
                  <span className="font-medium">Current due date:</span>{" "}
                  {format(new Date(selectedInvoice.dueDate), "MMM d, yyyy")}
                </div>
                <div className="text-sm mt-1">
                  <span className="font-medium">Days overdue:</span>{" "}
                  {getDaysOverdue(selectedInvoice.dueDate)}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExtendDueDateDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => selectedInvoice && extendDueDateMutation.mutate({
                id: selectedInvoice.id,
                newDueDate
              })}
              disabled={extendDueDateMutation.isPending || !newDueDate}
            >
              {extendDueDateMutation.isPending ? "Updating..." : "Extend Due Date"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}