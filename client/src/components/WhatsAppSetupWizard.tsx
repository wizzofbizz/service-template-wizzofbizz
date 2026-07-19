import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle, RefreshCw, Smartphone, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { WhatsAppConsentDialog } from "./WhatsAppConsentDialog";

type SessionStatus = 'disconnected' | 'connecting' | 'connected' | 'expired' | 'error';

interface WhatsAppSession {
  id: string;
  sessionId: string;
  sessionName: string;
  status: SessionStatus;
  qrCode?: string;
  qrCodeExpiresAt?: string;
  whatsappNumber?: string;
  whatsappName?: string;
  connectedAt?: string;
  lastErrorMessage?: string;
  healthStatus?: string;
}

export function WhatsAppSetupWizard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<'input' | 'qr' | 'connected'>('input');
  const [sessionName, setSessionName] = useState('');
  const [currentSession, setCurrentSession] = useState<WhatsAppSession | null>(null);
  const [qrRefreshCount, setQrRefreshCount] = useState(0);
  const [showConsent, setShowConsent] = useState(false);

  // Fetch existing sessions
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery<WhatsAppSession[]>({
    queryKey: ["whatsapp-sessions"],
    queryFn: async () => {
      const response = await fetch("/api/whatsapp-sessions", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch sessions");
      return response.json();
    },
    refetchInterval: 5000, // Poll every 5 seconds
  });

  // Check if there's already a connected session
  useEffect(() => {
    const connectedSession = sessions.find(s => s.status === 'connected');
    if (connectedSession) {
      setCurrentSession(connectedSession);
      setStep('connected');
    }
  }, [sessions]);

  // Create session mutation
  const createSessionMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await fetch("/api/whatsapp-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ sessionName: name }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create session");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setCurrentSession(data);
      setStep('qr');
      setQrRefreshCount(0);
      queryClient.invalidateQueries({ queryKey: ["whatsapp-sessions"] });
      toast({
        title: "Session Created",
        description: "Scan the QR code with your WhatsApp",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Refresh QR code mutation
  const refreshQrMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await fetch(`/api/whatsapp-sessions/${sessionId}/qr`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to refresh QR code");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setCurrentSession(prev => prev ? { ...prev, qrCode: data.qrCode, qrCodeExpiresAt: data.expiresAt } : null);
      setQrRefreshCount(prev => prev + 1);
      queryClient.invalidateQueries({ queryKey: ["whatsapp-sessions"] });
    },
    onError: (error: Error) => {
      toast({
        title: "QR Refresh Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Disconnect session mutation
  const disconnectMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await fetch(`/api/whatsapp-sessions/${sessionId}/disconnect`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to disconnect");
      return response.json();
    },
    onSuccess: () => {
      setCurrentSession(null);
      setStep('input');
      queryClient.invalidateQueries({ queryKey: ["whatsapp-sessions"] });
      toast({
        title: "Disconnected",
        description: "WhatsApp session disconnected successfully",
      });
    },
  });

  // Auto-refresh QR code when it's about to expire
  useEffect(() => {
    if (!currentSession?.qrCode || !currentSession?.qrCodeExpiresAt) return;
    if (currentSession.status === 'connected') return;

    const expiresAt = new Date(currentSession.qrCodeExpiresAt);
    const now = new Date();
    const timeUntilExpiry = expiresAt.getTime() - now.getTime();

    // Refresh 10 seconds before expiry
    const refreshTimer = setTimeout(() => {
      if (currentSession.id && qrRefreshCount < 10) {
        refreshQrMutation.mutate(currentSession.id);
      }
    }, Math.max(timeUntilExpiry - 10000, 1000));

    return () => clearTimeout(refreshTimer);
  }, [currentSession?.qrCodeExpiresAt, currentSession?.status, qrRefreshCount]);

  // Monitor for successful connection
  useEffect(() => {
    if (currentSession && currentSession.status === 'connected' && step === 'qr') {
      setStep('connected');
      toast({
        title: "Connected!",
        description: `WhatsApp linked successfully as ${currentSession.whatsappName || currentSession.whatsappNumber}`,
      });
    }
  }, [currentSession?.status, step]);

  const handleStartSetup = () => {
    if (!sessionName.trim()) {
      toast({
        title: "Session Name Required",
        description: "Please enter a name for your WhatsApp session",
        variant: "destructive",
      });
      return;
    }

    // Show consent dialog first
    setShowConsent(true);
  };

  const handleConsentAccepted = async () => {
    // Proceed with creating the session after consent
    createSessionMutation.mutate(sessionName.trim());
    setShowConsent(false); // Close the dialog
  };

  const getStatusBadge = (status: SessionStatus) => {
    const statusConfig = {
      disconnected: { label: 'Disconnected', variant: 'secondary' as const, icon: XCircle },
      connecting: { label: 'Connecting...', variant: 'default' as const, icon: Loader2 },
      connected: { label: 'Connected', variant: 'default' as const, icon: CheckCircle2 },
      expired: { label: 'Expired', variant: 'destructive' as const, icon: AlertTriangle },
      error: { label: 'Error', variant: 'destructive' as const, icon: XCircle },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (sessionsLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Step 1: Input session name
  if (step === 'input') {
    return (
      <>
        <WhatsAppConsentDialog
          open={showConsent}
          onOpenChange={setShowConsent}
          onAccept={handleConsentAccepted}
        />

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Connect WhatsApp</CardTitle>
              <CardDescription>
                Link your WhatsApp account to send messages to customers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Smartphone className="h-4 w-4" />
                <AlertDescription>
                  You'll need your phone with WhatsApp installed to scan a QR code
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="sessionName">Session Name</Label>
                <Input
                  id="sessionName"
                  placeholder="e.g., My Business WhatsApp"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleStartSetup()}
                />
                <p className="text-sm text-muted-foreground">
                  Choose a name to identify this WhatsApp connection
                </p>
              </div>

              {sessions.length > 0 && (
                <div className="space-y-2">
                  <Label>Existing Sessions</Label>
                  <div className="space-y-2">
                    {sessions.map((session) => (
                      <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">{session.sessionName}</p>
                          {session.whatsappNumber && (
                            <p className="text-sm text-muted-foreground">{session.whatsappNumber}</p>
                          )}
                        </div>
                        {getStatusBadge(session.status)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleStartSetup}
                disabled={createSessionMutation.isPending || !sessionName.trim()}
                className="w-full"
              >
                {createSessionMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Session...
                  </>
                ) : (
                  'Generate QR Code'
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </>
    );
  }

  // Step 2: Display QR code
  if (step === 'qr' && currentSession) {
    const timeRemaining = currentSession.qrCodeExpiresAt
      ? Math.max(0, Math.floor((new Date(currentSession.qrCodeExpiresAt).getTime() - Date.now()) / 1000))
      : 0;

    return (
      <Card>
        <CardHeader>
          <CardTitle>Scan QR Code</CardTitle>
          <CardDescription>
            Open WhatsApp on your phone and scan this code
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Smartphone className="h-4 w-4" />
            <AlertDescription>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Open WhatsApp on your phone</li>
                <li>Tap Menu (⋮) or Settings → Linked Devices</li>
                <li>Tap "Link a Device"</li>
                <li>Point your phone at this screen to scan the code</li>
              </ol>
            </AlertDescription>
          </Alert>

          <div className="flex flex-col items-center justify-center space-y-4">
            {currentSession.qrCode ? (
              <>
                <div className="relative bg-white p-4 rounded-lg border-2 border-dashed">
                  <img
                    src={currentSession.qrCode}
                    alt="WhatsApp QR Code"
                    className="w-64 h-64"
                  />
                  {timeRemaining < 30 && timeRemaining > 0 && (
                    <div className="absolute top-2 right-2">
                      <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Expires in {timeRemaining}s
                      </Badge>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {getStatusBadge(currentSession.status)}
                  <span className="text-sm text-muted-foreground">
                    Refresh #{qrRefreshCount + 1}
                  </span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => currentSession.id && refreshQrMutation.mutate(currentSession.id)}
                  disabled={refreshQrMutation.isPending}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${refreshQrMutation.isPending ? 'animate-spin' : ''}`} />
                  Refresh QR Code
                </Button>
              </>
            ) : (
              <div className="flex items-center justify-center h-64 w-64 border-2 border-dashed rounded-lg">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>

          {currentSession.lastErrorMessage && (
            <Alert variant="destructive">
              <AlertDescription>{currentSession.lastErrorMessage}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button
            variant="outline"
            onClick={() => {
              setCurrentSession(null);
              setStep('input');
            }}
            className="w-full"
          >
            Cancel
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Step 3: Connected
  if (step === 'connected' && currentSession) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            WhatsApp Connected
          </CardTitle>
          <CardDescription>
            Your WhatsApp account is linked and ready to send messages
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">Session Name</span>
              <span className="text-muted-foreground">{currentSession.sessionName}</span>
            </div>
            {currentSession.whatsappName && (
              <div className="flex items-center justify-between">
                <span className="font-medium">Account Name</span>
                <span className="text-muted-foreground">{currentSession.whatsappName}</span>
              </div>
            )}
            {currentSession.whatsappNumber && (
              <div className="flex items-center justify-between">
                <span className="font-medium">Phone Number</span>
                <span className="text-muted-foreground">{currentSession.whatsappNumber}</span>
              </div>
            )}
            {currentSession.connectedAt && (
              <div className="flex items-center justify-between">
                <span className="font-medium">Connected At</span>
                <span className="text-muted-foreground">
                  {new Date(currentSession.connectedAt).toLocaleString()}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="font-medium">Status</span>
              {getStatusBadge(currentSession.status)}
            </div>
          </div>

          <Alert>
            <AlertDescription>
              You can now send WhatsApp messages to your customers. Messages will be sent from this connected account.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter>
          <Button
            variant="destructive"
            onClick={() => currentSession.id && disconnectMutation.mutate(currentSession.id)}
            disabled={disconnectMutation.isPending}
            className="w-full"
          >
            {disconnectMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Disconnecting...
              </>
            ) : (
              'Disconnect WhatsApp'
            )}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return null;
}