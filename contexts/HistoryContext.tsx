"use client";

import React, {
  createContext,
  useContext,
  useRef,
  useState,
  ReactNode,
  useCallback,
} from "react";

export interface BillFormValues {
  branch: string;
  date: string;
  startReading?: string;
  endReading?: string;
  hours: string;
  fuelPrice: string;
  total: string;
}

export interface Bill {
  branchId: string;
  billId: string;
  month: string;
  generatedAt: number;
  templateType: string;
  formValues: BillFormValues;
}

interface HistoryContextType {
  /**
   * Returns the cached available months, or null if not yet fetched.
   * Consumers fetch + setMonths on a cache miss.
   */
  getMonths: () => string[] | null;
  setMonths: (months: string[]) => void;

  /**
   * Returns cached bills for a given month+branch key, or null on cache miss.
   * Consumers fetch + setBills on a miss.
   */
  getBills: (month: string, branch: string) => Bill[] | null;
  setBills: (month: string, branch: string, bills: Bill[]) => void;

  /**
   * Clears the entire history cache (months + all bills).
   * Called whenever bill data changes (generate / bulk download) so the
   * next History visit re-fetches fresh data.
   */
  invalidate: () => void;
}

const HistoryContext = createContext<HistoryContextType>({
  getMonths: () => null,
  setMonths: () => {},
  getBills: () => null,
  setBills: () => {},
  invalidate: () => {},
});

const billsKey = (month: string, branch: string) => `${month}|${branch || "all"}`;

export const HistoryProvider = ({ children }: { children: ReactNode }) => {
  // Months cache (null = not yet fetched).
  const monthsRef = useRef<string[] | null>(null);
  // Per-key bills cache: "month|branch" -> Bill[].
  const billsRef = useRef<Map<string, Bill[]>>(new Map());

  // A version counter forces consumers to re-render after invalidate(),
  // so their cache-miss effects re-run and re-fetch.
  const [, setVersion] = useState(0);

  const getMonths = useCallback(() => monthsRef.current, []);

  const setMonths = useCallback((months: string[]) => {
    monthsRef.current = months;
  }, []);

  const getBills = useCallback(
    (month: string, branch: string) => billsRef.current.get(billsKey(month, branch)) ?? null,
    []
  );

  const setBills = useCallback((month: string, branch: string, bills: Bill[]) => {
    billsRef.current.set(billsKey(month, branch), bills);
  }, []);

  const invalidate = useCallback(() => {
    monthsRef.current = null;
    billsRef.current = new Map();
    // Bump version so any mounted History page re-runs its fetch effects.
    setVersion((v) => v + 1);
  }, []);

  return (
    <HistoryContext.Provider
      value={{ getMonths, setMonths, getBills, setBills, invalidate }}
    >
      {children}
    </HistoryContext.Provider>
  );
};

export const useHistory = () => useContext(HistoryContext);
