"use client";

import { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import ClientLayout from '../client-layout';
import Navigation from '@/components/Navigation';

interface BillFormValues {
  branch: string;
  date: string;
  startReading?: string;
  endReading?: string;
  hours: string;
  fuelPrice: string;
  total: string;
}

interface Bill {
  branchId: string;
  billId: string;
  month: string;
  generatedAt: number;
  templateType: string;
  formValues: BillFormValues;
}

export default function HistoryPage() {
  useSession({ required: true });
  const [months, setMonths] = useState<string[]>([]);
  const [branches, setBranches] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [bills, setBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBranches() {
      try {
        const res = await fetch('/api/config/branches');
        const data: { name: string }[] = await res.json();
        setBranches(data.map((b) => b.name));
      } catch {
        setBranches([]);
      }
    }
    fetchBranches();
  }, []);

  useEffect(() => {
    async function fetchMonths() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/bills/available-months');
        if (response.ok) {
          const data = await response.json();
          setMonths(data);
          if (data.length > 0) setSelectedMonth(data[0]);
        } else {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to fetch months');
          setMonths([]);
          setSelectedMonth('');
        }
      } catch {
        setError('Failed to connect to the server');
        setMonths([]);
        setSelectedMonth('');
      } finally {
        setIsLoading(false);
      }
    }
    fetchMonths();
  }, []);

  useEffect(() => {
    async function fetchBills() {
      if (!selectedMonth) { setBills([]); return; }
      setIsLoading(true);
      setError(null);
      try {
        const url = selectedBranch && selectedBranch !== 'all'
          ? `/api/bills/by-month?month=${selectedMonth}&branchId=${selectedBranch}`
          : `/api/bills/by-month?month=${selectedMonth}`;
        const response = await fetch(url);
        if (response.ok) {
          setBills(await response.json());
        } else {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to fetch bills');
          setBills([]);
        }
      } catch {
        setError('Failed to connect to the server');
        setBills([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchBills();
  }, [selectedMonth, selectedBranch]);

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

          <div className="w-full sm:w-56">
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wide">Branch</label>
            <Select value={selectedBranch} onValueChange={setSelectedBranch} disabled={isLoading || months.length === 0}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All branches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All branches</SelectItem>
                {branches.map((branch) => (
                  <SelectItem key={branch} value={branch}>{branch}</SelectItem>
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
