"use client";

import { demoBranchConfig } from "@/config/demoBranchConfig";
import { IBranchConfig } from "@/interfaces/IBranchConfig";
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
    return "family";
  }
};

// Async version for server components and API routes
export const getBranchDetailsAsync = async (
  branch: string,
): Promise<IBranchConfig> => {
  const userRole = await getUserRole();

  // Use local demo config for demo users
  if (userRole === "demo") {
    const demoBranchData = demoBranchConfig[branch as keyof typeof demoBranchConfig];
    if (!demoBranchData) {
      throw new BranchNotFoundError(branch);
    }
    return demoBranchData;
  }

  // Fetch from DynamoDB via API for real users
  const response = await fetch(`/api/config/branch?name=${encodeURIComponent(branch)}`);

  if (response.status === 404) {
    throw new BranchNotFoundError(branch);
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch branch details for "${branch}"`);
  }

  return response.json() as Promise<IBranchConfig>;
};

// Synchronous version kept for backwards compatibility — always async now via getBranchDetailsAsync
export default getBranchDetailsAsync;
