"use client";

import { DocumentProvider } from '@/contexts/DocumentContext';
import { FuelPriceProvider } from '@/contexts/FuelPriceContext';
import { Providers } from './providers';
import DemoModeIndicator from '@/components/DemoModeIndicator';
import UserNav from '@/components/UserNav';
import { usePathname } from 'next/navigation';
import './globals.css';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check if current path is the login page
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';
  
  return (
    <Providers>
      <DocumentProvider>
        <FuelPriceProvider>
        <DemoModeIndicator />
        <header className="app-header sticky top-0 z-50">
          <div className="max-w-[98%] mx-auto flex justify-between items-center">
            <h1 className="text-3xl font-bold font-heading">Bill Generator</h1>
            {/* Only show UserNav if not on login page */}
            {!isLoginPage && <UserNav />}
          </div>
        </header>
        <main className="app-main pt-4">
          {children}
        </main>
        <footer className="app-footer">
          <p className="font-serif">&copy; {new Date().getFullYear()} Bill Generator</p>
        </footer>
        </FuelPriceProvider>
      </DocumentProvider>
    </Providers>
  )
}
