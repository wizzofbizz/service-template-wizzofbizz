import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, FileText, Briefcase, DollarSign, MessageSquare, Plus, CheckCircle2, XCircle, Clock, AlertCircle, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { useLocation } from "wouter";
import { formatCurrency } from "@/lib/utils";

interface DashboardStats {
  totalContacts: number;
  leadCount: number;
  customerCount: number;
  pendingQuotes: number;
  jobsThisWeek: number;
  outstandingInvoiceTotal: number;
  overdueInvoiceTotal: number;
  amountLostInPipeline: number;
  collectionRate: number;
  pendingDepositsCount: number;
  pendingDepositsTotal: number;
  atRiskJobsCount: number;
  depositComplianceRate: number;
}

interface WhatsAppUsageStats {
  currentUsage: number;
  monthlyLimit: number;
  percentage: number;
  remaining: number;
}

interface EnrichedActivityLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  contactId: string | null;
  changes: any;
  createdAt: Date;
  contactName: string | null;
  contactEmail: string | null;
  quoteNumber: string | null;
  quoteAmount: string | null;
  quoteStatus: string | null;
  quotePublicToken: string | null;
  jobTitle: string | null;
  jobStatus: string | null;
  invoiceNumber: string | null;
  invoiceAmount: string | null;
  invoiceStatus: string | null;
  serviceName: string | null;
}

