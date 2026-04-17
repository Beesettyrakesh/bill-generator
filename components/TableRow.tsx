"use client";

import { IBankBranch } from "@/interfaces/IBankBranch";
import { useEffect } from "react";
import generateDocument, {
  generateDocumentAsBlob,
  DocumentErrorType,
  DocumentGenerationError,
} from "@/utils/generateDocument";
import calculateTotal from "@/utils/calculateTotal";
import { useDocuments } from "@/contexts/DocumentContext";
import { useBranchForm } from "@/contexts/BranchFormContext";
import { TableCell, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import formatHours from "@/utils/formatHours";
import { useState } from "react";
import { useToast } from "@/components/ui/toast";

interface ValidationErrors {
  date?: string;
  startReading?: string;
  endReading?: string;
  hours?: string;
  fuelPrice?: string;
}

interface TableRowProps {
  branch: IBankBranch;
}

const TableRowComponent = (props: TableRowProps) => {
  const { addDocument } = useDocuments();
  const { getFieldValues, updateField, clearAfterGenerate, clearAll } = useBranchForm();
  const toast = useToast();

  const branchName = props.branch.name;
  const fields = getFieldValues(branchName);

  const { date, startReading, endReading, hours, fuelPrice } = fields;

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);
  const [total, setTotal] = useState<string>("");

  // Derive total from hours + fuelPrice (async)
  useEffect(() => {
    if (!hours || !fuelPrice || !branchName) {
      setTotal("");
      return;
    }
    let cancelled = false;
    calculateTotal(Number(hours), Number(fuelPrice), branchName)
      .then((result) => {
        if (!cancelled) setTotal(result.toFixed(2));
      })
      .catch(() => {
        if (!cancelled) setTotal("");
      });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hours, fuelPrice, branchName]);

  // Auto-populate startReading from previous bill's endReading for START_AND_END branches
  useEffect(() => {
    if (
      props.branch.template === "START_AND_END" &&
      !startReading &&
      endReading
    ) {
      updateField(branchName, "startReading", endReading);
      updateField(branchName, "endReading", "");
    }
  // Only run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-calculate hours for START_AND_END when startReading/endReading change
  useEffect(() => {
    if (
      props.branch.template === "START_AND_END" &&
      startReading &&
      endReading
    ) {
      const start = Number(startReading);
      const end = Number(endReading);
      if (!isNaN(start) && !isNaN(end) && end > start) {
        const calculatedHours = formatHours((end - start).toString(), "START_AND_END");
        updateField(branchName, "hours", calculatedHours);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startReading, endReading, props.branch.template]);

  const handleResetClick = () => {
    if (date || startReading || endReading || hours || fuelPrice) {
      setShowResetConfirmation(true);
    }
  };

  const confirmReset = () => {
    clearAll(branchName);
    setErrors({});
    setShowResetConfirmation(false);
  };

  const validateField = (name: string, value: string): string | undefined => {
    switch (name) {
      case "date":
        if (!value) return "Date is required";
        return undefined;
      case "startReading":
        if (props.branch.template === "START_AND_END") {
          if (!value) return "Start reading is required";
          if (isNaN(Number(value))) return "Must be a number";
        }
        return undefined;
      case "endReading":
        if (props.branch.template === "START_AND_END") {
          if (!value) return "End reading is required";
          if (isNaN(Number(value))) return "Must be a number";
          if (Number(value) <= Number(startReading))
            return "Must be greater than start reading";
        }
        return undefined;
      case "hours":
        if (!value) return "Hours is required";
        if (isNaN(Number(value))) return "Must be a number";
        if (Number(value) <= 0) return "Must be positive";
        if (
          props.branch.template === "MINUTES" &&
          !Number.isInteger(Number(value))
        ) {
          return "Minutes must be a whole number";
        }
        return undefined;
      case "fuelPrice":
        if (!value) return "Fuel price is required";
        if (isNaN(Number(value))) return "Must be a number";
        if (Number(value) <= 0) return "Must be positive";
        return undefined;
      default:
        return undefined;
    }
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};
    newErrors.date = validateField("date", date);
    if (props.branch.template === "START_AND_END") {
      newErrors.startReading = validateField("startReading", startReading);
      newErrors.endReading = validateField("endReading", endReading);
    }
    newErrors.hours = validateField("hours", hours);
    newErrors.fuelPrice = validateField("fuelPrice", fuelPrice);

    const filteredErrors = Object.fromEntries(
      Object.entries(newErrors).filter(([, value]) => value !== undefined)
    );

    setErrors(filteredErrors);
    return Object.keys(filteredErrors).length === 0;
  };

  const handleAddDocument = async () => {
    if (!total) return;
    if (!validateForm()) return;

    try {
      const formValues = {
        branch: branchName,
        date,
        startReading,
        endReading,
        hours,
        fuelPrice,
        total,
      };

      const docBlob = await generateDocumentAsBlob(formValues);
      addDocument({ branch: branchName, formValues, docxBlob: docBlob });
      toast({
        title: "Added to queue",
        description: `${branchName} has been added to the download queue.`,
      });
    } catch (error) {
      console.error("Error adding document:", error);

      if (error instanceof DocumentGenerationError) {
        switch (error.type) {
          case DocumentErrorType.TEMPLATE_NOT_FOUND:
            console.error("Template error:", error.message);
            break;
          case DocumentErrorType.CONVERSION_FAILED:
            console.error("Conversion error:", error.message);
            break;
          case DocumentErrorType.NETWORK_ERROR:
            console.error("Network error:", error.message);
            break;
          case DocumentErrorType.API_ERROR:
            console.error("API error:", error.message);
            break;
          default:
            console.error("Unknown error:", error.message);
        }
      } else {
        alert("Failed to add document. Please try again.");
      }
    }
  };

  const validateAndGenerateDocument = async () => {
    if (!validateForm()) return;

    setIsGenerating(true);

    try {
      await generateDocument({
        branch: branchName,
        date,
        startReading,
        endReading,
        hours,
        fuelPrice,
        total,
      });

      // Clear fields after successful generation — keep endReading and fuelPrice
      clearAfterGenerate(branchName);
      setErrors({});
    } catch (error) {
      console.error("Error generating document:", error);

      if (error instanceof DocumentGenerationError) {
        switch (error.type) {
          case DocumentErrorType.TEMPLATE_NOT_FOUND:
            console.error("Template error:", error.message);
            break;
          case DocumentErrorType.CONVERSION_FAILED:
            console.error("Conversion error:", error.message);
            break;
          case DocumentErrorType.NETWORK_ERROR:
            console.error("Network error:", error.message);
            break;
          case DocumentErrorType.API_ERROR:
            console.error("API error:", error.message);
            break;
          default:
            console.error("Unknown error:", error.message);
        }
      } else {
        alert("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <TableRow>
      <TableCell className="font-medium text-base" data-label="Branch">
        {props.branch.name}
      </TableCell>
      <TableCell data-label="Date">
        <div className="relative">
          <Input
            id={`date-${branchName}`}
            name={`date-${branchName}`}
            type="date"
            value={date}
            onChange={(e) => updateField(branchName, "date", e.target.value)}
            className={cn("text-base w-full px-2", errors.date && "border-destructive")}
          />
          {errors.date && (
            <div className="text-xs text-destructive mt-1">{errors.date}</div>
          )}
        </div>
      </TableCell>

      {props.branch.template === "START_AND_END" ? (
        <>
          <TableCell data-label="Start Reading">
            <div className="relative">
              <Input
                id={`startReading-${branchName}`}
                name={`startReading-${branchName}`}
                type="text"
                placeholder="Start reading"
                value={startReading}
                onChange={(e) => updateField(branchName, "startReading", e.target.value)}
                className={cn(
                  "text-base w-full",
                  errors.startReading && "border-destructive"
                )}
              />
              {errors.startReading && (
                <div className="text-xs text-destructive mt-1">
                  {errors.startReading}
                </div>
              )}
            </div>
          </TableCell>
          <TableCell data-label="End Reading">
            <div className="relative">
              <Input
                id={`endReading-${branchName}`}
                name={`endReading-${branchName}`}
                type="text"
                placeholder="End reading"
                value={endReading}
                onChange={(e) => updateField(branchName, "endReading", e.target.value)}
                className={cn(
                  "text-base w-full",
                  errors.endReading && "border-destructive"
                )}
              />
              {errors.endReading && (
                <div className="text-xs text-destructive mt-1">
                  {errors.endReading}
                </div>
              )}
            </div>
          </TableCell>
        </>
      ) : (
        <>
          <TableCell data-label="Start Reading"></TableCell>
          <TableCell data-label="End Reading"></TableCell>
        </>
      )}

      <TableCell
        data-label={props.branch.template === "MINUTES" ? "Minutes" : "Hours"}
      >
        <div className="relative">
          <Input
            id={`hours-${branchName}`}
            name={`hours-${branchName}`}
            type="text"
            placeholder={
              props.branch.template === "MINUTES" ? "Minutes" : "Hours"
            }
            value={hours}
            onChange={(e) => updateField(branchName, "hours", e.target.value)}
            className={cn("text-base", errors.hours && "border-destructive")}
          />
          {errors.hours && (
            <div className="text-xs text-destructive mt-1">{errors.hours}</div>
          )}
        </div>
      </TableCell>

      <TableCell data-label="Fuel Price">
        <div className="relative">
          <Input
            id={`fuelPrice-${branchName}`}
            name={`fuelPrice-${branchName}`}
            type="text"
            placeholder="Fuel price"
            value={fuelPrice}
            onChange={(e) => updateField(branchName, "fuelPrice", e.target.value)}
            className={cn(
              "text-base",
              errors.fuelPrice && "border-destructive"
            )}
          />
          {errors.fuelPrice && (
            <div className="text-xs text-destructive mt-1">
              {errors.fuelPrice}
            </div>
          )}
        </div>
      </TableCell>

      <TableCell className="font-medium text-base" data-label="Total">
        {total ? `₹${total}` : "-"}
      </TableCell>

      <TableCell data-label="Generate">
        <Button
          variant="default"
          size="sm"
          onClick={validateAndGenerateDocument}
          disabled={!total || isGenerating}
          className="text-base"
        >
          {isGenerating ? "Generating..." : "Generate"}
        </Button>
      </TableCell>

      <TableCell data-label="Add">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleAddDocument}
          disabled={!total}
          className="text-base"
        >
          Add
        </Button>
      </TableCell>

      <TableCell data-label="Reset" className="pr-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handleResetClick}
          disabled={
            !date && !startReading && !endReading && !hours && !fuelPrice
          }
          className="text-base"
        >
          Reset
        </Button>
      </TableCell>

      <Dialog
        open={showResetConfirmation}
        onOpenChange={setShowResetConfirmation}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Reset</DialogTitle>
            <DialogDescription>
              Are you sure you want to reset all fields? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowResetConfirmation(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmReset}>
              Reset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TableRow>
  );
};

export default TableRowComponent;
