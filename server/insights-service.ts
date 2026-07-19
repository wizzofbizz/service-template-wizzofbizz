
import { storage } from "./storage";
import type { Business } from "../shared/schema";

interface DateRange {
  startDate: Date;
  endDate: Date;
}

interface KPIMetric {
  value: number;
  change: number;
  trend: 'up' | 'down' | 'neutral';
}

interface FinancialOverview {
  totalRevenue: KPIMetric;
  outstanding: KPIMetric;
  paidInvoices: KPIMetric;
  overdue: KPIMetric;
}

interface RevenueTimelineData {
  month: string;
  revenue: number;
  expenses: number;
}

interface PaymentMethodData {
  method: string;
  value: number;
  count: number;
}

interface CashflowTrendData {
  date: string;
  cashflow: number;
}

export class InsightsService {
  static getDateRange(period: string): DateRange {
    const now = new Date();
    const endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);
    
    let startDate = new Date(now);
    
    switch (period) {
      case '7days':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30days':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90days':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }
    
    startDate.setHours(0, 0, 0, 0);
    return { startDate, endDate };
  }

  static getPreviousDateRange(startDate: Date, endDate: Date): DateRange {
    const duration = endDate.getTime() - startDate.getTime();
    const previousEndDate = new Date(startDate.getTime() - 1);
    const previousStartDate = new Date(startDate.getTime() - duration);
    
    return {
      startDate: previousStartDate,
      endDate: previousEndDate
    };
  }

  static calculatePercentageChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  }

  static async getFinancialOverview(businessId: string, period: string = '30days'): Promise<FinancialOverview> {
    const { startDate, endDate } = this.getDateRange(period);
    const previousRange = this.getPreviousDateRange(startDate, endDate);
    
    const invoices = await storage.getInvoicesByBusinessId(businessId);
    
    // Current period metrics
    const currentInvoices = invoices.filter(inv => {
      const createdAt = inv.createdAt ? new Date(inv.createdAt) : null;
      return createdAt && createdAt >= startDate && createdAt <= endDate;
    });
    
    // Previous period metrics
    const previousInvoices = invoices.filter(inv => {
      const createdAt = inv.createdAt ? new Date(inv.createdAt) : null;
      return createdAt && createdAt >= previousRange.startDate && createdAt <= previousRange.endDate;
    });
    
    const totalRevenue = currentInvoices
      .filter(i => i.status === 'paid')
      .reduce((sum, i) => sum + parseFloat(i.totalAmount), 0);
    
    const prevTotalRevenue = previousInvoices
      .filter(i => i.status === 'paid')
      .reduce((sum, i) => sum + parseFloat(i.totalAmount), 0);
    
    const outstanding = currentInvoices
      .filter(i => i.status === 'sent' || i.status === 'overdue')
      .reduce((sum, i) => sum + parseFloat(i.totalAmount), 0);
    
    const prevOutstanding = previousInvoices
      .filter(i => i.status === 'sent' || i.status === 'overdue')
      .reduce((sum, i) => sum + parseFloat(i.totalAmount), 0);
    
    const paidCount = currentInvoices.filter(i => i.status === 'paid').length;
    const prevPaidCount = previousInvoices.filter(i => i.status === 'paid').length;
    
    const overdue = currentInvoices
      .filter(i => i.status === 'overdue')
      .reduce((sum, i) => sum + parseFloat(i.totalAmount), 0);
    
    const prevOverdue = previousInvoices
      .filter(i => i.status === 'overdue')
      .reduce((sum, i) => sum + parseFloat(i.totalAmount), 0);
    
    return {
      totalRevenue: {
        value: totalRevenue,
        change: this.calculatePercentageChange(totalRevenue, prevTotalRevenue),
        trend: totalRevenue >= prevTotalRevenue ? 'up' : 'down'
      },
      outstanding: {
        value: outstanding,
        change: this.calculatePercentageChange(outstanding, prevOutstanding),
        trend: outstanding <= prevOutstanding ? 'up' : 'down'
      },
      paidInvoices: {
        value: paidCount,
        change: this.calculatePercentageChange(paidCount, prevPaidCount),
        trend: paidCount >= prevPaidCount ? 'up' : 'down'
      },
      overdue: {
        value: overdue,
        change: this.calculatePercentageChange(overdue, prevOverdue),
        trend: overdue <= prevOverdue ? 'up' : 'down'
      }
    };
  }

  static async getRevenueTimeline(businessId: string, period: string = '90days'): Promise<RevenueTimelineData[]> {
    const { startDate, endDate } = this.getDateRange(period);
    const invoices = await storage.getInvoicesByBusinessId(businessId);
    const jobs = await storage.getJobsByBusinessId(businessId);
    
    const monthlyData = new Map<string, { revenue: number; expenses: number }>();
    
    // Calculate revenue from paid invoices
    invoices
      .filter(inv => {
        const paidAt = inv.paidAt ? new Date(inv.paidAt) : null;
        return paidAt && paidAt >= startDate && paidAt <= endDate && inv.status === 'paid';
      })
      .forEach(inv => {
        const month = new Date(inv.paidAt!).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        const current = monthlyData.get(month) || { revenue: 0, expenses: 0 };
        current.revenue += parseFloat(inv.totalAmount);
        monthlyData.set(month, current);
      });
    
    // Estimate expenses from job costs (if available)
    jobs
      .filter(job => {
        const completedAt = job.actualEndTime ? new Date(job.actualEndTime) : null;
        return completedAt && completedAt >= startDate && completedAt <= endDate;
      })
      .forEach(job => {
        const month = new Date(job.actualEndTime!).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        const current = monthlyData.get(month) || { revenue: 0, expenses: 0 };
        // Estimate expenses as 40% of job total
        const jobTotal = job.totalAmount ? parseFloat(job.totalAmount) : 0;
        current.expenses += jobTotal * 0.4;
        monthlyData.set(month, current);
      });
    
    return Array.from(monthlyData.entries())
      .map(([month, data]) => ({
        month,
        revenue: Math.round(data.revenue),
        expenses: Math.round(data.expenses)
      }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
  }

  static async getPaymentMethodDistribution(businessId: string, period: string = '30days'): Promise<PaymentMethodData[]> {
    const { startDate, endDate } = this.getDateRange(period);
    const invoices = await storage.getInvoicesByBusinessId(businessId);
    
    const methodData = new Map<string, { value: number; count: number }>();
    
    invoices
      .filter(inv => {
        const paidAt = inv.paidAt ? new Date(inv.paidAt) : null;
        return paidAt && paidAt >= startDate && paidAt <= endDate && inv.status === 'paid';
      })
      .forEach(inv => {
        const method = inv.paymentMethod || 'other';
        const current = methodData.get(method) || { value: 0, count: 0 };
        current.value += parseFloat(inv.totalAmount);
        current.count += 1;
        methodData.set(method, current);
      });
    
    const methodLabels: Record<string, string> = {
      cash: 'Cash',
      card: 'Card',
      bank_transfer: 'Bank Transfer',
      other: 'Other'
    };
    
    return Array.from(methodData.entries())
      .map(([method, data]) => ({
        method: methodLabels[method] || method,
        value: Math.round(data.value),
        count: data.count
      }))
      .sort((a, b) => b.value - a.value);
  }

  static async getCashflowTrend(businessId: string, period: string = '30days'): Promise<CashflowTrendData[]> {
    const { startDate, endDate } = this.getDateRange(period);
    const invoices = await storage.getInvoicesByBusinessId(businessId);
    
    const dailyData = new Map<string, number>();
    let runningTotal = 0;
    
    // Get all paid invoices in period
    const paidInvoices = invoices
      .filter(inv => {
        const paidAt = inv.paidAt ? new Date(inv.paidAt) : null;
        return paidAt && paidAt >= startDate && paidAt <= endDate && inv.status === 'paid';
      })
      .sort((a, b) => new Date(a.paidAt!).getTime() - new Date(b.paidAt!).getTime());
    
    // Generate daily cashflow
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      // Add payments for this day
      const dayPayments = paidInvoices
        .filter(inv => {
          const paidDate = new Date(inv.paidAt!);
          return paidDate.toDateString() === currentDate.toDateString();
        })
        .reduce((sum, inv) => sum + parseFloat(inv.totalAmount), 0);
      
      runningTotal += dayPayments;
      dailyData.set(dateStr, runningTotal);
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return Array.from(dailyData.entries())
      .map(([date, cashflow]) => ({
        date,
        cashflow: Math.round(cashflow)
      }));
  }

  static async getAgedReceivables(businessId: string): Promise<{
    buckets: Array<{ bucket: string; total: number; count: number; clients: Array<{ clientName: string; amount: number; daysOverdue: number; invoiceNumber: string }> }>;
    totalOutstanding: number;
  }> {
    const invoices = await storage.getInvoicesByBusinessId(businessId);
    const contacts = await storage.getContactsByBusinessId(businessId);
    
    // Get outstanding/overdue invoices
    const outstandingInvoices = invoices.filter(inv => 
      inv.status === 'sent' || inv.status === 'overdue'
    );
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Calculate aging for each invoice
    const agedInvoices = outstandingInvoices.map(inv => {
      const dueDate = inv.dueDate ? new Date(inv.dueDate) : null;
      const daysOverdue = dueDate 
        ? Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0;
      
      const contact = contacts.find(c => c.id === inv.contactId);
      
      return {
        invoiceNumber: inv.invoiceNumber,
        clientId: inv.contactId,
        clientName: contact?.fullName || 'Unknown',
        amount: parseFloat(inv.totalAmount),
        daysOverdue: Math.max(0, daysOverdue),
        bucket: this.getAgingBucket(Math.max(0, daysOverdue))
      };
    });
    
    // Group by buckets
    const buckets = [
      { bucket: '0-30 days', total: 0, count: 0, clients: [] as any[] },
      { bucket: '31-60 days', total: 0, count: 0, clients: [] as any[] },
      { bucket: '61-90 days', total: 0, count: 0, clients: [] as any[] },
      { bucket: '90+ days', total: 0, count: 0, clients: [] as any[] }
    ];
    
    agedInvoices.forEach(inv => {
      const bucketIndex = ['0-30 days', '31-60 days', '61-90 days', '90+ days'].indexOf(inv.bucket);
      if (bucketIndex >= 0) {
        buckets[bucketIndex].total += inv.amount;
        buckets[bucketIndex].count += 1;
        buckets[bucketIndex].clients.push({
          clientName: inv.clientName,
          amount: inv.amount,
          daysOverdue: inv.daysOverdue,
          invoiceNumber: inv.invoiceNumber
        });
      }
    });
    
    // Sort clients within each bucket by amount descending
    buckets.forEach(bucket => {
      bucket.clients.sort((a, b) => b.amount - a.amount);
      bucket.total = Math.round(bucket.total);
    });
    
    const totalOutstanding = buckets.reduce((sum, b) => sum + b.total, 0);
    
    return {
      buckets,
      totalOutstanding
    };
  }
  
  private static getAgingBucket(daysOverdue: number): string {
    if (daysOverdue <= 30) return '0-30 days';
    if (daysOverdue <= 60) return '31-60 days';
    if (daysOverdue <= 90) return '61-90 days';
    return '90+ days';
  }

  /**
   * Receivables Summary
   * Shows total outstanding balances and top clients
   */
  static async getReceivables(businessId: string): Promise<{
    totalOutstanding: number;
    totalClients: number;
    topClients: Array<{
      clientName: string;
      balance: number;
      lateAmount: number;
      invoiceCount: number;
    }>;
  }> {
    const invoices = await storage.getInvoicesByBusinessId(businessId);
    const contacts = await storage.getContactsByBusinessId(businessId);
    
    // Get outstanding invoices (sent or overdue, not paid/cancelled)
    const outstandingInvoices = invoices.filter(inv => 
      inv.status === 'sent' || inv.status === 'overdue'
    );
    
    const totalOutstanding = outstandingInvoices.reduce(
      (sum, inv) => sum + parseFloat(inv.totalAmount), 
      0
    );
    
    // Group by client
    const clientBalances = new Map<string, {
      clientName: string;
      balance: number;
      lateAmount: number;
      invoiceCount: number;
    }>();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    outstandingInvoices.forEach(inv => {
      const contact = contacts.find(c => c.id === inv.contactId);
      const clientName = contact?.fullName || 'Unknown';
      const amount = parseFloat(inv.totalAmount);
      
      // Calculate if late
      const dueDate = inv.dueDate ? new Date(inv.dueDate) : null;
      const isLate = dueDate && dueDate < today;
      const lateAmount = isLate ? amount : 0;
      
      const current = clientBalances.get(inv.contactId) || {
        clientName,
        balance: 0,
        lateAmount: 0,
        invoiceCount: 0,
      };
      
      current.balance += amount;
      current.lateAmount += lateAmount;
      current.invoiceCount += 1;
      
      clientBalances.set(inv.contactId, current);
    });
    
    // Get top 3 clients by balance
    const topClients = Array.from(clientBalances.values())
      .sort((a, b) => b.balance - a.balance)
      .slice(0, 3);
    
    return {
      totalOutstanding: Math.round(totalOutstanding),
      totalClients: clientBalances.size,
      topClients: topClients.map(c => ({
        ...c,
        balance: Math.round(c.balance),
        lateAmount: Math.round(c.lateAmount),
      })),
    };
  }

  /**
   * Projected Income
   * Shows invoices due in next 7 and 30 days
   * Also calculates average payment time
   */
  static async getProjectedIncome(businessId: string): Promise<{
    dueToday: number;
    dueNext7Days: number;
    dueNext30Days: number;
    invoicesDueToday: number;
    invoicesDue7Days: number;
    invoicesDue30Days: number;
    averagePaymentTimeDays: number;
    averagePaymentTimeChange: number;
  }> {
    const invoices = await storage.getInvoicesByBusinessId(businessId);
    
    // Only consider unpaid invoices (sent or overdue)
    const unpaidInvoices = invoices.filter(inv => 
      inv.status === 'sent' || inv.status === 'overdue'
    );
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);
    
    const next7Days = new Date(today);
    next7Days.setDate(next7Days.getDate() + 7);
    next7Days.setHours(23, 59, 59, 999);
    
    const next30Days = new Date(today);
    next30Days.setDate(next30Days.getDate() + 30);
    next30Days.setHours(23, 59, 59, 999);
    
    // Calculate amounts and counts
    let dueToday = 0;
    let dueNext7Days = 0;
    let dueNext30Days = 0;
    let invoicesDueToday = 0;
    let invoicesDue7Days = 0;
    let invoicesDue30Days = 0;
    
    unpaidInvoices.forEach(inv => {
      if (!inv.dueDate) return;
      
      const dueDate = new Date(inv.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      const amount = parseFloat(inv.totalAmount);
      
      // Due today
      if (dueDate <= todayEnd) {
        dueToday += amount;
        invoicesDueToday += 1;
      }
      
      // Due in next 7 days (including today)
      if (dueDate <= next7Days) {
        dueNext7Days += amount;
        invoicesDue7Days += 1;
      }
      
      // Due in next 30 days (including today)
      if (dueDate <= next30Days) {
        dueNext30Days += amount;
        invoicesDue30Days += 1;
      }
    });
    
    // Calculate average payment time for invoices paid in last 30 days
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentlyPaidInvoices = invoices.filter(inv => 
      inv.status === 'paid' && 
      inv.paidAt && 
      inv.createdAt &&
      new Date(inv.paidAt) >= thirtyDaysAgo
    );
    
    let averagePaymentTimeDays = 0;
    if (recentlyPaidInvoices.length > 0) {
      const totalDays = recentlyPaidInvoices.reduce((sum, inv) => {
        const issued = new Date(inv.createdAt!).getTime();
        const paid = new Date(inv.paidAt!).getTime();
        const days = (paid - issued) / (1000 * 60 * 60 * 24);
        return sum + days;
      }, 0);
      averagePaymentTimeDays = Math.round(totalDays / recentlyPaidInvoices.length);
    }
    
    // Calculate previous period (30-60 days ago) for comparison
    const sixtyDaysAgo = new Date(today);
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    
    const previousPeriodInvoices = invoices.filter(inv => 
      inv.status === 'paid' && 
      inv.paidAt && 
      inv.createdAt &&
      new Date(inv.paidAt) >= sixtyDaysAgo &&
      new Date(inv.paidAt) < thirtyDaysAgo
    );
    
    let previousAveragePaymentTimeDays = 0;
    if (previousPeriodInvoices.length > 0) {
      const totalDays = previousPeriodInvoices.reduce((sum, inv) => {
        const issued = new Date(inv.createdAt!).getTime();
        const paid = new Date(inv.paidAt!).getTime();
        const days = (paid - issued) / (1000 * 60 * 60 * 24);
        return sum + days;
      }, 0);
      previousAveragePaymentTimeDays = totalDays / previousPeriodInvoices.length;
    }
    
    const averagePaymentTimeChange = this.calculatePercentageChange(
      averagePaymentTimeDays,
      previousAveragePaymentTimeDays
    );
    
    return {
      dueToday: Math.round(dueToday),
      dueNext7Days: Math.round(dueNext7Days),
      dueNext30Days: Math.round(dueNext30Days),
      invoicesDueToday,
      invoicesDue7Days,
      invoicesDue30Days,
      averagePaymentTimeDays,
      averagePaymentTimeChange,
    };
  }

  /**
   * Lead Conversion Timing Metrics
   * Calculates average time for key conversion milestones
   */
  static async getLeadConversionTimings(businessId: string, period: string = '30days'): Promise<{
    timeToAcceptQuote: {
      averageDays: number;
      totalQuotes: number;
      changePercent: number;
    };
    quoteToInvoiceCycle: {
      averageDays: number;
      totalConversions: number;
      changePercent: number;
    };
  }> {
    const { startDate, endDate } = this.getDateRange(period);
    const previousRange = this.getPreviousDateRange(startDate, endDate);

    // Get all data
    const allQuotes = await storage.getQuotesByBusinessId(businessId);
    const jobs = await storage.getJobsByBusinessId(businessId);
    const invoices = await storage.getInvoicesByBusinessId(businessId);

    // === TIME TO ACCEPT QUOTE ===
    // Current period: quotes created and accepted in this period
    const acceptedQuotesCurrentPeriod = allQuotes.filter(q => {
      if (!q.createdAt || !q.acceptedAt) return false;
      const createdAt = new Date(q.createdAt);
      const acceptedAt = new Date(q.acceptedAt);
      return createdAt >= startDate && createdAt <= endDate && acceptedAt >= startDate && acceptedAt <= endDate;
    });

    const timeToAcceptCurrent = acceptedQuotesCurrentPeriod.map(q => {
      const created = new Date(q.createdAt!).getTime();
      const accepted = new Date(q.acceptedAt!).getTime();
      return (accepted - created) / (1000 * 60 * 60 * 24); // days
    });

    const avgTimeToAcceptCurrent = timeToAcceptCurrent.length > 0
      ? timeToAcceptCurrent.reduce((sum, days) => sum + days, 0) / timeToAcceptCurrent.length
      : 0;

    // Previous period
    const acceptedQuotesPreviousPeriod = allQuotes.filter(q => {
      if (!q.createdAt || !q.acceptedAt) return false;
      const createdAt = new Date(q.createdAt);
      const acceptedAt = new Date(q.acceptedAt);
      return createdAt >= previousRange.startDate && createdAt <= previousRange.endDate &&
             acceptedAt >= previousRange.startDate && acceptedAt <= previousRange.endDate;
    });

    const timeToAcceptPrevious = acceptedQuotesPreviousPeriod.map(q => {
      const created = new Date(q.createdAt!).getTime();
      const accepted = new Date(q.acceptedAt!).getTime();
      return (accepted - created) / (1000 * 60 * 60 * 24);
    });

    const avgTimeToAcceptPrevious = timeToAcceptPrevious.length > 0
      ? timeToAcceptPrevious.reduce((sum, days) => sum + days, 0) / timeToAcceptPrevious.length
      : 0;

    const timeToAcceptChange = this.calculatePercentageChange(
      avgTimeToAcceptCurrent,
      avgTimeToAcceptPrevious
    );

    // === QUOTE-TO-INVOICE CYCLE ===
    // Current period: quotes created in period that have invoices
    const quotesInPeriod = allQuotes.filter(q => {
      if (!q.createdAt) return false;
      const createdAt = new Date(q.createdAt);
      return createdAt >= startDate && createdAt <= endDate;
    });

    const quoteToInvoiceCurrentPeriod = quotesInPeriod
      .map(quote => {
        // Find job from this quote
        const job = jobs.find(j => j.quoteId === quote.id);
        if (!job) return null;

        // Find invoice from this job
        const invoice = invoices.find(inv => inv.jobId === job.id);
        if (!invoice || !invoice.createdAt) return null;

        const quoteCreated = new Date(quote.createdAt!).getTime();
        const invoiceCreated = new Date(invoice.createdAt).getTime();
        const days = (invoiceCreated - quoteCreated) / (1000 * 60 * 60 * 24);

        return days;
      })
      .filter((days): days is number => days !== null);

    const avgQuoteToInvoiceCurrent = quoteToInvoiceCurrentPeriod.length > 0
      ? quoteToInvoiceCurrentPeriod.reduce((sum, days) => sum + days, 0) / quoteToInvoiceCurrentPeriod.length
      : 0;

    // Previous period
    const quotesInPreviousPeriod = allQuotes.filter(q => {
      if (!q.createdAt) return false;
      const createdAt = new Date(q.createdAt);
      return createdAt >= previousRange.startDate && createdAt <= previousRange.endDate;
    });

    const quoteToInvoicePreviousPeriod = quotesInPreviousPeriod
      .map(quote => {
        const job = jobs.find(j => j.quoteId === quote.id);
        if (!job) return null;
        const invoice = invoices.find(inv => inv.jobId === job.id);
        if (!invoice || !invoice.createdAt) return null;

        const quoteCreated = new Date(quote.createdAt!).getTime();
        const invoiceCreated = new Date(invoice.createdAt).getTime();
        const days = (invoiceCreated - quoteCreated) / (1000 * 60 * 60 * 24);

        return days;
      })
      .filter((days): days is number => days !== null);

    const avgQuoteToInvoicePrevious = quoteToInvoicePreviousPeriod.length > 0
      ? quoteToInvoicePreviousPeriod.reduce((sum, days) => sum + days, 0) / quoteToInvoicePreviousPeriod.length
      : 0;

    const quoteToInvoiceChange = this.calculatePercentageChange(
      avgQuoteToInvoiceCurrent,
      avgQuoteToInvoicePrevious
    );

    return {
      timeToAcceptQuote: {
        averageDays: Math.round(avgTimeToAcceptCurrent * 10) / 10, // 1 decimal place
        totalQuotes: acceptedQuotesCurrentPeriod.length,
        changePercent: timeToAcceptChange,
      },
      quoteToInvoiceCycle: {
        averageDays: Math.round(avgQuoteToInvoiceCurrent * 10) / 10,
        totalConversions: quoteToInvoiceCurrentPeriod.length,
        changePercent: quoteToInvoiceChange,
      },
    };
  }

  /**
   * PHASE 2: Lead Funnel Conversion Tracking
   * Simplified 3-stage funnel: Quotes → Jobs → Invoices
   * Tracks forward lineage regardless of dates/status after Stage 1
   */
  static async getLeadFunnelMetrics(businessId: string, period: string = '30days'): Promise<{
    stages: Array<{
      stage: string;
      count: number;
      value: number;
      conversionRate: number;
      dropOffRate: number;
      averageTimeInStage: number;
    }>;
    overallConversionRate: number;
    totalPipelineValue: number;
  }> {
    const { startDate, endDate } = this.getDateRange(period);
    
    // Get ALL data - we'll filter quotes by date, then follow the lineage
    const allQuotes = await storage.getQuotesByBusinessId(businessId);
    const jobs = await storage.getJobsByBusinessId(businessId);
    const invoices = await storage.getInvoicesByBusinessId(businessId);
    
    console.log('🔍 Funnel Debug - Date Range:', {
      period,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      totalQuotes: allQuotes.length,
      totalJobs: jobs.length,
      totalInvoices: invoices.length
    });
    
    // Stage 1: Filter quotes by created_at using simple string comparison
    // This avoids timezone issues by comparing ISO strings directly
    const startDateStr = startDate.toISOString();
    const endDateStr = endDate.toISOString();
    
    const quotesInPeriod = allQuotes.filter(q => {
      if (!q.createdAt) return false;
      
      // Convert to ISO string for comparison
      const createdAtStr = new Date(q.createdAt).toISOString();
      return createdAtStr >= startDateStr && createdAtStr <= endDateStr;
    });
    
    console.log('📊 Quotes in period:', {
      count: quotesInPeriod.length,
      totalQuotes: allQuotes.length,
      dateRange: `${startDate.toISOString()} to ${endDate.toISOString()}`,
      quoteDates: allQuotes.slice(0, 5).map(q => ({ 
        id: q.id, 
        createdAt: q.createdAt,
        parsed: q.createdAt ? new Date(q.createdAt).toISOString() : null
      }))
    });
    
    const quotesCount = quotesInPeriod.length;
    const quotesValue = quotesInPeriod.reduce((sum, q) => sum + parseFloat(q.totalAmount), 0);
    const quoteIds = new Set(quotesInPeriod.map(q => q.id));
    
    // Stage 2: Jobs from Stage 1 Quotes (regardless of when created)
    const jobsFromQuotes = jobs.filter(j => j.quoteId && quoteIds.has(j.quoteId));
    const jobsCount = jobsFromQuotes.length;
    const jobsValue = jobsFromQuotes
      .filter(j => j.totalAmount)
      .reduce((sum, j) => sum + parseFloat(j.totalAmount!), 0);
    const jobIds = new Set(jobsFromQuotes.map(j => j.id));
    
    console.log('🔧 Jobs from quotes:', {
      count: jobsCount,
      quoteIds: Array.from(quoteIds).slice(0, 3),
      jobsWithQuoteId: jobs.filter(j => j.quoteId).length,
      sampleJobs: jobsFromQuotes.slice(0, 3).map(j => ({ id: j.id, quoteId: j.quoteId }))
    });
    
    // Stage 3: Invoices from Stage 2 Jobs (all statuses)
    const invoicesFromJobs = invoices.filter(inv => inv.jobId && jobIds.has(inv.jobId));
    const invoicesCount = invoicesFromJobs.length;
    const invoicesValue = invoicesFromJobs.reduce((sum, inv) => sum + parseFloat(inv.totalAmount), 0);
    
    console.log('💰 Invoices from jobs:', {
      count: invoicesCount,
      jobIds: Array.from(jobIds).slice(0, 3),
      invoicesWithJobId: invoices.filter(inv => inv.jobId).length,
      sampleInvoices: invoicesFromJobs.slice(0, 3).map(inv => ({ id: inv.id, jobId: inv.jobId }))
    });
    
    // Build funnel stages
    const stages = [
      {
        stage: 'Quotes Created',
        count: quotesCount,
        value: Math.round(quotesValue),
        conversionRate: 100,
        dropOffRate: 0,
        averageTimeInStage: 0
      },
      {
        stage: 'Jobs Created',
        count: jobsCount,
        value: Math.round(jobsValue),
        conversionRate: quotesCount > 0 ? Math.round((jobsCount / quotesCount) * 100) : 0,
        dropOffRate: quotesCount > 0 ? Math.round(((quotesCount - jobsCount) / quotesCount) * 100) : 0,
        averageTimeInStage: 0
      },
      {
        stage: 'Invoices Created',
        count: invoicesCount,
        value: Math.round(invoicesValue),
        conversionRate: jobsCount > 0 ? Math.round((invoicesCount / jobsCount) * 100) : 0,
        dropOffRate: jobsCount > 0 ? Math.round(((jobsCount - invoicesCount) / jobsCount) * 100) : 0,
        averageTimeInStage: 0
      }
    ];
    
    const overallConversionRate = quotesCount > 0 
      ? Math.round((invoicesCount / quotesCount) * 100)
      : 0;
    
    const totalPipelineValue = Math.round(quotesValue + jobsValue + invoicesValue);
    
    console.log('📈 Final Funnel Result:', {
      stages,
      overallConversionRate,
      totalPipelineValue
    });
    
    return {
      stages,
      overallConversionRate,
      totalPipelineValue
    };
  }
}
