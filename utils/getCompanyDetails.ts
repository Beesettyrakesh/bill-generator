"use client";

import { ICompanyConfig } from "@/interfaces/ICompanyConfig";
import { demoCompanyConfig } from "@/config/demoCompanyConfig";
import { getSession } from "next-auth/react";

class CompanyNotFoundError extends Error {
  constructor(company: string) {
    super(`Company "${company}" not found in configuration`);
    this.name = "CompanyNotFoundError";
  }
}

// Helper function to get user role from session
const getUserRole = async (): Promise<string> => {
  try {
    const session = await getSession();
    return session?.user?.role || "family";
  } catch (error) {
    console.error("Error getting session:", error);
    return "family";
  }
};

// Async version for server components and API routes
export const getCompanyDetailsAsync = async (company: string): Promise<ICompanyConfig> => {
  const userRole = await getUserRole();

  // Use local demo config for demo users
  if (userRole === "demo") {
    const demoCompanyData = demoCompanyConfig[company as keyof typeof demoCompanyConfig];
    if (!demoCompanyData) {
      throw new CompanyNotFoundError(company);
    }
    return demoCompanyData;
  }

  // Fetch from DynamoDB via API for real users
  const response = await fetch(`/api/config/company?name=${encodeURIComponent(company)}`);

  if (response.status === 404) {
    throw new CompanyNotFoundError(company);
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch company details for "${company}"`);
  }

  return response.json() as Promise<ICompanyConfig>;
};

export default getCompanyDetailsAsync;
