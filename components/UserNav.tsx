"use client";

import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export default function UserNav() {
  const { data: session, status } = useSession();
  
  // We'll handle this differently to avoid hydration issues

  if (status === "loading") {
    return <div className="text-sm">Loading...</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <div className="flex items-center gap-4">
      <div className="text-sm font-medium">
        {session.user?.name || session.user?.role || "User"}
      </div>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => signOut({ callbackUrl: "/login" })}
      >
        Logout
      </Button>
    </div>
  );
}
