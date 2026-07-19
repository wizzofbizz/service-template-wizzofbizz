import { siteConfig } from "@/config/site";

import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Orbit, CheckCircle2, XCircle } from "lucide-react";

export default function ResetPassword() {
  const [location] = useLocation();
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    
    if (!tokenParam) {
      setStatus('error');
      setMessage('Invalid reset link. Please request a new password reset.');
    } else {
      setToken(tokenParam);
    }
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setStatus('error');
      setMessage('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setStatus('error');
      setMessage('Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);
    setStatus('idle');

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage(data.message);
      } else {
        setStatus('error');
        setMessage(data.message || 'Password reset failed');
      }
    } catch (error) {
      setStatus('error');
      setMessage('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token && status !== 'error') {
    return null;
  }

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
          <h1 className="text-4xl md:text-5xl font-normal mb-4 text-black">Reset Password</h1>
          <p className="text-base font-light text-gray-600">Create a new password for your account</p>
        </div>

        <Card className="bg-white border border-gray-200 shadow-[0_2px_4px_rgba(0,0,0,0.08)]">
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl font-normal text-black">New Password</CardTitle>
            <CardDescription className="text-sm font-light text-gray-600">
              Enter your new password below
            </CardDescription>
          </CardHeader>
          <CardContent>
            {status === 'success' ? (
              <div className="space-y-4">
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
              </div>
            ) : (
              <form onSubmit={handleReset} className="space-y-4">
                {status === 'error' && (
                  <Alert className="bg-red-50 border-red-200">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      {message}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                  <p className="text-xs text-gray-500">Must be at least 8 characters</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                </div>

                <Button 
                  type="submit"
                  className="w-full h-12 bg-black text-white hover:bg-gray-800"
                  disabled={isLoading || !token}
                >
                  {isLoading ? "Resetting..." : "Reset Password"}
                </Button>

                <div className="text-center text-sm">
                  <Link href="/login" className="text-gray-600 hover:underline">
                    Back to Login
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
