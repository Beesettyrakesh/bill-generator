"use client";

import {IBranchConfig} from "@/interfaces/IBranchConfig";
import {branchConfig} from "@/config/branchConfig";
import {demoBranchConfig} from "@/config/demoBranchConfig";
import { getSession } from "next-auth/react";

class BranchNotFoundError extends Error {
  constructor(branch: string) {
    super(`Branch "${branch}" not found in configuration`);
    this.name = "BranchNotFoundError";
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
export const getBranchDetailsAsync = async (branch: string): Promise<IBranchConfig> => {
  const userRole = await getUserRole();
  
  // Use demo config for demo users
  const config = userRole === "demo" ? demoBranchConfig : branchConfig;
  
  const branchData = config[branch as keyof typeof config];
  
  if (!branchData) {
    throw new BranchNotFoundError(branch);
  }
  
  return branchData;
};

// Synchronous version for client components that can't use async/await
const getBranchDetails = (branch: string): IBranchConfig => {
  // For client components, we can't determine the role synchronously
  // So we'll use the regular branch config by default
  // The role-based config will be handled by the server components
  const branchData = branchConfig[branch as keyof typeof branchConfig];
  
  if (!branchData) {
    // Try demo config as fallback
    const demoBranchData = demoBranchConfig[branch as keyof typeof demoBranchConfig];
    if (demoBranchData) {
      return demoBranchData;
    }
    throw new BranchNotFoundError(branch);
  }
  
  return branchData;
};

export default getBranchDetails;