export default function DashboardHome() {
  const { user, business, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  const { data: stats, isLoading: statsLoading, error } = useQuery<DashboardStats>({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const response = await fetch("/api/dashboard/stats", {
        credentials: "include",
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
        throw new Error(errorData.message || "Failed to fetch dashboard stats");
      }
      return response.json();
    },
    enabled: !!business && !authLoading,
    retry: 2,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  const { data: whatsappUsage } = useQuery<WhatsAppUsageStats>({
    queryKey: ["/api/whatsapp/usage"],
    enabled: !!business && !authLoading,
    retry: 2,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  const { data: activities } = useQuery<EnrichedActivityLog[]>({
    queryKey: ["/api/activity-log/enriched"],
    enabled: !!business && !authLoading,
    retry: 2,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  // Include quote, job, and invoice activities
  const recentActivities = activities?.filter(
    (activity) => 
      activity.action === 'quote_requested' || 
      activity.action === 'quote_accepted' || 
      activity.action === 'quote_declined' ||
      activity.action === 'quote_sent' ||
      activity.action === 'quote_viewed' ||
      activity.action === 'booking_requested' ||
      activity.action === 'job_started' ||
      activity.action === 'job_completed' ||
      activity.action === 'invoice_sent' ||
      activity.action === 'invoice_viewed' ||
      activity.action === 'payment_received'
  ).slice(0, 8) || [];

  const isLoading = authLoading || statsLoading;

  if (error) {
    console.error("Error loading dashboard stats:", error);
  }

  const StatCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
  }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: any;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">
            Welcome back, {user?.firstName || "there"}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's what's happening with your business today.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-32 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">
            Welcome back, {user?.firstName || "there"}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's what's happening with your business today.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Error Loading Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-red-500">
                {error instanceof Error ? error.message : "Failed to load dashboard stats. Please try again later."}
              </p>
              {!business && (
                <p className="text-sm text-muted-foreground">
                  It looks like you haven't completed business onboarding yet. Please complete your business setup first.
                </p>
              )}
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Retry
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          Welcome back, {user?.firstName || "there"}!
        </h1>
        <p className="text-muted-foreground mt-1">
          Here's what's happening with your business today.
        </p>
      </div>

      {/* Alert Banner for At-Risk Jobs */}
      {stats && stats.atRiskJobsCount > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-900">
                  {stats.atRiskJobsCount} {stats.atRiskJobsCount === 1 ? 'job requires' : 'jobs require'} attention
                </h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Unpaid deposits approaching cancellation threshold
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                className="border-yellow-600 text-yellow-700 hover:bg-yellow-100"
                onClick={() => setLocation("/dashboard/jobs?filter=pending_deposit")}
              >
                View Jobs
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Contacts"
          value={stats?.totalContacts || 0}
          subtitle={`${stats?.leadCount || 0} leads, ${stats?.customerCount || 0} customers`}
          icon={Users}
        />
        <StatCard
          title="Pending Quotes"
          value={stats?.pendingQuotes || 0}
          subtitle="Awaiting customer response"
          icon={FileText}
        />
        <StatCard
          title="Jobs This Week"
          value={stats?.jobsThisWeek || 0}
          subtitle="Scheduled for next 7 days"
          icon={Briefcase}
        />
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Outstanding Invoices
              </CardTitle>
              <DollarSign className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {formatCurrency(stats?.outstandingInvoiceTotal || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Awaiting payment
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Overdue Invoices
              </CardTitle>
              <AlertCircle className="h-5 w-5 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">
                {formatCurrency(stats?.overdueInvoiceTotal || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Payment overdue
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Amount Lost in Pipeline
              </CardTitle>
              <AlertCircle className="h-5 w-5 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">
                {formatCurrency(stats?.amountLostInPipeline || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Quotes not converted to invoices
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Collection Rate
              </CardTitle>
              <TrendingUp className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {stats?.collectionRate || 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                Invoices paid
              </p>
            </CardContent>
          </Card>

          {/* Deposit System KPIs */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Deposits
              </CardTitle>
              <Clock className="h-5 w-5 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">
                {stats?.pendingDepositsCount || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(stats?.pendingDepositsTotal || 0)} total value
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                At Risk Jobs
              </CardTitle>
              <AlertCircle className="h-5 w-5 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">
                {stats?.atRiskJobsCount || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Approaching cancellation
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Deposit Compliance
              </CardTitle>
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {stats?.depositComplianceRate || 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                Paid on time
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                WhatsApp Usage
              </CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {whatsappUsage?.currentUsage || 0} / {whatsappUsage?.monthlyLimit || 1000}
              </div>
              <Progress
                value={whatsappUsage?.percentage || 0}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-2">
                {whatsappUsage?.remaining || 0} messages remaining
              </p>
            </CardContent>
          </Card>
        </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivities.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No recent activities to display.
              </p>
            ) : (
              <div className="space-y-3">
                {recentActivities.map((activity) => {
                  const getActivityIcon = () => {
                    switch (activity.action) {
                      case 'quote_requested':
                        return <Clock className="h-4 w-4 text-blue-600" />;
                      case 'quote_sent':
                        return <FileText className="h-4 w-4 text-purple-600" />;
                      case 'quote_viewed':
                        return <FileText className="h-4 w-4 text-orange-500" />;
                      case 'quote_accepted':
                        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
                      case 'quote_declined':
                        return <XCircle className="h-4 w-4 text-red-600" />;
                      case 'booking_requested':
                        return <Briefcase className="h-4 w-4 text-blue-600" />;
                      case 'job_started':
                        return <Briefcase className="h-4 w-4 text-yellow-600" />;
                      case 'job_completed':
                        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
                      case 'invoice_sent':
                        return <DollarSign className="h-4 w-4 text-blue-600" />;
                      case 'invoice_viewed':
                        return <DollarSign className="h-4 w-4 text-orange-500" />;
                      case 'payment_received':
                        return <DollarSign className="h-4 w-4 text-green-600" />;
                      default:
                        return <FileText className="h-4 w-4 text-gray-600" />;
                    }
                  };

                  const getActivityDescription = () => {
                    const contactName = activity.contactName || 'A customer';
                    const amount = activity.quoteAmount ? formatCurrency(parseFloat(activity.quoteAmount)) : 
                                   activity.invoiceAmount ? formatCurrency(parseFloat(activity.invoiceAmount)) : null;
                    const serviceName = activity.serviceName;
                    
                    switch (activity.action) {
                      case 'quote_requested':
                        return (
                          <span>
                            <span className="font-semibold">{contactName}</span> requested a quote
                            {amount && <span> for <span className="font-semibold text-primary">{amount}</span></span>}
                            {serviceName && <span className="text-muted-foreground"> ({serviceName})</span>}
                          </span>
                        );
                      case 'quote_sent':
                        return (
                          <span>
                            Quote sent to <span className="font-semibold">{contactName}</span>
                            {amount && <span> for <span className="font-semibold text-primary">{amount}</span></span>}
                          </span>
                        );
                      case 'quote_viewed':
                        return (
                          <span>
                            <span className="font-semibold">{contactName}</span> viewed quote
                            {activity.quoteNumber && <span> #{activity.quoteNumber}</span>}
                          </span>
                        );
                      case 'quote_accepted':
                        return (
                          <span>
                            <span className="font-semibold">{contactName}</span> accepted quote
                            {activity.quoteNumber && <span> #{activity.quoteNumber}</span>}
                            {amount && <span> (<span className="text-green-600 font-semibold">{amount}</span>)</span>}
                          </span>
                        );
                      case 'quote_declined':
                        return (
                          <span>
                            <span className="font-semibold">{contactName}</span> declined quote
                            {activity.quoteNumber && <span> #{activity.quoteNumber}</span>}
                          </span>
                        );
                      case 'booking_requested':
                        return (
                          <span>
                            <span className="font-semibold">{contactName}</span> requested a booking
                            {serviceName && <span> for {serviceName}</span>}
                          </span>
                        );
                      case 'job_started':
                        return (
                          <span>
                            Job started for <span className="font-semibold">{contactName}</span>
                            {activity.jobTitle && <span> - {activity.jobTitle}</span>}
                          </span>
                        );
                      case 'job_completed':
                        return (
                          <span>
                            Job completed for <span className="font-semibold">{contactName}</span>
                            {activity.jobTitle && <span> - {activity.jobTitle}</span>}
                          </span>
                        );
                      case 'invoice_sent':
                        return (
                          <span>
                            Invoice {activity.invoiceNumber && <span>#{activity.invoiceNumber}</span>} sent to <span className="font-semibold">{contactName}</span>
                            {amount && <span> for <span className="font-semibold">{amount}</span></span>}
                          </span>
                        );
                      case 'invoice_viewed':
                        return (
                          <span>
                            <span className="font-semibold">{contactName}</span> viewed invoice
                            {activity.invoiceNumber && <span> #{activity.invoiceNumber}</span>}
                          </span>
                        );
                      case 'payment_received':
                        const depositAmount = (activity.changes as any)?.depositAmount;
                        return (
                          <span>
                            Payment received from <span className="font-semibold">{contactName}</span>
                            {depositAmount && <span> (<span className="text-green-600 font-semibold">{formatCurrency(depositAmount)}</span>)</span>}
                          </span>
                        );
                      default:
                        return <span>{activity.action.replace(/_/g, ' ')}</span>;
                    }
                  };

                  const getActivityBadge = () => {
                    switch (activity.action) {
                      case 'quote_requested':
                        return { text: 'requested', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100' };
                      case 'quote_sent':
                        return { text: 'sent', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100' };
                      case 'quote_viewed':
                        return { text: 'viewed', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100' };
                      case 'quote_accepted':
                        return { text: 'accepted', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' };
                      case 'quote_declined':
                        return { text: 'declined', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100' };
                      case 'booking_requested':
                        return { text: 'booking', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100' };
                      case 'job_started':
                        return { text: 'started', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100' };
                      case 'job_completed':
                        return { text: 'completed', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' };
                      case 'invoice_sent':
                        return { text: 'invoice', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100' };
                      case 'invoice_viewed':
                        return { text: 'viewed', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100' };
                      case 'payment_received':
                        return { text: 'paid', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' };
                      default:
                        return { text: activity.action.split('_').pop() || '', color: 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-100' };
                    }
                  };

                  const handleClick = async (e: React.MouseEvent) => {
                    e.preventDefault();
                    if (!activity.entityId) return;

                    try {
                      if (activity.entityType === 'quote' && activity.quotePublicToken) {
                        window.open(`/quotes/${activity.entityId}/view?token=${activity.quotePublicToken}`, '_blank');
                      } else if (activity.entityType === 'job') {
                        setLocation(`/dashboard/jobs/${activity.entityId}`);
                      } else if (activity.entityType === 'invoice') {
                        setLocation(`/dashboard/invoices/${activity.entityId}`);
                      } else if (activity.entityType === 'quote') {
                        const res = await fetch(`/api/quotes/${activity.entityId}`, { credentials: 'include' });
                        if (res.ok) {
                          const quote = await res.json();
                          if (quote.publicToken) {
                            window.open(`/quotes/${activity.entityId}/view?token=${quote.publicToken}`, '_blank');
                          }
                        }
                      }
                    } catch (err) {
                      console.error('Failed to navigate:', err);
                    }
                  };

                  const badge = getActivityBadge();

                  return (
                    <div 
                      key={activity.id} 
                      className="flex items-start gap-3 pb-3 border-b last:border-b-0 last:pb-0 cursor-pointer hover-elevate -mx-2 px-2 py-2 rounded-md transition-colors"
                      onClick={handleClick}
                      data-testid={`activity-item-${activity.id}`}
                    >
                      <div className="mt-0.5 flex-shrink-0">
                        {getActivityIcon()}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm leading-snug">{getActivityDescription()}</p>
                          <Badge className={`${badge.color} text-xs flex-shrink-0`}>
                            {badge.text}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            <Button onClick={() => setLocation("/dashboard/quotes/new")} className="justify-start" style={{ backgroundColor: 'hsl(var(--brand))', borderColor: 'hsl(var(--brand))' }}>
              <Plus className="h-4 w-4 mr-2" />
              Create New Quote
            </Button>
            <Button onClick={() => setLocation("/dashboard/jobs/new")} variant="outline" className="justify-start">
              <Plus className="h-4 w-4 mr-2" />
              Schedule New Job
            </Button>
            <Button onClick={() => setLocation("/dashboard/contacts")} variant="outline" className="justify-start">
              <Users className="h-4 w-4 mr-2" />
              Add Contact
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* WhatsApp Integration Status */}
      {business?.whatsappProvider && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              💬 WhatsApp Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Provider</span>
                <span className="text-sm font-medium capitalize">{business.whatsappProvider}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Monthly Usage</span>
                <span className="text-sm font-medium">
                  {business.whatsappCurrentUsage || 0} / {business.whatsappMonthlyLimit || 1000}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full" 
                  style={{ 
                    width: `${Math.min(((business.whatsappCurrentUsage || 0) / (business.whatsappMonthlyLimit || 1000)) * 100, 100)}%` 
                  }}
                />
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => setLocation("/dashboard/whatsapp-analytics")}
              >
                View Analytics
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  );
}