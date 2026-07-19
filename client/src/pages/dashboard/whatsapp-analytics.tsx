import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { MessageSquare, TrendingUp, CheckCircle2, XCircle, Eye, DollarSign } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface WhatsAppAnalytics {
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
  totalCost: number;
  providerBreakdown?: {
    [provider: string]: {
      sent: number;
      cost: number;
    };
  };
}

const COLORS = ['hsl(var(--brand))', '#10b981', '#f59e0b', '#ef4444'];

export default function WhatsAppAnalyticsPage() {
  const pageStyle = { fontFamily: 'var(--font-sans)' };
  const { user, business } = useAuth();

  const { data: analytics, isLoading } = useQuery<WhatsAppAnalytics>({
    queryKey: ["whatsapp-analytics"],
    queryFn: async () => {
      const response = await fetch("/api/whatsapp/analytics", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch analytics");
      return response.json();
    },
  });

  const { data: messages } = useQuery({
    queryKey: ["whatsapp-messages"],
    queryFn: async () => {
      const response = await fetch("/api/whatsapp/messages?limit=100", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch messages");
      return response.json();
    },
  });

  if (isLoading || !analytics) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">WhatsApp Analytics</h1>
        <p>Loading analytics...</p>
      </div>
    );
  }

  const pieData = [
    { name: 'Quotes', value: analytics.usageByType.quote },
    { name: 'Jobs', value: analytics.usageByType.job },
    { name: 'Invoices', value: analytics.usageByType.invoice },
    { name: 'Other', value: analytics.usageByType.other },
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-6" style={pageStyle}>
      <div>
        <h1 className="text-3xl font-bold">WhatsApp Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Monitor your WhatsApp messaging performance and usage
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
            <MessageSquare className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analytics.totalSent.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{analytics.deliveryRate}%</div>
            <Progress value={analytics.deliveryRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Read Rate</CardTitle>
            <Eye className="h-5 w-5" style={{ color: 'hsl(var(--brand))' }} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" style={{ color: 'hsl(var(--brand))' }}>{analytics.readRate}%</div>
            <Progress value={analytics.readRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Cost</CardTitle>
            <DollarSign className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">R{analytics.currentMonthUsage.cost.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.currentMonthUsage.used.toLocaleString()} / {analytics.currentMonthUsage.limit.toLocaleString()} messages
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Usage Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Usage</CardTitle>
          <CardDescription>
            {analytics.currentMonthUsage.used} of {analytics.currentMonthUsage.limit} messages used ({analytics.currentMonthUsage.percentage}%)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={analytics.currentMonthUsage.percentage} className="h-4" />
          <div className="flex justify-between mt-2 text-sm text-muted-foreground">
            <span>0</span>
            <span>{analytics.currentMonthUsage.limit}</span>
          </div>
          {analytics.currentMonthUsage.percentage >= 80 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                ⚠️ You've used {analytics.currentMonthUsage.percentage}% of your monthly limit. Consider upgrading your plan.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="messages">Message History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Usage Over Time */}
            <Card>
              <CardHeader>
                <CardTitle>Usage Over Time (Last 30 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.usageOverTime}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleDateString('en-ZA')}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="count" stroke="hsl(var(--brand))" name="Messages" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Cost Over Time */}
            <Card>
              <CardHeader>
                <CardTitle>Cost Over Time (Last 30 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.usageOverTime}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleDateString('en-ZA')}
                      formatter={(value: number) => `R${value.toFixed(2)}`}
                    />
                    <Legend />
                    <Bar dataKey="cost" fill="#10b981" name="Cost (ZAR)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Usage by Type */}
            <Card>
              <CardHeader>
                <CardTitle>Messages by Type</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Status Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Message Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span>Delivered</span>
                  </div>
                  <Badge variant="outline">{analytics.totalDelivered}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-blue-600" />
                    <span>Read</span>
                  </div>
                  <Badge variant="outline">{analytics.totalRead}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-red-600" />
                    <span>Failed</span>
                  </div>
                  <Badge variant="destructive">{analytics.totalFailed}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="messages">
          <Card>
            <CardHeader>
              <CardTitle>Recent Messages</CardTitle>
              <CardDescription>Last 100 WhatsApp messages sent</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableHead>ID</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Sent At</TableHead>
                  </TableHeader>
                  <TableBody>
                    {messages && messages.length > 0 ? (
                      messages.map((msg: any) => (
                        <TableRow key={msg.id}>
                          <TableCell className="font-mono text-xs">
                            {msg.id.substring(0, 8)}...
                          </TableCell>
                          <TableCell>{msg.toNumber}</TableCell>
                          <TableCell>
                            <span className="text-xs capitalize">{msg.providerName || 'twilio'}</span>
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              msg.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                              msg.status === 'delivered' ? 'bg-green-100 text-green-800' :
                              msg.status === 'read' ? 'bg-purple-100 text-purple-800' :
                              msg.status === 'failed' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {msg.status}
                            </span>
                          </TableCell>
                          <TableCell>R{parseFloat(msg.cost || '0').toFixed(2)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {msg.sentAt ? new Date(msg.sentAt).toLocaleString('en-ZA') : '-'}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">No messages yet</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}