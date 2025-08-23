"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Table from "@/components/Table";
import DocumentList from "@/components/DocumentList";
import MainLayout from "./main-layout";

export default function Home() {
  const { status } = useSession();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Show loading state while checking authentication
  if (status === "loading") {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  // Only render content when authenticated
  if (status === "authenticated") {
    return (
      <MainLayout>
        <div className="w-full max-w-[95%] mx-auto py-2 space-y-6">
          <Table />
          <DocumentList />
        </div>
      </MainLayout>
    );
  }

  // Return empty div while redirecting
  return <div></div>;
}
