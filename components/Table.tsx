"use client";

import { useState, useEffect } from "react";
import TableRowComponent from "@/components/TableRow";
import demoBranchData from "../demoBranches.json";
import { useSession } from "next-auth/react";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface BranchItem {
  id: number;
  name: string;
  template: string;
  company: string;
}

const headCls = "text-xs font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap px-3";

const TableComponent = () => {
  const { data: session, status } = useSession();
  const isDemo = session?.user?.role === "demo";
  const [branches, setBranches] = useState<BranchItem[]>([]);

  useEffect(() => {
    // Wait until next-auth has resolved the session — avoids a double fetch
    if (status === "loading") return;
    if (isDemo) {
      setBranches(demoBranchData);
      return;
    }

    async function fetchBranches() {
      try {
        const res = await fetch("/api/config/branches");
        const data = await res.json();
        setBranches(data);
      } catch {
        setBranches([]);
      }
    }
    fetchBranches();
  }, [status, isDemo]);

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm w-full overflow-hidden">
      <Table className="w-full mobile-card-view">
        <TableHeader>
          <TableRow className="bg-muted/60 hover:bg-muted/60">
            <TableHead className={headCls}>Branch</TableHead>
            <TableHead className={`${headCls} min-w-[160px]`}>Date</TableHead>
            <TableHead className={`${headCls} min-w-[110px]`}>Start Reading</TableHead>
            <TableHead className={`${headCls} min-w-[110px]`}>End Reading</TableHead>
            <TableHead className={`${headCls} min-w-[90px]`}>Hours / Min</TableHead>
            <TableHead className={`${headCls} min-w-[100px]`}>Fuel Price</TableHead>
            <TableHead className={`${headCls} min-w-[80px]`}>Total</TableHead>
            <TableHead className={`${headCls} min-w-[100px]`}></TableHead>
            <TableHead className={`${headCls} min-w-[60px]`}></TableHead>
            <TableHead className={`${headCls} min-w-[70px] pr-4`}></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {branches.map((branch) => (
            <TableRowComponent key={branch.id} branch={branch} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default TableComponent;
