"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";
import { useSession } from "next-auth/react";
import demoBranchData from "../demoBranches.json";
import { demoBranchConfig } from "@/config/demoBranchConfig";

/**
 * Full branch record used across the app.
 * Includes the calculation-relevant fields (consumption / cpm) so that
 * calculateTotal can run synchronously without any network round-trip.
 */
export interface BranchRecord {
  id: number;
  name: string;
  template: string;
  company: string;
  consumption?: number;
  cpm?: number;
  genCapacity?: string;
}

interface ConfigContextType {
  /** All branches (with config). Empty array until loaded. */
  branches: BranchRecord[];
  /** Quick lookup: branch name -> BranchRecord. */
  getBranch: (name: string) => BranchRecord | undefined;
  /** True while the initial branches fetch is in-flight. */
  isLoading: boolean;
  /** True once branches have been loaded at least once. */
  isReady: boolean;
  /** The resolved user role (e.g. "demo", "family"). */
  role: string;
  /** Force a re-fetch of branches (rarely needed). */
  refresh: () => void;
}

const ConfigContext = createContext<ConfigContextType>({
  branches: [],
  getBranch: () => undefined,
  isLoading: false,
  isReady: false,
  role: "family",
  refresh: () => {},
});

/**
 * Builds the demo branch list (with config) from the local demo files,
 * so demo users never hit the network.
 */
function buildDemoBranches(): BranchRecord[] {
  return demoBranchData.map((b) => {
    const cfg = demoBranchConfig[b.name as keyof typeof demoBranchConfig];
    return {
      id: b.id,
      name: b.name,
      template: b.template,
      company: b.company,
      consumption: cfg?.consumption,
      // cpm only exists on some demo branches
      cpm: (cfg as { cpm?: number })?.cpm,
      genCapacity: cfg?.genCapacity,
    };
  });
}

export const ConfigProvider = ({ children }: { children: ReactNode }) => {
  const { data: session, status } = useSession();
  const role = session?.user?.role || "family";
  const isDemo = role === "demo";

  const [branches, setBranches] = useState<BranchRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const fetchedRef = useRef(false);

  const load = async () => {
    // Demo users: serve entirely from local config, no network.
    if (isDemo) {
      setBranches(buildDemoBranches());
      setIsReady(true);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/config/branches");
      const data: BranchRecord[] = await res.json();
      setBranches(Array.isArray(data) ? data : []);
    } catch {
      setBranches([]);
    } finally {
      setIsLoading(false);
      setIsReady(true);
    }
  };

  useEffect(() => {
    // Only fetch once authenticated. The provider now lives at the root
    // layout (so it also mounts on /login) — guarding on "authenticated"
    // avoids a wasted 401 fetch before the user logs in.
    if (status !== "authenticated") return;
    // Only fetch once — this provider persists across tab navigations,
    // so we never re-fetch on route change.
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, isDemo]);


  const getBranch = (name: string): BranchRecord | undefined =>
    branches.find((b) => b.name === name);

  const refresh = () => {
    fetchedRef.current = false;
    setIsReady(false);
    if (status !== "loading") {
      fetchedRef.current = true;
      load();
    }
  };

  return (
    <ConfigContext.Provider
      value={{ branches, getBranch, isLoading, isReady, role, refresh }}
    >
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => useContext(ConfigContext);
