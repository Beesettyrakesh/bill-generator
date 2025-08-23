"use client";

import ClientLayout from './client-layout';
import { SessionProvider } from "next-auth/react";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ClientLayout>{children}</ClientLayout>
    </SessionProvider>
  );
}
