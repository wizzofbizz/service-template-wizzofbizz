/**
 * Centralized status color mapping for consistent styling across the application
 * Color progression: grey (draft) -> blue (active) -> amber (attention) -> cyan (financial) -> green (success) -> red (failure)
 */

// Quote Statuses
export const quoteStatusColors: Record<string, string> = {
  draft: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-100",
  ai_quote: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  sent: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  viewed: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100",
  accepted: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  deposit_paid: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-100",
  declined: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
  expired: "bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-100",
  archived: "bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-100",
};

export const quoteStatusLabels: Record<string, string> = {
  draft: "Draft",
  ai_quote: "AI Quote",
  sent: "Sent",
  viewed: "Viewed",
  accepted: "Accepted",
  deposit_paid: "Deposit Paid",
  declined: "Declined",
  expired: "Expired",
  archived: "Archived",
};

// Job Statuses
export const jobStatusColors: Record<string, string> = {
  pending: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-100",
  pending_deposit: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100",
  deposit_paid: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-100",
  scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  in_progress: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
};

export const jobStatusLabels: Record<string, string> = {
  pending: "Pending",
  pending_deposit: "Awaiting Deposit",
  deposit_paid: "Deposit Paid",
  scheduled: "Scheduled",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

// Invoice Statuses
export const invoiceStatusColors: Record<string, string> = {
  draft: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-100",
  sent: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  paid: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  overdue: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
};

export const invoiceStatusLabels: Record<string, string> = {
  draft: "Draft",
  sent: "Sent",
  paid: "Paid",
  overdue: "Overdue",
  cancelled: "Cancelled",
};

// Invoice Types
export const invoiceTypeColors: Record<string, string> = {
  standard: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-100",
  deposit: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
  final: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-100",
};

export const invoiceTypeLabels: Record<string, string> = {
  standard: "Standard",
  deposit: "Deposit",
  final: "Final",
};

// Contact Type Colors
export const contactTypeColors: Record<string, string> = {
  lead: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100",
  customer: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  past_customer: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-100",
};

export const contactTypeLabels: Record<string, string> = {
  lead: "Lead",
  customer: "Customer",
  past_customer: "Past Customer",
};

// Lead Status Colors (for contacts)
export const leadStatusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  contacted: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-100",
  quoted: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100",
  converted: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  lost: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
};

export const leadStatusLabels: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  quoted: "Quoted",
  converted: "Converted",
  lost: "Lost",
};

// Testimonial Status Colors
export const testimonialStatusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100",
  approved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
};

// Email Status Colors
export const emailStatusColors: Record<string, string> = {
  pending: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-100",
  sent: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
  cancelled: "bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-100",
};

// WhatsApp Status Colors
export const whatsappStatusColors: Record<string, string> = {
  pending: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-100",
  sent: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  delivered: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-100",
  read: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
};

/**
 * Generic function to get color for any status type
 */
export function getStatusColor(statusType: string, status: string): string {
  const colorMap: Record<string, Record<string, string>> = {
    quote: quoteStatusColors,
    job: jobStatusColors,
    invoice: invoiceStatusColors,
    contact_type: contactTypeColors,
    lead_status: leadStatusColors,
    testimonial: testimonialStatusColors,
    email: emailStatusColors,
    whatsapp: whatsappStatusColors,
  };

  const map = colorMap[statusType];
  return map?.[status] || "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-100";
}
