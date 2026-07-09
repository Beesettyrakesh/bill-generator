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
import { demoCompanyConfig } from "@/config/demoCompanyConfig";
import type { ICompanyConfig } from "@/interfaces/ICompanyConfig";

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
  /** Cached company config lookup (prefetched eagerly). Undefined until ready. */
  getCompany: (name: string) => ICompanyConfig | undefined;
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
  getCompany: () => undefined,
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
  // company name -> config. Prefetched eagerly so document generation never
  // needs a network round-trip for company details.
  const companiesRef = useRef<Map<string, ICompanyConfig>>(new Map());

  // Eagerly prefetch every unique company referenced by the branches, so
  // getCompany() is instant at document-generation / bulk-download time.
  const prefetchCompanies = async (branchList: BranchRecord[]) => {
    const uniqueCompanies = Array.from(
      new Set(branchList.map((b) => b.company).filter(Boolean))
    );
    await Promise.all(
      uniqueCompanies.map(async (companyName) => {
        try {
          const res = await fetch(
            `/api/config/company?name=${encodeURIComponent(companyName)}`
          );
          if (res.ok) {
            companiesRef.current.set(companyName, (await res.json()) as ICompanyConfig);
          }
        } catch {
          // ignore — getCompany falls back to undefined, callers can refetch
        }
      })
    );
  };

  const load = async () => {
    // Demo users: serve entirely from local config, no network.
    if (isDemo) {
      const demoBranches = buildDemoBranches();
      setBranches(demoBranches);
      // Seed the company cache from local demo config.
      Object.entries(demoCompanyConfig).forEach(([name, cfg]) => {
        companiesRef.current.set(name, cfg as ICompanyConfig);
      });
      setIsReady(true);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/config/branches");
      const data: BranchRecord[] = await res.json();
      const list = Array.isArray(data) ? data : [];
      setBranches(list);
      // Prefetch companies (eager) once branches are known.
      await prefetchCompanies(list);
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

  const getCompany = (name: string): ICompanyConfig | undefined =>
    companiesRef.current.get(name);

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
      value={{ branches, getBranch, getCompany, isLoading, isReady, role, refresh }}
    >
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => useContext(ConfigContext);
