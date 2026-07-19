import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Send,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Bug,
  Activity
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";


export default function WhatsAppDebugPage() {
  const pageStyle = { fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif' };
  const { user, business } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Test Message State
  const [testPhone, setTestPhone] = useState("+27");
  const [testMessage, setTestMessage] = useState("");

  // Queue Data
  const { data: queueData, isLoading: queueLoading } = useQuery({
    queryKey: ["whatsapp-queue"],
    queryFn: async () => {
      const response = await fetch("/api/whatsapp/queue?limit=100", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch queue");
      return response.json();
    },
    refetchInterval: 5000, // Auto-refresh every 5 seconds
  });

  // Health Check
  const { data: healthData } = useQuery({
    queryKey: ["whatsapp-health"],
    queryFn: async () => {
      const response = await fetch("/api/whatsapp/health", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch health");
      return response.json();
    },
    refetchInterval: 10000,
  });

  // Send Test Message
  const sendTestMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/whatsapp/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          phoneNumber: testPhone,
          message: testMessage,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to send test message");
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Test Message Sent",
        description: `Message queued successfully to ${data.formattedNumber}`,
      });
      queryClient.invalidateQueries({ queryKey: ["whatsapp-queue"] });
      setTestMessage("");
    },
    onError: (error: Error) => {
      toast({
        title: "Send Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Process Queue Manually
  const processQueueMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/whatsapp/process-queue", {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to process queue");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Queue Processed",
        description: `Sent ${data.sentCount} messages`,
      });
      queryClient.invalidateQueries({ queryKey: ["whatsapp-queue"] });
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any }> = {
      pending: { variant: "outline", icon: Clock },
      sent: { variant: "default", icon: CheckCircle2 },
      delivered: { variant: "default", icon: CheckCircle2 },
      read: { variant: "default", icon: CheckCircle2 },
      failed: { variant: "destructive", icon: XCircle },
    };

    const config = variants[status] || { variant: "outline", icon: AlertCircle };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant as any}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    );
  };

  const queueStats = queueData ? {
    pending: queueData.filter((m: any) => m.status === 'pending').length,
    sent: queueData.filter((m: any) => m.status === 'sent').length,
    delivered: queueData.filter((m: any) => m.status === 'delivered').length,
    failed: queueData.filter((m: any) => m.status === 'failed').length,
  } : { pending: 0, sent: 0, delivered: 0, failed: 0 };

  return (
    <div className="space-y-6" style={pageStyle}>
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Bug className="h-8 w-8" />
          WhatsApp Debug & Testing
        </h1>
        <p className="text-muted-foreground mt-1">
          Test messages, monitor queue, and debug WhatsApp integration
        </p>
      </div>

      {/* Health Status */}
      {healthData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Provider</p>
                <p className="text-lg font-semibold capitalize">{healthData.provider}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={healthData.healthy ? "default" : "destructive"}>
                  {healthData.healthy ? "Healthy" : "Error"}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Queue Size</p>
                <p className="text-lg font-semibold">{healthData.queueSize}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Usage</p>
                <p className="text-lg font-semibold">
                  {healthData.currentUsage} / {healthData.monthlyLimit}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="test" className="space-y-4">
        <TabsList>
          <TabsTrigger value="test">Test Message</TabsTrigger>
          <TabsTrigger value="queue">Queue Monitor</TabsTrigger>
        </TabsList>

        {/* Test Message Tab */}
        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Send Test Message</CardTitle>
              <CardDescription>
                Test WhatsApp messaging with a real phone number
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="test-phone">Phone Number (E.164 format)</Label>
                <Input
                  id="test-phone"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="+27821234567"
                />
                <p className="text-xs text-muted-foreground">
                  Use your own number for testing
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="test-message">Message</Label>
                <Textarea
                  id="test-message"
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  placeholder="Enter test message..."
                  rows={4}
                />
              </div>

              <Button
                onClick={() => sendTestMutation.mutate()}
                disabled={!testPhone || !testMessage || sendTestMutation.isPending}
                className="w-full"
                style={{ backgroundColor: '#612fff', borderColor: '#612fff' }}
              >
                <Send className="w-4 h-4 mr-2" />
                {sendTestMutation.isPending ? "Sending..." : "Send Test Message"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Queue Monitor Tab */}
        <TabsContent value="queue" className="space-y-4">
          {/* Queue Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{queueStats.pending}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Sent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{queueStats.sent}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Delivered</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{queueStats.delivered}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Failed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{queueStats.failed}</div>
              </CardContent>
            </Card>
          </div>

          {/* Queue Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Message Queue (Last 100)</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => processQueueMutation.mutate()}
                  disabled={processQueueMutation.isPending}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${processQueueMutation.isPending ? 'animate-spin' : ''}`} />
                  Process Queue
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {queueLoading ? (
                <p className="text-center py-8">Loading queue...</p>
              ) : queueData && queueData.length > 0 ? (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  <Table>
                    <TableCaption>A list of recent WhatsApp messages.</TableCaption>
                    <TableHeader>
                      <TableHead>ID</TableHead>
                      <TableHead>To</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Created</TableHead>
                    </TableHeader>
                    <TableBody>
                      {queueData?.map((msg: any) => (
                        <TableRow key={msg.id}>
                          <TableCell className="font-mono text-xs">
                            {msg.providerMessageId ? msg.providerMessageId.substring(0, 8) + '...' : msg.id.substring(0, 8) + '...'}
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
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {msg.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs">
                            {msg.templateName ? 'Template' : 'Regular'}
                          </TableCell>
                          <TableCell>R{parseFloat(msg.cost || '0.40').toFixed(2)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(msg.createdAt).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No messages in queue</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}