import { siteConfig } from "@/config/site";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Orbit } from "lucide-react";
import { useEffect, useState } from "react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const fontFamily = 'var(--font-sans)';

  // Google sign-in is optional; hide the button when the server has no
  // Google credentials configured, so it cannot lead to a dead end.
  const [googleAuthEnabled, setGoogleAuthEnabled] = useState(false);

  useEffect(() => {
    fetch("/api/config/features")
      .then((r) => (r.ok ? r.json() : null))
      .then((cfg) => setGoogleAuthEnabled(Boolean(cfg?.googleAuth)))
      .catch(() => setGoogleAuthEnabled(false));
  }, []);

  const handleGoogleLogin = () => {
    console.log("🔐 Initiating Google login...");
    try {
      // Preserve return URL if present
      const params = new URLSearchParams(window.location.search);
      const returnUrl = params.get('return');
      const loginUrl = returnUrl ? `/api/login?return=${returnUrl}` : "/api/login";
      window.location.href = loginUrl;
    } catch (error) {
      console.error("❌ Login error:", error);
      alert("Failed to initiate login. Please try again.");
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      if (response.ok) {
        // Check for return URL
        const params = new URLSearchParams(window.location.search);
        const returnUrl = params.get('return');
        window.location.href = returnUrl ? decodeURIComponent(returnUrl) : "/dashboard";
      } else {
        const data = await response.json();
        alert(data.message || "Login failed. Please check your credentials.");
      }
    } catch (error) {
      console.error("❌ Login error:", error);
      alert("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <Link href="/">
            <div className="inline-flex items-center gap-3 mb-8 cursor-pointer">
              <Orbit className="h-10 w-10" style={{ color: 'hsl(var(--brand))' }} />
              <span className="text-3xl font-normal text-black" style={{ fontFamily }}>{siteConfig.name}</span>
            </div>
          </Link>
          <h1 className="text-4xl md:text-5xl font-normal mb-4 text-black" style={{ fontFamily }}>Welcome Back</h1>
          <p className="text-base font-light text-gray-600" style={{ fontFamily }}>Sign in to manage your business</p>
        </div>

        <Card className="bg-white border border-gray-200 shadow-[0_2px_4px_rgba(0,0,0,0.08)]">
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl font-normal text-black" style={{ fontFamily }}>Login</CardTitle>
            <CardDescription className="text-sm font-light text-gray-600" style={{ fontFamily }}>
              {googleAuthEnabled ? "Sign in with email or Google account" : "Sign in with your email and password"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  data-testid="input-email"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link href="/request-password-reset" className="text-xs text-gray-600 hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  data-testid="input-password"
                />
              </div>

              <Button 
                type="submit"
                className="w-full h-12 text-white hover:opacity-90 font-medium rounded-md"
                style={{ backgroundColor: 'hsl(var(--brand))' }}
                disabled={isLoading}
                data-testid="button-email-login"
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            {googleAuthEnabled && (
              <>
                <div className="relative my-6">
                  <Separator />
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-4 text-xs text-gray-500 font-light">
                    OR
                  </span>
                </div>

                <Button
                  onClick={handleGoogleLogin}
                  variant="outline"
                  className="w-full h-12 font-medium rounded-md"
                  data-testid="button-google-login"
                >
                  Continue with Google
                </Button>
              </>
            )}

            {/* No public sign-up: this is a single-business deployment, and
                accounts are created by the owner, not by visitors. */}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
