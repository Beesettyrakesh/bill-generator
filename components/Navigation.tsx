"use client";

import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FileText, History } from "lucide-react";

export default function Navigation() {
  const router = useRouter();
  const pathname = usePathname();
  
  const isGeneratePage = pathname === "/";
  const isHistoryPage = pathname === "/history";
  
  return (
    <div className="w-full max-w-[95%] mx-auto mb-6">
      <div className="flex flex-wrap gap-4 justify-center">
            <Button
              variant={isGeneratePage ? "default" : "outline"}
              size="lg"
              onClick={() => router.push("/")}
              className="flex items-center gap-2 min-w-[160px]"
            >
              <FileText className="h-5 w-5" />
              <span>Generate Bills</span>
            </Button>
            
            <Button
              variant={isHistoryPage ? "default" : "outline"}
              size="lg"
              onClick={() => router.push("/history")}
              className="flex items-center gap-2 min-w-[160px]"
            >
              <History className="h-5 w-5" />
              <span>Bill History</span>
            </Button>
      </div>
    </div>
  );
}
