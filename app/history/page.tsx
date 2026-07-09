"use client";

import { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { useHistory, type Bill } from '@/contexts/HistoryContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import ClientLayout from '../client-layout';
import Navigation from '@/components/Navigation';

export default function HistoryPage() {
  useSession({ required: true });

  // Months + bills are cached in HistoryContext and survive tab switches.
  const { getMonths, setMonths: cacheMonths, getBills, setBills: cacheBills } = useHistory();

  const [months, setMonthsState] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [bills, setBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load months — from cache if present, otherwise fetch once and cache.
  useEffect(() => {
    let cancelled = false;

    async function loadMonths() {
      const cached = getMonths();
      if (cached) {
        setMonthsState(cached);
        if (cached.length > 0 && !selectedMonth) setSelectedMonth(cached[0]);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/bills/available-months');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch months');
        }
        const data: string[] = await response.json();
        if (cancelled) return;
        cacheMonths(data);
        setMonthsState(data);
        if (data.length > 0) setSelectedMonth(data[0]);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Failed to connect to the server');
        setMonthsState([]);
        setSelectedMonth('');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadMonths();
    return () => { cancelled = true; };
    // getMonths identity is stable (useCallback); re-runs when cache is invalidated.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getMonths]);

  // Load bills for the selected month — from cache if present.
  useEffect(() => {
    let cancelled = false;

    async function loadBills() {
      if (!selectedMonth) { setBills([]); return; }

      const cached = getBills(selectedMonth);
      if (cached) {
        setBills(cached);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/bills/by-month?month=${selectedMonth}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch bills');
        }
        const data: Bill[] = await response.json();
        if (cancelled) return;
        cacheBills(selectedMonth, data);
        setBills(data);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Failed to connect to the server');
        setBills([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadBills();
    return () => { cancelled = true; };
    // getBills identity is stable (useCallback); re-runs on month change or invalidation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, getBills]);


  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

  const formatMonth = (m: string) => {
    if (!m) return '';
    const date = new Date(parseInt(m.slice(0, 4)), parseInt(m.slice(4, 6)) - 1, 1);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long' });
  };

  return (
    <ClientLayout>
      <div className="space-y-6">
        <Navigation />

        {/* Page title */}
        <div>
          <h1 className="text-xl font-semibold text-foreground">Bill History</h1>
          <p className="text-sm text-muted-foreground mt-0.5">View and filter previously generated bills</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <div className="w-full sm:w-56">
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wide">Month</label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth} disabled={isLoading || months.length === 0}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month} value={month}>{formatMonth(month)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>


        {/* Error */}
        {error && (
          <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>
        )}

        {/* Table */}
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
              Loading…
            </div>
          ) : months.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-sm font-medium text-foreground">No bill history yet</p>
              <p className="mt-1 text-xs text-muted-foreground">Generate some bills and they&apos;ll appear here.</p>
            </div>
          ) : bills.length === 0 ? (
            <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
              No bills found for the selected criteria.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/60 hover:bg-muted/60">
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Branch</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Date</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Hours / Min</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Fuel Price</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bills.map((bill) => (
                  <TableRow key={bill.billId} className="hover:bg-muted/30">
                    <TableCell className="font-medium text-sm">{bill.branchId}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(bill.formValues.date)}</TableCell>
                    <TableCell className="text-sm">{bill.formValues.hours}</TableCell>
                    <TableCell className="text-sm">₹{bill.formValues.fuelPrice}</TableCell>
                    <TableCell className="text-sm font-semibold text-primary">₹{bill.formValues.total}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </ClientLayout>
  );
}
