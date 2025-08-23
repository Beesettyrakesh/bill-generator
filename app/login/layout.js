"use client";

import '../globals.css';
import { SessionProvider } from "next-auth/react";

export default function LoginLayout({ children }) {
  return (
    <SessionProvider>
      <div className="login-container">
      <header className="app-header sticky top-0 z-50">
        <div className="max-w-[98%] mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-bold font-heading">Bill Generator</h1>
          {/* No UserNav here */}
        </div>
      </header>
      <main className="app-main pt-4">
        {children}
      </main>
      <footer className="app-footer">
        <p className="font-serif">&copy; {new Date().getFullYear()} Bill Generator</p>
      </footer>
    </div>
    </SessionProvider>
  );
}
