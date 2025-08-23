"use client";

import { useSession } from "next-auth/react";

export default function DemoModeIndicator() {
  const { data: session } = useSession();
  
  if (session?.user?.role !== "demo") {
    return null;
  }
  
  return (
    <div className="bg-yellow-500 text-black px-4 py-1 text-center text-sm w-full">
      Demo Mode - Using fictional data
    </div>
  );
}
