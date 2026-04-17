"use client";

import React, { createContext, useState, useContext, useEffect, useRef } from 'react';

export interface BranchFieldValues {
  date: string;
  startReading: string;
  endReading: string;
  hours: string;
  fuelPrice: string;
}

const EMPTY_FIELDS: BranchFieldValues = {
  date: '',
  startReading: '',
  endReading: '',
  hours: '',
  fuelPrice: '',
};

const LS_KEY = 'branchFormData';

const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, value);
    } catch {
      // ignore
    }
  },
};

interface BranchFormContextType {
  /** Returns the stored field values for a branch (falls back to empty fields). */
  getFieldValues: (branch: string) => BranchFieldValues;
  /** Updates a single field for a branch and persists to localStorage. */
  updateField: (branch: string, field: keyof BranchFieldValues, value: string) => void;
  /**
   * Called after a bill is generated successfully.
   * Clears date, startReading and hours — keeps endReading and fuelPrice.
   */
  clearAfterGenerate: (branch: string) => void;
  /**
   * Called by the Reset button.
   * Clears ALL fields including endReading and fuelPrice.
   */
  clearAll: (branch: string) => void;
  /**
   * Called after bulk PDF download succeeds.
   * Applies clearAfterGenerate to every branch in the list.
   */
  clearAfterBulkDownload: (branches: string[]) => void;
}

const BranchFormContext = createContext<BranchFormContextType>({
  getFieldValues: () => ({ ...EMPTY_FIELDS }),
  updateField: () => {},
  clearAfterGenerate: () => {},
  clearAll: () => {},
  clearAfterBulkDownload: () => {},
});

export const BranchFormProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [formData, setFormData] = useState<Record<string, BranchFieldValues>>({});
  const initialized = useRef(false);

  // Load from localStorage on mount; if nothing saved, seed with branch names from API
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const saved = safeLocalStorage.getItem(LS_KEY);
    if (saved) {
      try {
        setFormData(JSON.parse(saved));
        return;
      } catch {
        // fall through to fetch
      }
    }

    // No saved data — seed from DynamoDB: branch names/templates + latest bill data
    async function seedBranches() {
      try {
        // Call A + Call B in parallel
        const [branchesRes, monthsRes] = await Promise.all([
          fetch('/api/config/branches'),
          fetch('/api/bills/available-months'),
        ]);

        const branches: { name: string; template: string }[] = await branchesRes.json();
        const months: string[] = await monthsRes.json();

        // Build base structure with empty fields for every branch (safety net)
        const initial: Record<string, BranchFieldValues> = {};
        branches.forEach((b) => {
          initial[b.name] = { ...EMPTY_FIELDS };
        });

        // Build template lookup map
        const templateMap: Record<string, string> = {};
        branches.forEach((b) => {
          templateMap[b.name] = b.template;
        });

        // Call C — fetch latest month's bills if any months exist
        if (months.length > 0) {
          const latestMonth = months[0];
          const billsRes = await fetch(`/api/bills/by-month?month=${latestMonth}`);
          const bills: { branchId: string; formValues: { fuelPrice?: string; endReading?: string } }[] =
            await billsRes.json();

          bills.forEach((bill) => {
            const branchName = bill.branchId;
            if (!initial[branchName]) {
              // Branch exists in bills but not in config — still seed it
              initial[branchName] = { ...EMPTY_FIELDS };
            }
            // Always seed fuelPrice from last bill
            if (bill.formValues?.fuelPrice) {
              initial[branchName].fuelPrice = bill.formValues.fuelPrice;
            }
            // Seed startReading from last bill's endReading — only for START_AND_END branches
            if (
              templateMap[branchName] === 'START_AND_END' &&
              bill.formValues?.endReading
            ) {
              initial[branchName].startReading = bill.formValues.endReading;
            }
          });
        }

        setFormData(initial);
      } catch {
        // leave formData empty; individual rows will still work via getFieldValues fallback
      }
    }
    seedBranches();
  }, []);

  // Persist to localStorage whenever formData changes
  useEffect(() => {
    if (Object.keys(formData).length === 0) return;
    safeLocalStorage.setItem(LS_KEY, JSON.stringify(formData));
  }, [formData]);

  const getFieldValues = (branch: string): BranchFieldValues =>
    formData[branch] ?? { ...EMPTY_FIELDS };

  const updateField = (branch: string, field: keyof BranchFieldValues, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [branch]: {
        ...(prev[branch] ?? { ...EMPTY_FIELDS }),
        [field]: value,
      },
    }));
  };

  const clearAfterGenerate = (branch: string) => {
    setFormData((prev) => ({
      ...prev,
      [branch]: {
        date: '',
        startReading: '',
        endReading: prev[branch]?.endReading ?? '',
        hours: '',
        fuelPrice: prev[branch]?.fuelPrice ?? '',
      },
    }));
  };

  const clearAll = (branch: string) => {
    setFormData((prev) => ({
      ...prev,
      [branch]: { ...EMPTY_FIELDS },
    }));
  };

  const clearAfterBulkDownload = (branches: string[]) => {
    setFormData((prev) => {
      const next = { ...prev };
      branches.forEach((branch) => {
        next[branch] = {
          date: '',
          startReading: '',
          endReading: prev[branch]?.endReading ?? '',
          hours: '',
          fuelPrice: prev[branch]?.fuelPrice ?? '',
        };
      });
      return next;
    });
  };

  return (
    <BranchFormContext.Provider
      value={{ getFieldValues, updateField, clearAfterGenerate, clearAll, clearAfterBulkDownload }}
    >
      {children}
    </BranchFormContext.Provider>
  );
};

export const useBranchForm = () => useContext(BranchFormContext);
