"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Table from "@/components/Table";
import DocumentList from "@/components/DocumentList";
import Navigation from "@/components/Navigation";
import ClientLayout from "./client-layout";

export default function Home() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (status === "authenticated") {
    return (
      <ClientLayout>
        <div className="space-y-6">
          <Navigation />
          <Table />
          <DocumentList />
        </div>
      </ClientLayout>
    );
  }

  return null;
}
