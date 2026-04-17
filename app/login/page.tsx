"use client";

import { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/");
    }
  }, [status, router]);

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
        router.replace("/");
      }
    } catch {
      setError("An error occurred during sign in");
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsLoading(true);
    setError("");
    try {
      const result = await signIn("credentials", {
        redirect: false,
        username: "demo",
        password: "demo123",
      });
      if (result?.error) {
        setError("Demo login failed. Please try again.");
        setIsLoading(false);
      } else {
        router.replace("/");
      }
    } catch (error) {
      setError(
        `An error occurred: ${error instanceof Error ? error.message : String(error)}`
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-primary p-12">
        <div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
            <span className="text-base font-bold text-white">B</span>
          </div>
          <p className="mt-3 text-lg font-semibold text-white">Billezy</p>
        </div>

        <div>
          <h2 className="text-3xl font-bold leading-tight text-white">
            Generate and manage<br />bills effortlessly.
          </h2>
          <p className="mt-3 text-sm text-white/70">
            Streamline your branch billing workflow — create, download, and track bills in one place.
          </p>
        </div>

        <p className="text-xs text-white/50">&copy; {new Date().getFullYear()} Billezy</p>
      </div>

      {/* Right form panel */}
      <div className="flex w-full lg:w-1/2 flex-col items-center justify-center bg-background px-8 py-16">
        <div className="w-full max-w-md">
          {/* Mobile brand (shown only on small screens) */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <span className="text-sm font-bold text-primary-foreground">B</span>
            </div>
            <span className="text-lg font-semibold">Billezy</span>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Welcome back
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Sign in to your account to continue
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {error && (
              <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="username" className="text-sm font-medium text-foreground">
                Username
              </label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="h-11 bg-background"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11 bg-background"
              />
            </div>

            <Button type="submit" className="w-full h-11 text-sm font-medium" disabled={isLoading}>
              {isLoading ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <div className="mt-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="mt-6">
            <p className="mb-3 text-sm text-muted-foreground">
              Recruiter? Explore the app with a live demo — no credentials needed.
            </p>
            <Button
              variant="outline"
              className="w-full h-11 text-sm font-medium bg-background"
              onClick={handleDemoLogin}
              disabled={isLoading}
            >
              Access Demo
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
