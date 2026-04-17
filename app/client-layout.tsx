"use client";

import { DocumentProvider } from '@/contexts/DocumentContext';
import { BranchFormProvider } from '@/contexts/BranchFormContext';
import DemoModeIndicator from '@/components/DemoModeIndicator';
import UserNav from '@/components/UserNav';
import ThemeToggle from '@/components/ThemeToggle';
import { ToastContextProvider } from '@/components/ui/toast';
import { usePathname } from 'next/navigation';
import './globals.css';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  return (
    <DocumentProvider>
      <BranchFormProvider>
        <ToastContextProvider>
        <DemoModeIndicator />
        {/* Slim top header */}
        <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
          <div className="max-w-screen-xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <span className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
              Billezy
            </span>
            <div className="flex items-center gap-1 sm:gap-2">
              <ThemeToggle />
              {!isLoginPage && <UserNav />}
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-screen-xl mx-auto w-full px-4 sm:px-6 py-4 sm:py-8">
          {children}
        </main>

        <footer className="border-t border-border py-4 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Billezy
        </footer>
        </ToastContextProvider>
      </BranchFormProvider>
    </DocumentProvider>
  );
}
