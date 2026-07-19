import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { ResponsiveFunnel } from '@nivo/funnel';
import { TrendingUp, TrendingDown, DollarSign, AlertCircle, Download, Calendar } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

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

export default function InsightsPage() {
  const pageStyle = { fontFamily: 'var(--font-sans)' };
  const { user } = useAuth();
  const [period, setPeriod] = useState('30days');

  const { data: overview } = useQuery<FinancialOverview>({
    queryKey: ['/api/insights/financial-overview', period],
    enabled: !!user?.businessId,
  });



  const { data: receivables } = useQuery<{
    totalOutstanding: number;
    totalClients: number;
    topClients: Array<{
      clientName: string;
      balance: number;
      lateAmount: number;
      invoiceCount: number;
    }>;
  }>({
    queryKey: ['/api/insights/receivables'],
    enabled: !!user?.businessId,
  });

  const { data: projectedIncome } = useQuery<{
    dueToday: number;
    dueNext7Days: number;
    dueNext30Days: number;
    invoicesDueToday: number;
    invoicesDue7Days: number;
    invoicesDue30Days: number;
    averagePaymentTimeDays: number;
    averagePaymentTimeChange: number;
  }>({
    queryKey: ['/api/insights/projected-income'],
    enabled: !!user?.businessId,
  });

  const { data: agedReceivables } = useQuery<{
    buckets: Array<{ 
      bucket: string; 
      total: number; 
      count: number; 
      clients: Array<{ clientName: string; amount: number; daysOverdue: number; invoiceNumber: string }> 
    }>;
    totalOutstanding: number;
  }>({
    queryKey: ['/api/insights/aged-receivables'],
    enabled: !!user?.businessId,
  });

  const { data: leadFunnel } = useQuery<{
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
  }>({
    queryKey: ['/api/insights/lead-funnel', period],
    queryFn: async () => {
      const res = await fetch(`/api/insights/lead-funnel?period=${period}`, {
        credentials: "include"
      });
      if (!res.ok) throw new Error("Failed to fetch lead funnel");
      return res.json();
    },
    enabled: !!user?.businessId,
  });

  const { data: leadConversionTimings } = useQuery<{
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
  }>({
    queryKey: ['/api/insights/lead-conversion-timings', period],
    queryFn: async () => {
      const res = await fetch(`/api/insights/lead-conversion-timings?period=${period}`, {
        credentials: "include"
      });
      if (!res.ok) throw new Error("Failed to fetch lead conversion timings");
      return res.json();
    },
    enabled: !!user?.businessId,
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const KPICard = ({ title, metric, icon: Icon, variant }: { 
    title: string; 
    metric: KPIMetric; 
    icon: any;
    variant?: 'default' | 'warning' | 'success';
  }) => {
    const isPositive = metric.trend === 'up';
    const changeColor = variant === 'warning' ? 'text-amber-600' : (isPositive ? 'text-green-600' : 'text-red-600');

    return (
      <Card className="hover-elevate">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <Icon className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {title.includes('Invoices') ? metric.value.toLocaleString() : formatCurrency(metric.value)}
          </div>
          <div className="flex items-center gap-2 mt-2">
            {metric.trend === 'up' ? (
              <TrendingUp className={`h-4 w-4 ${changeColor}`} />
            ) : metric.trend === 'down' ? (
              <TrendingDown className={`h-4 w-4 ${changeColor}`} />
            ) : null}
            <span className={`text-sm font-medium ${changeColor}`}>
              {metric.change > 0 ? '+' : ''}{metric.change}%
            </span>
            <span className="text-sm text-muted-foreground">vs last period</span>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-6 space-y-6" style={pageStyle}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Financial Insights</h1>
          <p className="text-muted-foreground mt-1">Track your business performance and cashflow</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
              <SelectItem value="year">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2" style={{ backgroundColor: 'hsl(var(--brand))', color: 'white', borderColor: 'hsl(var(--brand))' }}>
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {overview && (
          <>
            <KPICard
              title="Total Revenue"
              metric={overview.totalRevenue}
              icon={DollarSign}
              variant="success"
            />
            <KPICard
              title="Outstanding"
              metric={overview.outstanding}
              icon={AlertCircle}
              variant="warning"
            />
            <KPICard
              title="Paid Invoices"
              metric={overview.paidInvoices}
              icon={TrendingUp}
              variant="success"
            />
            <KPICard
              title="Overdue"
              metric={overview.overdue}
              icon={AlertCircle}
              variant="warning"
            />
          </>
        )}
      </div>

      {/* New Cards: Receivables and Projected Income */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Receivables Card */}
        <Card>
          <CardHeader>
            <CardTitle>Receivables</CardTitle>
            <CardDescription>Outstanding balances owed to you by clients</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Total Clients Owing</div>
                <div className="text-3xl font-bold">{receivables?.totalClients ?? 0}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Total Outstanding Balance</div>
                <div className="text-3xl font-bold">{formatCurrency(receivables?.totalOutstanding ?? 0)}</div>
              </div>
            </div>
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">Top 3 Clients Owing</h3>
              {receivables?.topClients && receivables.topClients.length > 0 ? (
                <div className="space-y-3">
                  {receivables.topClients.slice(0, 3).map((client, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <div className="font-medium">{client.clientName}</div>
                        <div className="text-sm text-muted-foreground">
                          {client.invoiceCount} invoices • {client.lateAmount > 0 ? `${formatCurrency(client.lateAmount)} late` : 'No late payments'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{formatCurrency(client.balance)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No top clients to display</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Projected Income Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Projected Income & Key Metrics</CardTitle>
            <CardDescription>Income projections and performance indicators at a glance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Income Projections */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">Invoices Due</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Due in 7 Days</div>
                    <div className="text-3xl font-bold">{formatCurrency(projectedIncome?.dueNext7Days ?? 0)}</div>
                    <div className="text-xs text-muted-foreground">{projectedIncome?.invoicesDue7Days ?? 0} invoices</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Due in 30 Days</div>
                    <div className="text-3xl font-bold">{formatCurrency(projectedIncome?.dueNext30Days ?? 0)}</div>
                    <div className="text-xs text-muted-foreground">{projectedIncome?.invoicesDue30Days ?? 0} invoices</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Due Today</div>
                    <div className="text-3xl font-bold">{formatCurrency(projectedIncome?.dueToday ?? 0)}</div>
                    <div className="text-xs text-muted-foreground">{projectedIncome?.invoicesDueToday ?? 0} invoices</div>
                  </div>
                </div>
              </div>

              {/* Key Performance Metrics */}
              <div className="pt-4 border-t">
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">Performance Metrics</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Average Time to Get Paid */}
                  <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(97, 47, 255, 0.05)', border: '1px solid rgba(97, 47, 255, 0.2)' }}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-sm text-muted-foreground">Avg. Payment Time</div>
                      <TrendingUp className="h-4 w-4" style={{ color: 'hsl(var(--brand))' }} />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-2xl font-bold">{projectedIncome?.averagePaymentTimeDays ?? 0} days</div>
                      {projectedIncome && projectedIncome.averagePaymentTimeChange !== 0 && (
                        <div className="flex items-center gap-1">
                          {projectedIncome.averagePaymentTimeChange < 0 ? (
                            <TrendingDown className="h-3 w-3 text-green-600" />
                          ) : (
                            <TrendingUp className="h-3 w-3 text-red-600" />
                          )}
                          <span className={`text-xs font-medium ${
                            projectedIncome.averagePaymentTimeChange < 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {Math.abs(projectedIncome.averagePaymentTimeChange)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Average Invoice Value */}
                  {overview && (
                    <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(97, 47, 255, 0.05)', border: '1px solid rgba(97, 47, 255, 0.2)' }}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-sm text-muted-foreground">Avg. Invoice Value</div>
                        <TrendingUp className="h-4 w-4" style={{ color: 'hsl(var(--brand))' }} />
                      </div>
                      <div className="text-2xl font-bold">
                        {overview.paidInvoices.value > 0 ? formatCurrency(overview.totalRevenue.value / overview.paidInvoices.value) : formatCurrency(0)}
                      </div>
                    </div>
                  )}

                  {/* Collection Rate */}
                  {overview && (
                    <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-sm text-muted-foreground">Collection Rate</div>
                        <DollarSign className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="text-2xl font-bold">
                        {overview.totalRevenue.value + overview.outstanding.value > 0 
                          ? Math.round((overview.totalRevenue.value / (overview.totalRevenue.value + overview.outstanding.value)) * 100)
                          : 0}%
                      </div>
                    </div>
                  )}

                  {/* Overdue Ratio */}
                  {overview && (
                    <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-sm text-muted-foreground">Overdue Ratio</div>
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                      </div>
                      <div className="text-2xl font-bold">
                        {overview.outstanding.value > 0 
                          ? Math.round((overview.overdue.value / overview.outstanding.value) * 100)
                          : 0}%
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Aged Receivables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Aged Receivables Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Aged Receivables</CardTitle>
            <CardDescription>Outstanding invoices by aging bucket</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={agedReceivables?.buckets || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" className="text-xs" tickFormatter={(value) => `R${(value / 1000).toFixed(0)}k`} />
                <YAxis dataKey="bucket" type="category" className="text-xs" width={80} />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                />
                <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                  {(agedReceivables?.buckets || []).map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={index === 0 ? '#10B981' : index === 1 ? '#F59E0B' : index === 2 ? '#EF4444' : '#DC2626'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Client Breakdown by Aging */}
        <Card>
          <CardHeader>
            <CardTitle>Top Overdue Clients</CardTitle>
            <CardDescription>Clients with outstanding balances</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[300px] overflow-y-auto">
              {agedReceivables?.buckets.flatMap(bucket => 
                bucket.clients.map(client => ({
                  ...client,
                  bucket: bucket.bucket
                }))
              )
              .sort((a, b) => b.amount - a.amount)
              .slice(0, 10)
              .map((client, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="flex-1">
                    <div className="font-medium">{client.clientName}</div>
                    <div className="text-sm text-muted-foreground">
                      Invoice: {client.invoiceNumber} • {client.daysOverdue} days overdue
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-red-600">{formatCurrency(client.amount)}</div>
                    <Badge 
                      variant="outline" 
                      className={
                        client.daysOverdue <= 30 ? 'bg-green-500/10 text-green-700 border-green-500/20' :
                        client.daysOverdue <= 60 ? 'bg-amber-500/10 text-amber-700 border-amber-500/20' :
                        client.daysOverdue <= 90 ? 'bg-orange-500/10 text-orange-700 border-orange-500/20' :
                        'bg-red-500/10 text-red-700 border-red-500/20'
                      }
                    >
                      {client.bucket}
                    </Badge>
                  </div>
                </div>
              ))}

              {(!agedReceivables?.buckets || agedReceivables.buckets.every(b => b.clients.length === 0)) && (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No overdue invoices</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lead Conversion Timings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Time to Accept Quote</CardTitle>
            <CardDescription>Average time from quote creation to acceptance</CardDescription>
          </CardHeader>
          <CardContent>
            {leadConversionTimings ? (
              <>
                <div className="text-3xl font-bold">
                  {leadConversionTimings.timeToAcceptQuote.averageDays} days
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {leadConversionTimings.timeToAcceptQuote.changePercent < 0 ? (
                    <TrendingDown className="h-4 w-4 text-green-600" />
                  ) : leadConversionTimings.timeToAcceptQuote.changePercent > 0 ? (
                    <TrendingUp className="h-4 w-4 text-red-600" />
                  ) : null}
                  <span className={`text-sm font-medium ${
                    leadConversionTimings.timeToAcceptQuote.changePercent < 0 ? 'text-green-600' : 
                    leadConversionTimings.timeToAcceptQuote.changePercent > 0 ? 'text-red-600' : 
                    'text-muted-foreground'
                  }`}>
                    {leadConversionTimings.timeToAcceptQuote.changePercent > 0 ? '+' : ''}
                    {leadConversionTimings.timeToAcceptQuote.changePercent}%
                  </span>
                  <span className="text-sm text-muted-foreground">vs last period</span>
                </div>
                <div className="text-sm text-muted-foreground mt-2">
                  Based on {leadConversionTimings.timeToAcceptQuote.totalQuotes} accepted quotes
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quote-to-Invoice Cycle</CardTitle>
            <CardDescription>Average time from quote creation to invoice generation</CardDescription>
          </CardHeader>
          <CardContent>
            {leadConversionTimings ? (
              <>
                <div className="text-3xl font-bold">
                  {leadConversionTimings.quoteToInvoiceCycle.averageDays} days
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {leadConversionTimings.quoteToInvoiceCycle.changePercent < 0 ? (
                    <TrendingDown className="h-4 w-4 text-green-600" />
                  ) : leadConversionTimings.quoteToInvoiceCycle.changePercent > 0 ? (
                    <TrendingUp className="h-4 w-4 text-red-600" />
                  ) : null}
                  <span className={`text-sm font-medium ${
                    leadConversionTimings.quoteToInvoiceCycle.changePercent < 0 ? 'text-green-600' : 
                    leadConversionTimings.quoteToInvoiceCycle.changePercent > 0 ? 'text-red-600' : 
                    'text-muted-foreground'
                  }`}>
                    {leadConversionTimings.quoteToInvoiceCycle.changePercent > 0 ? '+' : ''}
                    {leadConversionTimings.quoteToInvoiceCycle.changePercent}%
                  </span>
                  <span className="text-sm text-muted-foreground">vs last period</span>
                </div>
                <div className="text-sm text-muted-foreground mt-2">
                  Based on {leadConversionTimings.quoteToInvoiceCycle.totalConversions} conversions
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Lead Funnel Section */}
      <div className="grid grid-cols-1 gap-6 px-0 sm:px-0">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <CardTitle>Lead Conversion Funnel</CardTitle>
                <CardDescription>Track conversion rates through your sales pipeline</CardDescription>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">{leadFunnel?.overallConversionRate || 0}%</div>
                <div className="text-sm text-muted-foreground">Overall Conversion</div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Nivo Funnel Visualization */}
              {(() => {
                const funnelData = leadFunnel?.stages?.filter(stage => stage.count > 0) || [];
                console.log('🎨 Rendering funnel with data:', funnelData);

                return funnelData.length > 0 ? (
                  <div style={{ height: 'clamp(300px, 60vh, 400px)' }}>
                    <ResponsiveFunnel
                      data={funnelData.map((stage) => ({
                        id: stage.stage,
                        value: stage.count,
                        label: `${stage.stage} (${stage.count})`,
                      }))}
                      margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                      valueFormat=" >-.0f"
                      colors={['hsl(var(--brand))', '#8B5CF6', '#10b981', '#f59e0b', '#ef4444']}
                      borderWidth={20}
                      labelColor="#ffffff"
                      beforeSeparatorLength={100}
                      beforeSeparatorOffset={20}
                      afterSeparatorLength={100}
                      afterSeparatorOffset={20}
                      currentPartSizeExtension={10}
                      currentBorderWidth={40}
                      motionConfig="gentle"
                      enableLabel={true}
                      interpolation="smooth"
                      theme={{
                        labels: {
                          text: {
                            fontSize: 18,
                            fill: '#ffffff',
                            fontWeight: 700
                          }
                        }
                      }}
                      label={(data) => {
                        const stage = funnelData.find(s => s.stage === data.id);
                        if (!stage) return `${data.value}`;
                        return `${data.value}\n${formatCurrency(stage.value)}`;
                      }}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                    <div className="text-center">
                      <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">No funnel data available for this period</p>
                      <p className="text-sm mt-2">Try selecting a different time period or create some quotes to see your conversion funnel</p>
                    </div>
                  </div>
                );
              })()}

              {/* Stage Details */}
              <div className="space-y-2">
                {(leadFunnel?.stages || []).map((stage, index) => (
                  <div key={stage.stage} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex flex-wrap items-center gap-2">
                      <div 
                        className="h-3 w-3 rounded-full flex-shrink-0"
                        style={{ 
                          backgroundColor: ['hsl(var(--brand))', '#8B5CF6', '#10b981', '#f59e0b', '#ef4444'][index] 
                        }}
                      />
                      <span className="text-sm font-medium whitespace-nowrap">{stage.stage}</span>
                      <Badge variant="outline" className="text-xs">
                        {stage.count} {stage.stage.toLowerCase()}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {stage.conversionRate < 100 && (
                        <Badge variant="secondary" className="text-xs">
                          {stage.conversionRate}% conv
                        </Badge>
                      )}
                      {stage.dropOffRate > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {stage.dropOffRate}% drop
                        </Badge>
                      )}
                      {stage.averageTimeInStage > 0 && (
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {stage.averageTimeInStage}d
                        </span>
                      )}
                      <div className="text-sm font-semibold whitespace-nowrap">
                        {stage.value > 0 ? formatCurrency(stage.value) : '-'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pipeline Summary */}
              <div className="pt-4 border-t">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="text-sm font-medium text-muted-foreground">Pipeline Breakdown</div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <div className="text-center p-3 rounded-lg" style={{ backgroundColor: 'rgba(97, 47, 255, 0.05)', border: '1px solid rgba(97, 47, 255, 0.2)' }}>
                        <div className="text-lg sm:text-xl font-bold" style={{ color: 'hsl(var(--brand))' }}>{leadFunnel?.stages[0]?.count || 0}</div>
                        <div className="text-xs text-muted-foreground mt-1">Quotes</div>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-purple-500/5 border border-purple-200 dark:border-purple-900">
                        <div className="text-lg sm:text-xl font-bold text-purple-600">{leadFunnel?.stages[1]?.count || 0}</div>
                        <div className="text-xs text-muted-foreground mt-1">Jobs</div>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-green-500/5 border border-green-200 dark:border-green-900">
                        <div className="text-lg sm:text-xl font-bold text-green-600">{leadFunnel?.stages[2]?.count || 0}</div>
                        <div className="text-xs text-muted-foreground mt-1">Invoices</div>
                      </div>
                    </div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-red-500/5 border border-red-200 dark:border-red-900 flex flex-col justify-center">
                    <div className="text-2xl sm:text-3xl font-bold text-red-600">
                      {formatCurrency(Math.max(0, (leadFunnel?.stages[0]?.value || 0) - (leadFunnel?.stages[2]?.value || 0)))}
                    </div>
                    <div className="text-sm text-muted-foreground mt-2">Amount Lost in Pipeline</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>


    </div>
  );
}