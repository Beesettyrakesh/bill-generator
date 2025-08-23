"use client";

import { useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { } = useSession(); // Keep the hook for session initialization
  
  // We don't need this redirect anymore as it's handled by middleware
  // and we have a separate login layout

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        redirect: false,
        username,
        password,
      });

      if (result?.error) {
        setError("Invalid username or password");
        setIsLoading(false);
      } else {
        // Simple redirect without setTimeout
        router.push("/"); // Redirect to home page after successful login
      }
    } catch (error) {
      setError("An error occurred during sign in");
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsLoading(true);
    setError("");

    try {
      console.log("Attempting demo login...");
      const result = await signIn("credentials", {
        redirect: false,
        username: "demo",
        password: "demo123",
      });

      if (result?.error) {
        console.error("Demo login error:", result.error);
        setError(`Demo login failed: ${result.error}`);
        setIsLoading(false);
      } else {
        console.log("Demo login successful, redirecting...");
        // Simple redirect without setTimeout
        router.push("/"); // Redirect to home page after successful login
      }
    } catch (error) {
      console.error("Demo login exception:", error);
      setError(`An error occurred during demo sign in: ${error instanceof Error ? error.message : String(error)}`);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-[calc(100vh-120px)] bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Bill Generator Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium">
                Username
              </label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Recruiter? Try the demo version
            </p>
            <Button
              variant="outline"
              className="mt-2"
              onClick={handleDemoLogin}
              disabled={isLoading}
            >
              Access Demo
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
