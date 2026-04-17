"use client";

import { usePathname, useRouter } from "next/navigation";
import { FileText, History } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Navigation() {
  const router = useRouter();
  const pathname = usePathname();

  const tabs = [
    { label: "Generate Bills", href: "/", icon: FileText },
    { label: "Bill History", href: "/history", icon: History },
  ];

  return (
    <div className="flex items-center gap-1 rounded-lg bg-muted p-1 w-fit max-w-full flex-wrap">
      {tabs.map(({ label, href, icon: Icon }) => {
        const isActive = pathname === href;
        return (
          <button
            key={href}
            onClick={() => router.push(href)}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 sm:px-4 py-2 text-sm font-medium transition-all",
              isActive
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
