import TableRowComponent from "@/components/TableRow";
import branchData from "../branches.json";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const TableComponent = () => {
  return (
    <Card className="w-full shadow-md">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-primary hover:bg-primary">
              <TableHead className={cn("text-primary-foreground font-heading text-base")}>Branch</TableHead>
              <TableHead className={cn("text-primary-foreground font-heading text-base")}>Date</TableHead>
              <TableHead className={cn("text-primary-foreground font-heading text-base")}>Start reading</TableHead>
              <TableHead className={cn("text-primary-foreground font-heading text-base")}>End reading</TableHead>
              <TableHead className={cn("text-primary-foreground font-heading text-base")}>Total Hours</TableHead>
              <TableHead className={cn("text-primary-foreground font-heading text-base")}>Fuel Price</TableHead>
              <TableHead className={cn("text-primary-foreground font-heading text-base")}>Total</TableHead>
              <TableHead className={cn("text-primary-foreground font-heading text-base")}></TableHead>
              <TableHead className={cn("text-primary-foreground font-heading text-base")}></TableHead>
              <TableHead className={cn("text-primary-foreground font-heading text-base")}></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {branchData.map((branch) => (
              <TableRowComponent key={branch.id} branch={branch} />
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};

export default TableComponent;
