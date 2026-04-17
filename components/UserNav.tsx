"use client";

import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export default function UserNav() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="h-8 w-24 animate-pulse rounded-md bg-zinc-100" />;
  }

  if (!session) return null;

  const name = session.user?.name || session.user?.role || "User";
  const initials = name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex items-center gap-3">
      {/* Avatar */}
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
        {initials}
      </div>
      <span className="text-sm font-medium text-foreground hidden sm:block">{name}</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="gap-1.5 text-muted-foreground hover:text-foreground"
      >
        <LogOut className="h-4 w-4" />
        <span className="hidden sm:inline">Logout</span>
      </Button>
    </div>
  );
}
