
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ContactDialog } from "@/components/contacts/ContactDialog";
import {
  Mail,
  Phone,
  MapPin,
  MessageSquare,
  FileText,
  Calendar,
  DollarSign,
  Edit,
  MoreVertical,
  Send,
  PhoneCall,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Package,
  Receipt,
  Eye,
  Plus,
  PhoneIncoming,
  PhoneOutgoing,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDateSA } from "@/lib/date-utils";
import type { Contact, ActivityLog } from "@shared/schema";

interface ContactWithDetails extends Contact {
  totalQuotes?: number;
  totalJobs?: number;
  totalRevenue?: number;
  lastActivity?: string;
}

interface ActivityWithMeta extends ActivityLog {
  entityName?: string;
  details?: any;
}

export default function Contact360Page() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [showActivityDialog, setShowActivityDialog] = useState(false);
  const [activityType, setActivityType] = useState<"call_inbound" | "call_outbound">("call_inbound");
  const [activityNotes, setActivityNotes] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Fetch contact details
  const { data: contact, isLoading: contactLoading } = useQuery<ContactWithDetails>({
    queryKey: [`/api/contacts/${id}`],
  });

  // Fetch activity logs for this contact
  const { data: activities = [], isLoading: activitiesLoading } = useQuery<ActivityWithMeta[]>({
    queryKey: [`/api/contacts/${id}/activities`],
    enabled: !!id,
    queryFn: async () => {
      const res = await fetch(`/api/activity-log?contactId=${id}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch activities");
      return res.json();
    },
  });

  // Mutation for creating manual activity
  const createActivityMutation = useMutation({
    mutationFn: async (data: { action: string; notes: string }) => {
      const res = await fetch(`/api/activity-log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          contactId: id,
          action: data.action,
          entityType: "contact",
          entityId: id,
          changes: { notes: data.notes },
        }),
      });
      if (!res.ok) throw new Error("Failed to create activity");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/contacts/${id}/activities`] });
      setShowActivityDialog(false);
      setActivityNotes("");
      toast({
        title: "Activity logged",
        description: "Activity has been successfully logged.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to log activity. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSaveActivity = () => {
    if (!activityNotes.trim()) {
      toast({
        title: "Error",
        description: "Please enter notes for this activity.",
        variant: "destructive",
      });
      return;
    }
    createActivityMutation.mutate({
      action: activityType,
      notes: activityNotes,
    });
  };

  if (contactLoading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <Skeleton className="h-48 w-full" />
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-48 md:col-span-2" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] p-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Contact not found</h3>
        <Button onClick={() => setLocation("/dashboard/contacts")}>
          Back to Contacts
        </Button>
      </div>
    );
  }

  // Group activities by type for timeline
  const timelineEvents = activities
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 50);

  // Calculate lifecycle milestones
  const milestones = [
    {
      label: "Contact Created",
      date: contact.createdAt,
      icon: CheckCircle2,
      status: "completed",
      details: `Added as ${contact.contactType}`,
    },
    ...(activities.find((a) => a.action === "quote_sent")
      ? [
          {
            label: "Quote Sent",
            date: activities.find((a) => a.action === "quote_sent")?.createdAt,
            icon: Send,
            status: "completed",
            details: activities.find((a) => a.action === "quote_sent")?.changes,
          },
        ]
      : []),
    ...(activities.find((a) => a.action === "quote_accepted")
      ? [
          {
            label: "Quote Accepted",
            date: activities.find((a) => a.action === "quote_accepted")?.createdAt,
            icon: CheckCircle2,
            status: "completed",
            details: "Customer accepted quote",
          },
        ]
      : []),
    ...(activities.find((a) => a.action === "job_completed")
      ? [
          {
            label: "Job Completed",
            date: activities.find((a) => a.action === "job_completed")?.createdAt,
            icon: Package,
            status: "completed",
            details: activities.find((a) => a.action === "job_completed")?.changes,
          },
        ]
      : []),
    ...(activities.find((a) => a.action === "invoice_sent")
      ? [
          {
            label: "Invoice Issued",
            date: activities.find((a) => a.action === "invoice_sent")?.createdAt,
            icon: Receipt,
            status: "completed",
            details: "Invoice sent to customer",
          },
        ]
      : []),
  ];

  const getActivityIcon = (action: string) => {
    const iconMap: Record<string, any> = {
      quote_requested: FileText,
      quote_sent: Send,
      quote_viewed: Eye,
      quote_accepted: CheckCircle2,
      quote_declined: AlertCircle,
      booking_requested: Calendar,
      booking_rescheduled: Clock,
      job_started: TrendingUp,
      job_completed: CheckCircle2,
      invoice_sent: Receipt,
      invoice_viewed: Eye,
      invoice_paid: DollarSign,
      email_sent: Mail,
      whatsapp_sent: MessageSquare,
      whatsapp_delivered: CheckCircle2,
      whatsapp_read: Eye,
      call_inbound: PhoneIncoming,
      call_outbound: PhoneOutgoing,
    };
    return iconMap[action] || AlertCircle;
  };

  const getActivityColor = (action: string) => {
    if (action.includes("completed") || action.includes("accepted") || action.includes("paid")) {
      return "text-green-600";
    }
    if (action.includes("declined") || action.includes("failed")) {
      return "text-red-600";
    }
    if (action.includes("viewed") || action.includes("delivered")) {
      return "text-blue-600";
    }
    return "text-gray-600";
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header Contact Details Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold mb-2">{contact.fullName}</h1>
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <Badge className="capitalize">
                    {contact.contactType.replace("_", " ")}
                  </Badge>
                  {contact.leadSource && (
                    <Badge variant="outline">{contact.leadSource}</Badge>
                  )}
                  <span className="text-sm text-muted-foreground">
                    Customer since {formatDateSA(contact.createdAt)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {contact.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="font-medium truncate">{contact.email}</p>
                    </div>
                  </div>
                )}

                {contact.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="font-medium">{contact.phone}</p>
                    </div>
                  </div>
                )}

                {contact.address && (
                  <div className="flex items-center gap-3 sm:col-span-2">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Address</p>
                      <p className="font-medium">{contact.address}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Preferred Channel</p>
                    <p className="font-medium capitalize">
                      {contact.preferredChannel || "Email"}
                    </p>
                  </div>
                </div>

                {contact.whatsappOptIn && (
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      WhatsApp Opted In
                    </Badge>
                  </div>
                )}
              </div>

              {contact.notes && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Notes</p>
                    <p className="text-sm">{contact.notes}</p>
                  </div>
                </>
              )}
            </div>

            <div className="flex md:flex-col gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 md:flex-initial"
                onClick={() => setIsEditDialogOpen(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Lifecycle Journey */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Customer Lifecycle Journey
              </CardTitle>
              <CardDescription>
                Track key milestones in the customer relationship
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative max-w-2xl mx-auto">
                {milestones.map((milestone, index) => {
                  const Icon = milestone.icon;
                  const isLast = index === milestones.length - 1;
                  
                  return (
                    <div key={index} className="relative flex flex-col items-center">
                      {/* Timeline line - before the circle */}
                      {index > 0 && (
                        <div className="absolute top-0 w-px h-8 bg-green-300" style={{ top: '-2rem' }} />
                      )}
                      
                      {/* Milestone Circle */}
                      <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500 text-white shadow-md mb-3">
                        <Icon className="h-4 w-4" />
                      </div>
                      
                      {/* Milestone Card */}
                      <div className="w-full max-w-md p-4 rounded-lg border bg-white hover:bg-gray-50 transition-colors shadow-sm mb-2">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <h4 className="font-semibold text-sm">{milestone.label}</h4>
                            <Badge variant="outline" className="bg-green-50 text-green-700 text-xs">
                              {milestone.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-1">
                            {milestone.date ? formatDateSA(milestone.date) : "Pending"}
                          </p>
                          {milestone.details && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {typeof milestone.details === "string"
                                ? milestone.details
                                : JSON.stringify(milestone.details)}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {/* Timeline line - after the circle */}
                      {!isLast && (
                        <div className="w-px h-8 bg-green-300 mb-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activities */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Activities</CardTitle>
                  <CardDescription>
                    All interactions and events for this contact
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowActivityDialog(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Activity
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                {activitiesLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : timelineEvents.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No activity recorded yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {timelineEvents.map((activity, idx) => {
                      const Icon = getActivityIcon(activity.action);
                      const isLast = idx === timelineEvents.length - 1;
                      
                      return (
                        <div key={activity.id} className="relative flex gap-3">
                          {/* Timeline line */}
                          {!isLast && (
                            <div className="absolute left-4 top-10 bottom-0 w-px bg-gray-200" />
                          )}
                          
                          {/* Icon */}
                          <div className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white border-2 ${getActivityColor(activity.action)}`}>
                            <Icon className="h-4 w-4" />
                          </div>

                          {/* Content */}
                          <div className="flex-1 pb-4 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm">
                                  {activity.action.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDateSA(activity.createdAt)}
                                </p>
                              </div>
                              <Badge variant="outline" className="text-xs shrink-0">
                                {activity.entityType}
                              </Badge>
                            </div>
                            {activity.changes && (
                              <details className="text-xs text-muted-foreground mt-1">
                                <summary className="cursor-pointer hover:text-foreground">
                                  View details
                                </summary>
                                <pre className="mt-2 bg-gray-50 p-2 rounded text-xs overflow-x-auto">
                                  {JSON.stringify(activity.changes, null, 2)}
                                </pre>
                              </details>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Quick Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setLocation(`/dashboard/quotes/new?contactId=${id}`)}
              >
                <Send className="h-4 w-4 mr-2" />
                Create Quote
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setLocation(`/dashboard/jobs/new?contactId=${id}`)}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Job
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setLocation(`/dashboard/invoices/new?contactId=${id}`)}
              >
                <Receipt className="h-4 w-4 mr-2" />
                Create Invoice
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mobile Quick Actions Bar - Sticky Bottom */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 z-20">
        <div className="grid grid-cols-3 gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-col h-auto py-3"
            onClick={() => setLocation(`/dashboard/quotes/new?contactId=${id}`)}
          >
            <Send className="h-5 w-5 mb-1" />
            <span className="text-xs">Quote</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-col h-auto py-3"
            onClick={() => setLocation(`/dashboard/jobs/new?contactId=${id}`)}
          >
            <Calendar className="h-5 w-5 mb-1" />
            <span className="text-xs">Job</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-col h-auto py-3"
            onClick={() => setLocation(`/dashboard/invoices/new?contactId=${id}`)}
          >
            <Receipt className="h-5 w-5 mb-1" />
            <span className="text-xs">Invoice</span>
          </Button>
        </div>
      </div>

      {/* Manual Activity Dialog */}
      <Dialog open={showActivityDialog} onOpenChange={setShowActivityDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Log Activity</DialogTitle>
            <DialogDescription>
              Record a phone call or interaction with this contact.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Activity Type</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={activityType === "call_inbound" ? "default" : "outline"}
                  className="justify-start"
                  onClick={() => setActivityType("call_inbound")}
                >
                  <PhoneIncoming className="h-4 w-4 mr-2" />
                  Inbound Call
                </Button>
                <Button
                  type="button"
                  variant={activityType === "call_outbound" ? "default" : "outline"}
                  className="justify-start"
                  onClick={() => setActivityType("call_outbound")}
                >
                  <PhoneOutgoing className="h-4 w-4 mr-2" />
                  Outbound Call
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {activityType === "call_inbound" 
                  ? "Customer called your business" 
                  : "You called the customer"}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="activity-notes">Call Notes</Label>
              <Textarea
                id="activity-notes"
                placeholder="Enter notes about this call..."
                value={activityNotes}
                onChange={(e) => setActivityNotes(e.target.value)}
                rows={5}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Date and time will be automatically recorded as {new Date().toLocaleString('en-ZA', { 
                  dateStyle: 'medium', 
                  timeStyle: 'short' 
                })}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowActivityDialog(false);
                setActivityNotes("");
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveActivity}
              disabled={createActivityMutation.isPending}
            >
              {createActivityMutation.isPending ? "Saving..." : "Save Activity"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contact Edit Dialog */}
      <ContactDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        contact={contact}
      />
    </div>
  );
}
