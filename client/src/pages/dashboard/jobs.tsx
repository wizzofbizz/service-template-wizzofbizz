import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Calendar as CalendarIcon, Plus, Search, Clock, CheckCircle2, AlertCircle, Download, Send, Eye, MoreVertical, Edit, Play, Check, X, User, DollarSign, Calendar, XCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { formatDateSA } from "@/lib/date-utils";

type JobStatus = "pending" | "pending_deposit" | "deposit_paid" | "scheduled" | "in_progress" | "completed" | "cancelled";

interface Job {
  id: string;
  businessId: string;
  contactId: string;
  quoteId?: string;
  assignedTo?: string;
  jobNumber: string;
  title: string;
  description?: string;
  status: JobStatus;
  scheduledDate: string;
  scheduledStartTime?: string;
  scheduledEndTime?: string;
  locationAddress?: string;
  internalNotes?: string;
  createdAt: string;
  updatedAt: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  jobType?: string; // Added jobType
  items?: Array<{
    id: string;
    description: string;
    quantity: string;
    unitPrice: string;
    lineTotal: string;
  }>;
  depositDeadline?: string;
  depositRemindersSent?: number;
}

interface Contact {
  id: string;
  fullName: string;
  address?: string;
  email?: string;
}

const statusColors: Record<JobStatus, string> = {
  pending: "bg-slate-100 text-slate-800",
  pending_deposit: "bg-yellow-100 text-yellow-800",
  deposit_paid: "bg-purple-100 text-purple-800",
  scheduled: "bg-blue-100 text-blue-800",
  in_progress: "bg-orange-100 text-orange-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const statusLabels: Record<JobStatus, string> = {
  pending: "Pending",
  pending_deposit: "Awaiting Deposit",
  deposit_paid: "Deposit Paid",
  scheduled: "Scheduled",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STORAGE_KEY = "job-status-filters";
const ALL_JOB_STATUSES: JobStatus[] = ["pending", "pending_deposit", "deposit_paid", "scheduled", "in_progress", "completed", "cancelled"];

export default function JobsPage() {
  const pageStyle = { fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif' };
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<JobStatus[]>([]);
  const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [completionNotes, setCompletionNotes] = useState("");
  const [cancellationReason, setCancellationReason] = useState("");
  const [jobTypeFilter, setJobTypeFilter] = useState<string>("all");
  const [newDeadline, setNewDeadline] = useState<string>("");

  // State variables for new deposit dialogs
  const [showDepositReminderDialog, setShowDepositReminderDialog] = useState(false);
  const [showWaiveDepositDialog, setShowWaiveDepositDialog] = useState(false);
  const [showExtendDeadlineDialog, setShowExtendDeadlineDialog] = useState(false);
  const [showCancelUnpaidDialog, setShowCancelUnpaidDialog] = useState(false);
  const [extendedDeadline, setExtendedDeadline] = useState("");

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

  const { data: jobs = [] } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });

  const { data: contacts = [] } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
  });

  const completeJobMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      const res = await fetch(`/api/jobs/${id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ notes }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices/stats"] });
      setShowCompleteDialog(false);
      setCompletionNotes("");
      setSelectedJob(null);

      // Show success toast with remaining balance
      const balanceDue = parseFloat(data.invoice?.balanceDue || data.invoice?.totalAmount || "0");
      const depositAmount = data.invoice?.depositAmount ? parseFloat(data.invoice.depositAmount) : 0;

      let description = "Invoice created and sent to customer";
      if (depositAmount > 0) {
        description = `Deposit paid: R${depositAmount.toFixed(2)} • Remaining balance: R${balanceDue.toFixed(2)}`;
      }

      toast({
        title: "Job completed successfully",
        description: description,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error completing job",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const cancelJobMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const res = await fetch(`/api/jobs/${id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      toast({ title: "Job cancelled" });
      setShowCancelDialog(false);
      setCancellationReason("");
    },
  });

  // Send deposit reminder mutation
  const sendDepositReminderMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const res = await fetch(`/api/jobs/${jobId}/send-deposit-reminder`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      toast({ title: "Deposit reminder sent successfully" });
      setShowDepositReminderDialog(false);
      setSelectedJob(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error sending reminder",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  // Waive deposit mutation
  const waiveDepositMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const res = await fetch(`/api/jobs/${jobId}/waive-deposit`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      toast({ title: "Deposit waived successfully" });
      setShowWaiveDepositDialog(false);
      setSelectedJob(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error waiving deposit",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  // Extend deposit deadline mutation
  const extendDeadlineMutation = useMutation({
    mutationFn: async ({ jobId, newDeadline }: { jobId: string; newDeadline: string }) => {
      const res = await fetch(`/api/jobs/${jobId}/extend-deposit-deadline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ newDeadline }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      toast({ title: "Deposit deadline extended successfully" });
      setShowExtendDeadlineDialog(false);
      setSelectedJob(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error extending deadline",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  // Cancel unpaid booking mutation
  const cancelUnpaidMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const res = await fetch(`/api/jobs/${jobId}/cancel-unpaid`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      toast({ title: "Booking cancelled due to unpaid deposit" });
      setShowCancelUnpaidDialog(false);
      setSelectedJob(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error cancelling booking",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const startJobMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/jobs/${id}/start`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      toast({ title: "Job started" });
      setSelectedJob(null);
    },
  });

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchesStatus = statusFilter.length === 0 || statusFilter.includes(job.status);
      const matchesJobType = jobTypeFilter === "all" || job.jobType === jobTypeFilter;
      const contact = contacts.find((c) => c.id === job.contactId);
      const matchesSearch = searchQuery === "" ||
        job.jobNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact?.fullName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesJobType && matchesSearch;
    });
  }, [jobs, contacts, statusFilter, jobTypeFilter, searchQuery]);

  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split("T")[0];

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const jobsToday = jobs.filter((j) => j.scheduledDate === todayStr).length;
    const jobsThisWeek = jobs.filter((j) => {
      const jobDate = new Date(j.scheduledDate);
      return jobDate >= startOfWeek && jobDate <= endOfWeek;
    }).length;
    const completedThisMonth = jobs.filter((j) => {
      const jobDate = new Date(j.updatedAt);
      return j.status === "completed" &&
        jobDate.getMonth() === today.getMonth() &&
        jobDate.getFullYear() === today.getFullYear();
    }).length;

    return { jobsToday, jobsThisWeek, completedThisMonth };
  }, [jobs]);

  const handleCompleteJob = (job: Job) => {
    setSelectedJob(job);
    setShowCompleteDialog(true);
  };

  const handleCancelJob = (job: Job) => {
    setSelectedJob(job);
    setShowCancelDialog(true);
  };

  return (
    <div className="space-y-6" style={pageStyle}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Jobs</h1>
          <p className="text-muted-foreground mt-1">Manage and track your jobs</p>
        </div>
        <Button onClick={() => setLocation("/dashboard/jobs/new")} style={{ backgroundColor: '#612fff', borderColor: '#612fff' }}>
          <Plus className="mr-2 h-4 w-4" />
          New Job
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jobs Today</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.jobsToday}</div>
            <p className="text-xs text-muted-foreground mt-1">Scheduled for today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jobs This Week</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.jobsThisWeek}</div>
            <p className="text-xs text-muted-foreground mt-1">Next 7 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed This Month</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedThisMonth}</div>
            <p className="text-xs text-muted-foreground mt-1">Jobs finished</p>
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
                placeholder="Search by job #, name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
                        if (statusFilter.length === ALL_JOB_STATUSES.length) {
                          setStatusFilter([]);
                        } else {
                          setStatusFilter([...ALL_JOB_STATUSES]);
                        }
                      }}
                    >
                      <Checkbox checked={statusFilter.length === ALL_JOB_STATUSES.length} />
                      <span className="font-semibold">Select All</span>
                    </button>
                    {ALL_JOB_STATUSES.map((status) => (
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
            <Select value={jobTypeFilter} onValueChange={setJobTypeFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="quote_visit">Quote Visit</SelectItem>
                <SelectItem value="regular_job">Regular Job</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {filteredJobs.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No jobs found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first job to get started
              </p>
              <Button onClick={() => setLocation("/dashboard/jobs/new")} style={{ backgroundColor: '#612fff', borderColor: '#612fff' }}>
                <Plus className="mr-2 h-4 w-4" />
                New Job
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredJobs.map((job) => {
            const contactName = job.contactName || contacts.find((c) => c.id === job.contactId)?.fullName || "Unknown";
            const jobTotal = job.items && job.items.length > 0
              ? job.items.reduce((sum, item) => sum + parseFloat(item.lineTotal || "0"), 0)
              : 0;
            return (
              <Card key={job.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-mono text-sm font-semibold">{job.jobNumber}</h3>
                      <div className="flex gap-2 mt-1">
                        <Badge className={statusColors[job.status]}>
                          {statusLabels[job.status]}
                        </Badge>
                        {job.jobType && (
                          <Badge variant="outline">
                            {job.jobType.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {job.quoteId && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={async () => {
                            try {
                              const res = await fetch(`/api/quotes/${job.quoteId}`);
                              if (res.ok) {
                                const quote = await res.json();
                                if (quote.publicToken) {
                                  window.open(`/quotes/${job.quoteId}/view?token=${quote.publicToken}`, '_blank');
                                }
                              }
                            } catch (err) {
                              console.error('Failed to get quote token:', err);
                            }
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={job.status !== "scheduled" && job.status !== "in_progress" && job.status !== "pending_deposit"}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                              {(job.status === "draft" || job.status === "scheduled" || job.status === "pending_deposit") && (
                                <DropdownMenuItem onClick={() => setLocation(`/dashboard/jobs/${job.id}/edit`)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Job
                                </DropdownMenuItem>
                              )}

                              {/* Deposit Actions - Only for pending_deposit status */}
                  {job.status === 'pending_deposit' && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedJob(job);
                          setShowDepositReminderDialog(true);
                        }}
                      >
                        <Send className="mr-2 h-4 w-4" />
                        Send Deposit Reminder
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedJob(job);
                          setShowWaiveDepositDialog(true);
                        }}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Waive Deposit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedJob(job);
                          const tomorrow = new Date();
                          tomorrow.setDate(tomorrow.getDate() + 7);
                          setExtendedDeadline(tomorrow.toISOString().split('T')[0]);
                          setShowExtendDeadlineDialog(true);
                        }}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        Extend Deadline
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => {
                          setSelectedJob(job);
                          setShowCancelUnpaidDialog(true);
                        }}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Cancel Booking (Unpaid)
                      </DropdownMenuItem>
                    </>
                  )}

                              {job.status === "scheduled" && (
                                <>
                                  <DropdownMenuItem onClick={() => startJobMutation.mutate(job.id)}>
                                    <Play className="mr-2 h-4 w-4" />
                                    Start Job
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleCompleteJob(job)}>
                                    <Check className="mr-2 h-4 w-4" />
                                    Complete Job
                                  </DropdownMenuItem>
                                </>
                              )}
                              {job.status === "in_progress" && (
                                <DropdownMenuItem onClick={() => handleCompleteJob(job)}>
                                  <Check className="mr-2 h-4 w-4" />
                                  Complete Job
                                </DropdownMenuItem>
                              )}
                              {(job.status === "scheduled" || job.status === "in_progress") && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleCancelJob(job)}
                                    className="text-destructive"
                                  >
                                    <X className="mr-2 h-4 w-4" />
                                    Cancel Job
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
                      <span>{contactName}</span>
                    </div>
                    <div className="font-medium text-base">{job.title}</div>
                    {jobTotal > 0 && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold text-lg text-green-600">
                          R {jobTotal.toFixed(2)}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CalendarIcon className="h-4 w-4" />
                      <span>
                        {job.scheduledDate ? formatDateSA(job.scheduledDate) : "Not scheduled"}
                        {job.scheduledStartTime && ` at ${job.scheduledStartTime}`}
                      </span>
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
        <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJobs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-xl font-semibold mb-2">No jobs found</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Create your first job to get started
                      </p>
                      <Button onClick={() => setLocation("/dashboard/jobs/new")} style={{ backgroundColor: '#612fff', borderColor: '#612fff' }}>
                        <Plus className="mr-2 h-4 w-4" />
                        New Job
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredJobs.map((job) => {
                    const contactName = job.contactName || contacts.find((c) => c.id === job.contactId)?.fullName || "Unknown";
                    return (
                      <TableRow key={job.id}>
                        <TableCell className="font-mono text-sm">{job.jobNumber}</TableCell>
                        <TableCell>{contactName}</TableCell>
                        <TableCell className="font-medium">{job.title}</TableCell>
                        <TableCell className="font-semibold">
                          {job.items && job.items.length > 0
                            ? `R ${job.items.reduce((sum, item) => sum + parseFloat(item.lineTotal || "0"), 0).toFixed(2)}`
                            : "—"}
                        </TableCell>
                        <TableCell>
                          {job.jobType ? (
                            <Badge variant="outline">
                              {job.jobType.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {job.scheduledDate ? formatDateSA(job.scheduledDate) : "Not scheduled"}
                          {job.scheduledStartTime && ` at ${job.scheduledStartTime}`}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[job.status]}>
                            {statusLabels[job.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            {job.quoteId && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={async () => {
                                  try {
                                    const res = await fetch(`/api/quotes/${job.quoteId}`);
                                    if (res.ok) {
                                      const quote = await res.json();
                                      if (quote.publicToken) {
                                        window.open(`/quotes/${job.quoteId}/view?token=${quote.publicToken}`, '_blank');
                                      }
                                    }
                                  } catch (err) {
                                    console.error('Failed to get quote token:', err);
                                  }
                                }}
                                title="View Quote"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={job.status !== "scheduled" && job.status !== "in_progress" && job.status !== "pending_deposit"}
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                              {(job.status === "draft" || job.status === "scheduled" || job.status === "pending_deposit") && (
                                <DropdownMenuItem onClick={() => setLocation(`/dashboard/jobs/${job.id}/edit`)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Job
                                </DropdownMenuItem>
                              )}

                              {/* Deposit Actions - Only for pending_deposit status */}
                  {job.status === 'pending_deposit' && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedJob(job);
                          setShowDepositReminderDialog(true);
                        }}
                      >
                        <Send className="mr-2 h-4 w-4" />
                        Send Deposit Reminder
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedJob(job);
                          setShowWaiveDepositDialog(true);
                        }}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Waive Deposit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedJob(job);
                          const tomorrow = new Date();
                          tomorrow.setDate(tomorrow.getDate() + 7);
                          setExtendedDeadline(tomorrow.toISOString().split('T')[0]);
                          setShowExtendDeadlineDialog(true);
                        }}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        Extend Deadline
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => {
                          setSelectedJob(job);
                          setShowCancelUnpaidDialog(true);
                        }}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Cancel Booking (Unpaid)
                      </DropdownMenuItem>
                    </>
                  )}

                              {job.status === "scheduled" && (
                                <>
                                  <DropdownMenuItem onClick={() => startJobMutation.mutate(job.id)}>
                                    <Play className="mr-2 h-4 w-4" />
                                    Start Job
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleCompleteJob(job)}>
                                    <Check className="mr-2 h-4 w-4" />
                                    Complete Job
                                  </DropdownMenuItem>
                                </>
                              )}
                              {job.status === "in_progress" && (
                                <DropdownMenuItem onClick={() => handleCompleteJob(job)}>
                                  <Check className="mr-2 h-4 w-4" />
                                  Complete Job
                                </DropdownMenuItem>
                              )}
                              {(job.status === "scheduled" || job.status === "in_progress") && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleCancelJob(job)}
                                    className="text-destructive"
                                  >
                                    <X className="mr-2 h-4 w-4" />
                                    Cancel Job
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

      {/* Job Details Dialog */}
      {selectedJob && !showCompleteDialog && !showCancelDialog && !showWaiveDepositDialog && !showExtendDeadlineDialog && !showCancelUnpaidDialog && (
        <Dialog open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                Job Details - {selectedJob.jobNumber}
                <Badge className={statusColors[selectedJob.status]}>
                  {statusLabels[selectedJob.status]}
                </Badge>
                {selectedJob.jobType && (
                  <Badge variant={selectedJob.jobType === "quote_visit" ? "secondary" : "outline"}>
                    {selectedJob.jobType === "quote_visit" ? "Quote Visit" : "Regular"}
                  </Badge>
                )}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Customer</Label>
                <p className="text-sm">
                  {selectedJob.contactName || contacts.find((c) => c.id === selectedJob.contactId)?.fullName || "Unknown"}
                </p>
              </div>
              <div>
                <Label>Title</Label>
                <p className="text-sm">{selectedJob.title}</p>
              </div>
              {selectedJob.description && (
                <div>
                  <Label>Description</Label>
                  <p className="text-sm">{selectedJob.description}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Scheduled Date</Label>
                  <p className="text-sm">{selectedJob.scheduledDate ? formatDateSA(selectedJob.scheduledDate) : "Not scheduled"}</p>
                </div>
                <div>
                  <Label>Time</Label>
                  <p className="text-sm">
                    {selectedJob.scheduledStartTime || "Not set"} - {selectedJob.scheduledEndTime || "Not set"}
                  </p>
                </div>
              </div>
              {selectedJob.locationAddress && (
                <div>
                  <Label>Location</Label>
                  <p className="text-sm">{selectedJob.locationAddress}</p>
                </div>
              )}
              {selectedJob.internalNotes && (
                <div>
                  <Label>Internal Notes</Label>
                  <p className="text-sm">{selectedJob.internalNotes}</p>
                </div>
              )}
              {/* Deposit Invoice Section */}
              {selectedJob.status === "pending_deposit" || selectedJob.status === "deposit_paid" ? (
                <div>
                  <Label>Deposit Invoice</Label>
                  <p className="text-sm">
                    {/* This would ideally link to the invoice */}
                    Deposit for Job {selectedJob.jobNumber}
                  </p>
                </div>
              ) : null}
            </div>
            <DialogFooter>
              {selectedJob.status === "scheduled" && (
                <>
                  <Button variant="outline" onClick={() => startJobMutation.mutate(selectedJob.id)}>
                    Start Job
                  </Button>
                  <Button onClick={() => handleCompleteJob(selectedJob)}>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Mark as Completed
                  </Button>
                </>
              )}
              {selectedJob.status === "in_progress" && (
                <Button onClick={() => handleCompleteJob(selectedJob)}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Mark as Completed
                </Button>
              )}
              {selectedJob.status === "completed" && (
                <Button onClick={() => setLocation("/dashboard/invoices")}>
                  Create Invoice
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Complete Job Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Job as Completed</DialogTitle>
            <DialogDescription>
              Complete job {selectedJob?.jobNumber} and create an invoice. You can add completion notes here.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="completionNotes">Completion Notes (Optional)</Label>
              <Textarea
                id="completionNotes"
                placeholder="Add any notes about the job completion..."
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                className="min-h-24"
                data-testid="textarea-completion-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowCompleteDialog(false);
                setCompletionNotes("");
              }}
              data-testid="button-cancel-complete"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedJob) {
                  completeJobMutation.mutate({
                    id: selectedJob.id,
                    notes: completionNotes || undefined,
                  });
                }
              }}
              disabled={completeJobMutation.isPending}
              data-testid="button-submit-complete"
            >
              {completeJobMutation.isPending ? "Completing..." : "Complete Job"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deposit Reminder Dialog */}
      <Dialog open={showDepositReminderDialog} onOpenChange={setShowDepositReminderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Deposit Reminder</DialogTitle>
            <DialogDescription>
              Send a reminder to the customer about their pending deposit payment for job {selectedJob?.jobNumber}.
            </DialogDescription>
          </DialogHeader>
          {selectedJob && selectedJob.depositDeadline && (
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm">
                <strong>Deposit Deadline:</strong> {format(new Date(selectedJob.depositDeadline), "MMM d, yyyy 'at' h:mm a")}
              </p>
              <p className="text-sm mt-1">
                <strong>Reminders Sent:</strong> {selectedJob.depositRemindersSent || 0}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDepositReminderDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => selectedJob && sendDepositReminderMutation.mutate(selectedJob.id)}
              disabled={sendDepositReminderMutation.isPending}
            >
              {sendDepositReminderMutation.isPending ? "Sending..." : "Send Reminder"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Waive Deposit Dialog */}
      <Dialog open={showWaiveDepositDialog} onOpenChange={setShowWaiveDepositDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Waive Deposit Requirement</DialogTitle>
            <DialogDescription>
              Are you sure you want to waive the deposit requirement for job {selectedJob?.jobNumber}? The job will proceed to scheduled status without deposit payment.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <p className="text-sm text-yellow-700">
              <strong>Warning:</strong> This action cannot be undone. The customer will not be charged a deposit.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWaiveDepositDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => selectedJob && waiveDepositMutation.mutate(selectedJob.id)}
              disabled={waiveDepositMutation.isPending}
            >
              {waiveDepositMutation.isPending ? "Waiving..." : "Waive Deposit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Extend Deadline Dialog */}
      <Dialog open={showExtendDeadlineDialog} onOpenChange={setShowExtendDeadlineDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Extend Deposit Deadline</DialogTitle>
            <DialogDescription>
              Set a new deadline for deposit payment for job {selectedJob?.jobNumber}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedJob && selectedJob.depositDeadline && (
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm">
                  <strong>Current Deadline:</strong> {format(new Date(selectedJob.depositDeadline), "MMM d, yyyy 'at' h:mm a")}
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="newDeadline">New Deadline Date</Label>
              <Input
                id="newDeadline"
                type="date"
                value={extendedDeadline}
                onChange={(e) => setExtendedDeadline(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExtendDeadlineDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => selectedJob && extendDeadlineMutation.mutate({
                jobId: selectedJob.id,
                newDeadline: extendedDeadline
              })}
              disabled={extendDeadlineMutation.isPending || !extendedDeadline}
            >
              {extendDeadlineMutation.isPending ? "Extending..." : "Extend Deadline"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Unpaid Booking Dialog */}
      <Dialog open={showCancelUnpaidDialog} onOpenChange={setShowCancelUnpaidDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Unpaid Booking</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel job {selectedJob?.jobNumber} due to unpaid deposit? The customer will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <p className="text-sm text-red-700">
              <strong>Warning:</strong> This will cancel the job and notify the customer that their booking was cancelled due to non-payment of the deposit.
            </p>
          </div>
          {selectedJob && selectedJob.depositDeadline && (
            <div className="bg-muted p-3 rounded-lg mt-2">
              <p className="text-sm">
                <strong>Deposit Deadline:</strong> {format(new Date(selectedJob.depositDeadline), "MMM d, yyyy 'at' h:mm a")}
              </p>
              <p className="text-sm mt-1">
                <strong>Reminders Sent:</strong> {selectedJob.depositRemindersSent || 0}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelUnpaidDialog(false)}>
              Keep Booking
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedJob && cancelUnpaidMutation.mutate(selectedJob.id)}
              disabled={cancelUnpaidMutation.isPending}
            >
              {cancelUnpaidMutation.isPending ? "Cancelling..." : "Cancel Booking"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Job Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Job</DialogTitle>
            <DialogDescription>
              Please provide a reason for cancelling this job.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="cancellationReason">Cancellation Reason *</Label>
              <Textarea
                id="cancellationReason"
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="Reason for cancellation..."
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Back
            </Button>
            <Button
              variant="destructive"
              disabled={!cancellationReason.trim()}
              onClick={() => {
                if (selectedJob && cancellationReason.trim()) {
                  cancelJobMutation.mutate({
                    id: selectedJob.id,
                    reason: cancellationReason,
                  });
                }
              }}
            >
              Cancel Job
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}