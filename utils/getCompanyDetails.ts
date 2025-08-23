"use client";

import {ICompanyConfig} from "@/interfaces/ICompanyConfig";
import {companyConfig} from "@/config/companyConfig";
import {demoCompanyConfig} from "@/config/demoCompanyConfig";
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
    return "family"; // Default to family role if there's an error
  }
};

// Async version for server components and API routes
export const getCompanyDetailsAsync = async (company: string): Promise<ICompanyConfig> => {
  const userRole = await getUserRole();
  
  // Use demo config for demo users
  const config = userRole === "demo" ? demoCompanyConfig : companyConfig;
  
  const companyData = config[company as keyof typeof config];
  
  if (!companyData) {
    throw new CompanyNotFoundError(company);
  }
  
  return companyData;
};

// Synchronous version for client components that can't use async/await
const getCompanyDetails = (company: string): ICompanyConfig => {
  // For client components, we can't determine the role synchronously
  // So we'll use the regular company config by default
  // The role-based config will be handled by the server components
  const companyData = companyConfig[company as keyof typeof companyConfig];
  
  if (!companyData) {
    // Try demo config as fallback
    const demoCompanyData = demoCompanyConfig[company as keyof typeof demoCompanyConfig];
    if (demoCompanyData) {
      return demoCompanyData;
    }
    throw new CompanyNotFoundError(company);
  }
  
  return companyData;
};

export default getCompanyDetails;
