"use client";

import TableRowComponent from "@/components/TableRow";
import { useConfig } from "@/contexts/ConfigContext";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const headCls = "text-xs font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap px-3";

const TableComponent = () => {
  // Branches come from the shared ConfigContext cache — fetched once on app
  // load and reused across tab navigations (no re-fetch on mount).
  const { branches } = useConfig();

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
