import { storage } from "./storage";

export interface WhatsAppAnalytics {
  totalSent: number;
  totalDelivered: number;
  totalRead: number;
  totalFailed: number;
  deliveryRate: number;
  readRate: number;
  usageByType: {
    quote: number;
    job: number;
    invoice: number;
    other: number;
  };
  usageOverTime: Array<{
    date: string;
    count: number;
    cost: number;
  }>;
  currentMonthUsage: {
    used: number;
    limit: number;
    percentage: number;
    cost: number;
  };
}

export async function getWhatsAppAnalytics(
  businessId: string,
  startDate?: Date,
  endDate?: Date
): Promise<WhatsAppAnalytics> {
  const business = await storage.getBusiness(businessId);

  if (!business) {
    throw new Error("Business not found");
  }

  // Get all WhatsApp messages for this business
  const allMessages = await storage.getWhatsappQueueByBusinessId(businessId, 10000);

  // Filter by date range if provided
  let messages = allMessages;
  if (startDate || endDate) {
    messages = allMessages.filter(msg => {
      const msgDate = new Date(msg.createdAt);
      if (startDate && msgDate < startDate) return false;
      if (endDate && msgDate > endDate) return false;
      return true;
    });
  }

  // Calculate basic stats
  const totalSent = messages.filter(m =>
    ['sent', 'delivered', 'read'].includes(m.status)
  ).length;

  const totalDelivered = messages.filter(m =>
    ['delivered', 'read'].includes(m.status)
  ).length;

  const totalRead = messages.filter(m => m.status === 'read').length;
  const totalFailed = messages.filter(m => m.status === 'failed').length;

  // Calculate rates
  const deliveryRate = totalSent > 0
    ? Math.round((totalDelivered / totalSent) * 100)
    : 0;

  const readRate = totalDelivered > 0
    ? Math.round((totalRead / totalDelivered) * 100)
    : 0;

  // Usage by type
  const usageByType = {
    quote: messages.filter(m => m.relatedType === 'quote').length,
    job: messages.filter(m => m.relatedType === 'job').length,
    invoice: messages.filter(m => m.relatedType === 'invoice').length,
    other: messages.filter(m => !m.relatedType || !['quote', 'job', 'invoice'].includes(m.relatedType)).length,
  };

  // Usage over time (last 30 days)
  const usageOverTime: Array<{ date: string; count: number; cost: number }> = [];
  const today = new Date();

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const dayMessages = messages.filter(m => {
      const msgDate = new Date(m.createdAt).toISOString().split('T')[0];
      return msgDate === dateStr && ['sent', 'delivered', 'read'].includes(m.status);
    });

    const cost = dayMessages.reduce((sum, m) => sum + parseFloat(m.cost || '0'), 0);

    usageOverTime.push({
      date: dateStr,
      count: dayMessages.length,
      cost: parseFloat(cost.toFixed(2)),
    });
  }

  // Current month usage
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthMessages = messages.filter(m => {
    const msgDate = new Date(m.createdAt);
    return msgDate >= monthStart && ['sent', 'delivered', 'read'].includes(m.status);
  });

  const monthCost = monthMessages.reduce((sum, m) => sum + parseFloat(m.cost || '0'), 0);
  const monthLimit = business.whatsappMonthlyLimit || 1000;
  const monthUsed = business.whatsappCurrentUsage || 0;

  return {
    totalSent,
    totalDelivered,
    totalRead,
    totalFailed,
    deliveryRate,
    readRate,
    usageByType,
    usageOverTime,
    currentMonthUsage: {
      used: monthUsed,
      limit: monthLimit,
      percentage: Math.round((monthUsed / monthLimit) * 100),
      cost: parseFloat(monthCost.toFixed(2)),
    },
  };
}

export async function getWhatsAppMessageHistory(
  businessId: string,
  limit: number = 50,
  offset: number = 0
): Promise<any[]> {
  const messages = await storage.getWhatsappQueueByBusinessId(businessId, limit + offset);
  return messages.slice(offset, offset + limit);
}