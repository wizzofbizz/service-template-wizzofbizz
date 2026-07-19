import { siteConfig } from "@/config/site";

import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Orbit, CheckCircle2, XCircle, Loader2 } from "lucide-react";

export default function VerifyEmail() {
  const [location] = useLocation();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link. Please check your email for the correct link.');
      return;
    }

    verifyEmail(token);
  }, []);

  const verifyEmail = async (token: string) => {
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage(data.message || 'Email verified successfully!');
      } else {
        setStatus('error');
        setMessage(data.message || 'Verification failed. Please try again.');
      }
    } catch (error) {
      setStatus('error');
      setMessage('An error occurred during verification. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <Link href="/">
            <div className="inline-flex items-center gap-3 mb-8 cursor-pointer">
              <Orbit className="h-10 w-10" style={{ color: 'hsl(var(--brand))' }} />
              <span className="text-3xl font-normal text-black">{siteConfig.name}</span>
            </div>
          </Link>
        </div>

        <Card className="bg-white border border-gray-200 shadow-[0_2px_4px_rgba(0,0,0,0.08)]">
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl font-normal text-black text-center">
              Email Verification
            </CardTitle>
            <CardDescription className="text-sm font-light text-gray-600 text-center">
              {status === 'verifying' && 'Verifying your email address...'}
              {status === 'success' && 'Your email has been verified!'}
              {status === 'error' && 'Verification failed'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {status === 'verifying' && (
              <div className="flex flex-col items-center gap-4 py-8">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
                <p className="text-gray-600">Please wait while we verify your email...</p>
              </div>
            )}

            {status === 'success' && (
              <>
                <div className="flex flex-col items-center gap-4 py-8">
                  <CheckCircle2 className="h-12 w-12 text-green-600" />
                  <Alert className="bg-green-50 border-green-200">
                    <AlertDescription className="text-green-800">
                      {message}
                    </AlertDescription>
                  </Alert>
                </div>
                <Link href="/login">
                  <Button className="w-full h-12 bg-black text-white hover:bg-gray-800">
                    Continue to Login
                  </Button>
                </Link>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="flex flex-col items-center gap-4 py-8">
                  <XCircle className="h-12 w-12 text-red-600" />
                  <Alert className="bg-red-50 border-red-200">
                    <AlertDescription className="text-red-800">
                      {message}
                    </AlertDescription>
                  </Alert>
                </div>
                <div className="space-y-3">
                  <Link href="/login">
                    <Button variant="outline" className="w-full h-12">
                      Back to Login
                    </Button>
                  </Link>
                  <Link href="/resend-verification">
                    <Button className="w-full h-12 bg-black text-white hover:bg-gray-800">
                      Request New Verification Link
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
