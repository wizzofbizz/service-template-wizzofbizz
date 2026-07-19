import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Orbit } from "lucide-react";
import { useState } from "react";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const fontFamily = 'AxLLCircular, Helvetica, Arial, sans-serif';

  const handleGoogleRegister = () => {
    window.location.href = "/api/login";
  };

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    if (password.length < 8) {
      alert("Password must be at least 8 characters long");
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
        credentials: "include",
      });

      if (response.ok) {
        // Registration successful, redirect to onboarding or dashboard
        window.location.href = "/dashboard";
      } else {
        const data = await response.json();
        alert(data.message || "Registration failed. Please try again.");
      }
    } catch (error) {
      console.error("❌ Registration error:", error);
      alert("Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <Link href="/">
            <div className="inline-flex items-center gap-3 mb-8 cursor-pointer">
              <Orbit className="h-10 w-10" style={{ color: '#612fff' }} />
              <span className="text-3xl font-normal text-black" style={{ fontFamily }}>ServiceLoop</span>
            </div>
          </Link>
          <h1 className="text-4xl md:text-5xl font-normal mb-4 text-black" style={{ fontFamily }}>Get Started</h1>
          <p className="text-base font-light text-gray-600" style={{ fontFamily }}>Create your business account in minutes</p>
        </div>

        <Card className="bg-white border border-gray-200 shadow-[0_2px_4px_rgba(0,0,0,0.08)]">
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl font-normal text-black" style={{ fontFamily }}>Create Account</CardTitle>
            <CardDescription className="text-sm font-light text-gray-600" style={{ fontFamily }}>
              Start your free trial today - no credit card required
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEmailRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  data-testid="input-name"
                />
              </div>

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
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  data-testid="input-password"
                />
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
                  data-testid="input-confirm-password"
                />
              </div>

              <Button 
                type="submit"
                className="w-full h-12 text-white hover:opacity-90 font-medium rounded-md"
                style={{ backgroundColor: '#612fff' }}
                disabled={isLoading}
                data-testid="button-email-register"
              >
                {isLoading ? "Creating account..." : "Create Account"}
              </Button>
            </form>

            <div className="relative my-6">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-4 text-xs text-gray-500 font-light">
                OR
              </span>
            </div>
            
            <Button 
              onClick={handleGoogleRegister}
              variant="outline"
              className="w-full h-12 font-medium rounded-md" 
              data-testid="button-google-register"
            >
              Continue with Google
            </Button>
            
            <p className="mt-6 text-xs font-light text-gray-500 text-center" style={{ fontFamily }}>
              By signing up, you agree to our Terms of Service and Privacy Policy
            </p>
            
            <div className="mt-8 text-center text-sm">
              <p className="font-light text-gray-600" style={{ fontFamily }}>
                Already have an account?{" "}
                <Link href="/login" className="text-black hover:underline font-medium" data-testid="link-login">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
