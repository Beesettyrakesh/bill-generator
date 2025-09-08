"use client";

import { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import MainLayout from '../main-layout';
import Navigation from '@/components/Navigation';
import branchesData from '../../branches.json';

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

const branches = branchesData.map(branch => branch.name);

export default function HistoryPage() {
  // Keep useSession for authentication protection
  useSession({ required: true });
  const [months, setMonths] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [bills, setBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch available months from API
  useEffect(() => {
    async function fetchMonths() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/bills/available-months');
        if (response.ok) {
          const data = await response.json();
          setMonths(data);
          if (data.length > 0) {
            setSelectedMonth(data[0]);
          }
        } else {
          const errorData = await response.json();
          console.error('Failed to fetch months:', errorData.error || response.statusText);
          setError(errorData.error || 'Failed to fetch months');
          setMonths([]);
          setSelectedMonth('');
        }
      } catch (error) {
        console.error('Error fetching months:', error);
        setError('Failed to connect to the server');
        setMonths([]);
        setSelectedMonth('');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchMonths();
  }, []);
  
  // Fetch bills when month or branch selection changes
  useEffect(() => {
    async function fetchBills() {
      if (!selectedMonth) {
        setBills([]);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      try {
        const url = selectedBranch && selectedBranch !== 'all'
          ? `/api/bills/by-month?month=${selectedMonth}&branchId=${selectedBranch}`
          : `/api/bills/by-month?month=${selectedMonth}`;
          
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setBills(data);
        } else {
          const errorData = await response.json();
          console.error('Failed to fetch bills:', errorData.error || response.statusText);
          setError(errorData.error || 'Failed to fetch bills');
          setBills([]);
        }
      } catch (error) {
        console.error('Error fetching bills:', error);
        setError('Failed to connect to the server');
        setBills([]);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchBills();
  }, [selectedMonth, selectedBranch]);
  
  // Format date for display
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };
  
  // Format month for display
  const formatMonth = (monthString: string): string => {
    if (!monthString) return '';
    const year = monthString.substring(0, 4);
    const month = monthString.substring(4, 6);
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long' });
  };
  
  // Render empty state when no months are available
  if (!isLoading && months.length === 0) {
    return (
      <MainLayout>
        <div className="w-full max-w-[95%] mx-auto py-2 space-y-6">
          <Navigation />
          <Card>
            <CardHeader>
              <CardTitle>Bill History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                {error ? (
                  <div className="text-red-500">{error}</div>
                ) : (
                  <div>
                    <p className="mb-2">No bill history found.</p>
                    <p>Generate some bills to see them here.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="w-full max-w-[95%] mx-auto py-2 space-y-6">
        <Navigation />
        <Card>
          <CardHeader>
            <CardTitle>Bill History</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="text-red-500 mb-4">{error}</div>
            )}
            
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="w-full md:w-1/3">
                <label className="text-sm font-medium mb-1 block">Month</label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth} disabled={isLoading || months.length === 0}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map(month => (
                      <SelectItem key={month} value={month}>
                        {formatMonth(month)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="w-full md:w-1/3">
                <label className="text-sm font-medium mb-1 block">Branch (Optional)</label>
                <Select value={selectedBranch} onValueChange={setSelectedBranch} disabled={isLoading || months.length === 0}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All branches" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All branches</SelectItem>
                    {branches.map(branch => (
                      <SelectItem key={branch} value={branch}>{branch}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {isLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : bills.length === 0 ? (
              <div className="text-center py-8">No bills found for the selected criteria.</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Branch</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Hours/Minutes</TableHead>
                      <TableHead>Fuel Price</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bills.map(bill => (
                      <TableRow key={bill.billId}>
                        <TableCell>{bill.branchId}</TableCell>
                        <TableCell>{formatDate(bill.formValues.date)}</TableCell>
                        <TableCell>{bill.formValues.hours}</TableCell>
                        <TableCell>₹{bill.formValues.fuelPrice}</TableCell>
                        <TableCell>₹{bill.formValues.total}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
