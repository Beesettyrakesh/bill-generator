"use client";

import '../globals.css';

export default function LoginLayout({ children }) {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <header className="app-header sticky top-0 z-50">
        <div className="max-w-[98%] mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-bold font-heading">Billezy</h1>
          {/* No UserNav here */}
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center overflow-auto py-4">
        {children}
      </main>
      <footer className="app-footer">
        <p className="font-serif">&copy; {new Date().getFullYear()} Billezy</p>
      </footer>
    </div>
  );
}
