import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { FileText, Plus, Search, TrendingUp, Clock, CheckCircle, Percent, Eye, Edit, Copy, Archive, Trash2, Send, MapPin, Calendar, DollarSign, User, Mail, Phone, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocation } from "wouter";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { formatDateSA } from "@/lib/date-utils";
import { Checkbox } from "@/components/ui/checkbox";
import { quoteStatusColors, quoteStatusLabels } from "@/lib/statusColors";

type QuoteStatus = "draft" | "ai_quote" | "sent" | "viewed" | "accepted" | "deposit_paid" | "declined" | "expired" | "archived";

interface Quote {
  id: string;
  quoteNumber: string;
  contactId: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  status: QuoteStatus;
  totalAmount: string;
  validUntil: string;
  createdAt: string;
  publicToken?: string; // Added publicToken to Quote interface
  declineReason?: string; // Added declineReason
}

interface QuoteStats {
  totalThisMonth: number;
  pending: number;
  acceptedThisMonth: number;
  acceptedValue: number;
  conversionRate: number;
}

const STORAGE_KEY = "quote-status-filters";
const ALL_STATUSES: QuoteStatus[] = ["draft", "ai_quote", "sent", "viewed", "accepted", "deposit_paid", "declined", "expired", "archived"];

export default function QuotesPage() {
  const pageStyle = { fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif' };
  const [location, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<QuoteStatus[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [deleteQuoteId, setDeleteQuoteId] = useState<string | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Load filters from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(statusFilter));
  }, [statusFilter]);

  const { data: quotes = [], isLoading, refetch } = useQuery<Quote[]>({
    queryKey: ["/api/quotes", statusFilter],
    queryFn: async () => {
      const url = statusFilter.length === 0 || statusFilter.length === ALL_STATUSES.length
        ? "/api/quotes"
        : `/api/quotes?status=${statusFilter.join(",")}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch quotes");
      return res.json();
    },
  });

  const { data: stats } = useQuery<QuoteStats>({
    queryKey: ["/api/quotes/stats"],
    queryFn: async () => {
      const res = await fetch("/api/quotes/stats", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (quoteId: string) => {
      const res = await fetch(`/api/quotes/${quoteId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete quote");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/quotes/stats"] });
      toast({
        title: "Success",
        description: "Quote deleted successfully",
      });
      setDeleteQuoteId(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete quote",
        variant: "destructive",
      });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (quoteId: string) => {
      // Fetch the original quote with items
      const res = await fetch(`/api/quotes/${quoteId}`, {
        credentials: "include",
      });
      if (!res.ok) {
        const errorText = await res.text().catch(() => "");
        console.error("Failed to fetch quote for duplication:", errorText);
        throw new Error("Could not find the quote to duplicate. It may have been deleted.");
      }
      const original = await res.json();

      // Validate that we have the necessary data
      if (!original.contactId) {
        throw new Error("Quote is missing customer information. Cannot duplicate.");
      }
      if (!original.items || original.items.length === 0) {
        throw new Error("Quote has no line items. Cannot duplicate.");
      }

      // Create a new quote with the same data but as 'sent' status to trigger notifications
      const newQuote = {
        contactId: original.contactId,
        validUntil: original.validUntil,
        subtotal: original.subtotal.toString(),
        taxAmount: original.taxAmount?.toString() || "0",
        discountAmount: original.discountAmount?.toString() || "0",
        totalAmount: original.totalAmount.toString(),
        notes: original.notes || "",
        locationAddress: original.locationAddress || "",
        status: "sent", // Changed from 'draft' to trigger notifications
        items: original.items.map((item: any) => ({
          description: item.description,
          quantity: item.quantity.toString(),
          unitPrice: item.unitPrice.toString(),
          lineTotal: item.lineTotal.toString(),
        })),
      };

      const createRes = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(newQuote),
      });

      if (!createRes.ok) {
        const errorData = await createRes.json().catch(() => ({ message: "Unknown error" }));
        console.error("Failed to create duplicate quote:", errorData);
        if (errorData.message?.includes("duplicate key")) {
          throw new Error("Failed to create duplicate quote. Please try again.");
        }
        if (errorData.message?.includes("customer") || errorData.message?.includes("contact")) {
          throw new Error("Customer no longer exists. Cannot duplicate quote.");
        }
        throw new Error(errorData.message || "Failed to duplicate quote. Please check all fields and try again.");
      }
      return createRes.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/quotes/stats"] });
      toast({
        title: "Quote Duplicated & Sent",
        description: `Created and sent as ${data.quoteNumber}`,
      });
      setLocation(`/dashboard/quotes/${data.id}/edit`);
    },
    onError: (error: Error) => {
      console.error("Duplicate quote error:", error);
      toast({
        title: "Failed to Duplicate Quote",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async (quoteId: string) => {
      const res = await fetch(`/api/quotes/${quoteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "archived" }),
      });
      if (!res.ok) {
        const error = await res.json();
        if (error.message?.includes("accepted")) {
          throw new Error("Cannot archive an accepted quote. Please create a new quote instead.");
        }
        throw new Error(error.message || "Could not archive this quote. Please try again.");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/quotes/stats"] });
      toast({
        title: "Success",
        description: "Quote archived successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Could Not Archive Quote",
        description: error.message || "An error occurred while archiving the quote. Please try again.",
        variant: "destructive",
      });
    },
  });

  const sendMutation = useMutation({
    mutationFn: async (quoteId: string) => {
      console.log('📤 Sending quote:', quoteId);
      const res = await fetch(`/api/quotes/${quoteId}/send`, {
        method: "POST",
        credentials: "include",
      });

      console.log('📨 Response status:', res.status);

      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: "Failed to send quote" }));
        console.error('❌ Send failed:', error);
        throw new Error(error.message || "Failed to send quote");
      }

      const data = await res.json();
      console.log('✅ Send response:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log('🎉 Send success, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/quotes/stats"] });

      // Show specific success message based on channels used
      const channels = data.sentVia || [];
      let description = data.message || "Quote sent successfully";

      if (channels.length > 0) {
        if (channels.includes('WhatsApp') && channels.includes('Email')) {
          description = "Quote sent via WhatsApp and Email";
        } else if (channels.includes('WhatsApp')) {
          description = "Quote sent via WhatsApp";
        } else if (channels.includes('Email')) {
          description = "Quote sent via Email";
        }
      }

      console.log('📢 Showing toast:', description);
      toast({
        title: "Success",
        description,
      });
    },
    onError: (error: Error) => {
      console.error('❌ Send error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send quote",
        variant: "destructive",
      });
    },
  });

  const filteredQuotes = quotes.filter((quote) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      quote.quoteNumber.toLowerCase().includes(searchLower) ||
      quote.contactName?.toLowerCase().includes(searchLower) ||
      quote.contactEmail?.toLowerCase().includes(searchLower) ||
      quote.contactPhone?.toLowerCase().includes(searchLower);
    return matchesSearch;
  });

  const handleCloseSheet = () => {
    setIsDetailsOpen(false);
    setSelectedQuote(null);
  };

  return (
    <div className="space-y-6" style={pageStyle}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Quotes</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage customer quotes
          </p>
        </div>
        <Button onClick={() => setLocation("/dashboard/quotes/new")} style={{ backgroundColor: '#612fff', borderColor: '#612fff' }}>
          <Plus className="mr-2 h-4 w-4" />
          New Quote
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total This Month</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalThisMonth || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Quotes created</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pending || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting response</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accepted This Month</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.acceptedThisMonth || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(stats?.acceptedValue || 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.conversionRate || 0}%</div>
            <p className="text-xs text-muted-foreground mt-1">Quote to acceptance</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by quote #, name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="relative">
              <Button
                variant="outline"
                className="w-full sm:w-[180px] justify-between"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
              >
                <span className="truncate">
                  {statusFilter.length === 0
                    ? "All Statuses"
                    : statusFilter.length === 1
                    ? statusFilter[0]
                    : `${statusFilter.length} selected`}
                </span>
                <span className="text-xs text-muted-foreground ml-2">▼</span>
              </Button>
              {isFilterOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-md z-50 p-2">
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    <button
                      className="w-full text-left px-2 py-1.5 text-sm hover:bg-accent rounded flex items-center gap-2"
                      onClick={() => {
                        if (statusFilter.length === ALL_STATUSES.length) {
                          setStatusFilter([]);
                        } else {
                          setStatusFilter([...ALL_STATUSES]);
                        }
                      }}
                    >
                      <Checkbox checked={statusFilter.length === ALL_STATUSES.length} />
                      <span className="font-semibold">Select All</span>
                    </button>
                    {ALL_STATUSES.map((status) => (
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
                        <span>{quoteStatusLabels[status]}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {filteredQuotes.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No quotes found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first quote to get started
              </p>
              <Button onClick={() => setLocation("/dashboard/quotes/new")} style={{ backgroundColor: '#612fff', borderColor: '#612fff' }}>
                <Plus className="mr-2 h-4 w-4" />
                Create Quote
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredQuotes.map((quote) => {
            const canSend = quote.contactEmail || quote.contactPhone;
            return (
              <Card key={quote.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-mono text-sm font-semibold">{quote.quoteNumber}</h3>
                      <Badge className={`${quoteStatusColors[quote.status]} mt-1`} variant="secondary">
                        {quoteStatusLabels[quote.status]}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (quote.publicToken) {
                            window.open(`/quotes/${quote.id}/view?token=${quote.publicToken}`, '_blank');
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
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {['draft', 'sent', 'viewed', 'ai_quote'].includes(quote.status) && (
                            <DropdownMenuItem onClick={() => setLocation(`/dashboard/quotes/${quote.id}/edit`)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Quote
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => sendMutation.mutate(quote.id)}
                            disabled={!canSend || sendMutation.isPending}
                          >
                            <Send className="mr-2 h-4 w-4" />
                            {quote.status === "draft" ? "Send Quote" : "Resend Quote"}
                          </DropdownMenuItem>
                          {(quote.status === "sent" || quote.status === "ai_quote" || quote.status === "viewed") && (
                            <DropdownMenuItem
                              onClick={() => setLocation(`/dashboard/jobs/new?quoteId=${quote.id}`)}
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Create Job
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => duplicateMutation.mutate(quote.id)}
                            disabled={duplicateMutation.isPending}
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicate Quote
                          </DropdownMenuItem>
                          {quote.status !== "archived" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => archiveMutation.mutate(quote.id)}
                                disabled={archiveMutation.isPending}
                              >
                                <Archive className="mr-2 h-4 w-4" />
                                Archive Quote
                              </DropdownMenuItem>
                            </>
                          )}
                          {quote.status === "draft" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setDeleteQuoteId(quote.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Quote
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>{quote.contactName || "—"}</span>
                    </div>
                    {quote.title && (
                      <div className="font-medium text-base">{quote.title}</div>
                    )}
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold text-lg text-green-600">
                        {formatCurrency(parseFloat(quote.totalAmount))}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Valid until: {formatDateSA(quote.validUntil)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Desktop Table View */}
      <Card className="hidden md:block">
        <CardContent className="p-0">
          {filteredQuotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No quotes found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first quote to get started
              </p>
              <Button onClick={() => setLocation("/dashboard/quotes/new")} style={{ backgroundColor: '#612fff', borderColor: '#612fff' }}>
                <Plus className="mr-2 h-4 w-4" />
                Create Quote
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-mono">Quote #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Valid Until</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotes.map((quote) => {
                  const canSend = quote.contactEmail || quote.contactPhone;
                  return (
                    <TableRow key={quote.id}>
                      <TableCell className="font-mono text-sm">{quote.quoteNumber}</TableCell>
                      <TableCell>
                        <div>
                          <div>{quote.contactName || "—"}</div>
                          {quote.status === 'declined' && quote.declineReason && (
                            <div className="text-xs text-muted-foreground mt-1 max-w-xs truncate" title={quote.declineReason}>
                              Reason: {quote.declineReason}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{quote.title || "—"}</TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(parseFloat(quote.totalAmount))}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={quoteStatusColors[quote.status]}
                        >
                          {quoteStatusLabels[quote.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatDateSA(quote.validUntil)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDateSA(quote.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (quote.publicToken) {
                                window.open(`/quotes/${quote.id}/view?token=${quote.publicToken}`, '_blank');
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
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {['draft', 'sent', 'viewed', 'ai_quote'].includes(quote.status) && (
                                <DropdownMenuItem onClick={() => setLocation(`/dashboard/quotes/${quote.id}/edit`)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Quote
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => sendMutation.mutate(quote.id)}
                                disabled={!canSend || sendMutation.isPending}
                              >
                                <Send className="mr-2 h-4 w-4" />
                                {quote.status === "draft" ? "Send Quote" : "Resend Quote"}
                              </DropdownMenuItem>
                              {(quote.status === "sent" || quote.status === "ai_quote" || quote.status === "viewed") && (
                                <DropdownMenuItem
                                  onClick={() => setLocation(`/dashboard/jobs/new?quoteId=${quote.id}`)}
                                >
                                  <Plus className="mr-2 h-4 w-4" />
                                  Create Job
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => duplicateMutation.mutate(quote.id)}
                                disabled={duplicateMutation.isPending}
                              >
                                <Copy className="mr-2 h-4 w-4" />
                                Duplicate Quote
                              </DropdownMenuItem>
                              {quote.status !== "archived" && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => archiveMutation.mutate(quote.id)}
                                    disabled={archiveMutation.isPending}
                                  >
                                    <Archive className="mr-2 h-4 w-4" />
                                    Archive Quote
                                  </DropdownMenuItem>
                                </>
                              )}
                              {quote.status === "draft" && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => setDeleteQuoteId(quote.id)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Quote
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Quote Details Sheet */}
      <Sheet open={isDetailsOpen} onOpenChange={handleCloseSheet}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selectedQuote && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center justify-between">
                  <span>{selectedQuote.quoteNumber}</span>
                  <Badge className={quoteStatusColors[selectedQuote.status]} variant="secondary">
                    {selectedQuote.status}
                  </Badge>
                </SheetTitle>
                <SheetDescription>
                  Quote details and actions
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-6 mt-6">
                {/* Customer Information */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">Customer Information</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedQuote.contactName || "—"}</span>
                    </div>
                    {selectedQuote.contactEmail && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedQuote.contactEmail}</span>
                      </div>
                    )}
                    {selectedQuote.contactPhone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedQuote.contactPhone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quote Details */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">Quote Details</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">
                        {formatCurrency(parseFloat(selectedQuote.totalAmount))}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Valid until: {formatDateSA(selectedQuote.validUntil)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Created: {formatDateSA(selectedQuote.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Decline Reason (if applicable) */}
                {selectedQuote.status === 'rejected' && selectedQuote.declineReason && (
                  <div>
                    <h3 className="text-sm font-semibold mb-3">Decline Reason</h3>
                    <p className="text-sm text-muted-foreground">{selectedQuote.declineReason}</p>
                  </div>
                )}

                {/* Actions */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">Actions</h3>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => {
                        window.open(`/api/quotes/${selectedQuote.id}/public-link`, '_blank');
                        handleCloseSheet();
                      }}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View Quote
                    </Button>

                    {selectedQuote.status === "draft" && (
                      <>
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => {
                            setLocation(`/dashboard/quotes/${selectedQuote.id}/edit`);
                            handleCloseSheet();
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Quote
                        </Button>

                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => {
                            sendMutation.mutate(selectedQuote.id);
                            handleCloseSheet();
                          }}
                          disabled={sendMutation.isPending}
                        >
                          <Send className="mr-2 h-4 w-4" />
                          {sendMutation.isPending ? "Sending..." : "Send Quote"}
                        </Button>
                      </>
                    )}

                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => {
                        duplicateMutation.mutate(selectedQuote.id);
                        handleCloseSheet();
                      }}
                      disabled={duplicateMutation.isPending}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      {duplicateMutation.isPending ? "Duplicating..." : "Duplicate Quote"}
                    </Button>

                    {selectedQuote.status !== "archived" && selectedQuote.status !== "draft" && (
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => {
                          archiveMutation.mutate(selectedQuote.id);
                          handleCloseSheet();
                        }}
                        disabled={archiveMutation.isPending}
                      >
                        <Archive className="mr-2 h-4 w-4" />
                        {archiveMutation.isPending ? "Archiving..." : "Archive Quote"}
                      </Button>
                    )}

                    {selectedQuote.status === "draft" && (
                      <Button
                        variant="outline"
                        className="w-full justify-start text-destructive hover:text-destructive"
                        onClick={() => {
                          setDeleteQuoteId(selectedQuote.id);
                          handleCloseSheet();
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Quote
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteQuoteId} onOpenChange={() => setDeleteQuoteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Quote?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this draft quote. This action cannot be undone.
              {deleteQuoteId && (
                <span className="block mt-2 text-sm">
                  Quote: <strong>{quotes.find(q => q.id === deleteQuoteId)?.quoteNumber}</strong>
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteQuoteId && deleteMutation.mutate(deleteQuoteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Quote"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}