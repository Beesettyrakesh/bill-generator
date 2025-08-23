"use client";

import ClientLayout from './client-layout';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClientLayout>{children}</ClientLayout>
  );
}
