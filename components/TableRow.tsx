"use client";

import { IBankBranch } from "@/interfaces/IBankBranch";
import { useEffect, useState } from "react";
import generateDocument, { generateDocumentAsBlob, DocumentErrorType, DocumentGenerationError } from "@/utils/generateDocument";
import calculateTotal from "@/utils/calculateTotal";
import { useDocuments } from "@/contexts/DocumentContext";
import { useFuelPrices } from "@/contexts/FuelPriceContext";
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
  DialogFooter 
} from "@/components/ui/dialog";

// Validation types
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
  const { fuelPrices, updateFuelPrice, verifyPersistence } = useFuelPrices();
  const [branch] = useState(props.branch.name);
  const [date, setDate] = useState("");
  const [startReading, setStartReading] = useState("");
  const [endReading, setEndReading] = useState("");
  const [hours, setHours] = useState("");
  const [fuelPrice, setFuelPrice] = useState("");
  const [total, setTotal] = useState("");
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);
  
  // Load cached fuel price when component mounts
  useEffect(() => {
    console.log(`TableRow(${branch}): Loading cached fuel price`);
    const cachedPrice = fuelPrices[branch];
    if (cachedPrice) {
      console.log(`TableRow(${branch}): Found cached price: ${cachedPrice}`);
      setFuelPrice(cachedPrice);
    } else {
      console.log(`TableRow(${branch}): No cached price found`);
    }
    
    // Check if persistence is working
    const isPersistenceWorking = verifyPersistence();
    console.log(`TableRow(${branch}): Persistence verification: ${isPersistenceWorking ? 'OK' : 'FAILED'}`);
  }, [branch, fuelPrices, verifyPersistence]);

  const handleResetClick = () => {
    // Only show dialog if there's data to clear
    if (date || startReading || endReading || hours || fuelPrice) {
      setShowResetConfirmation(true);
    }
  };

  const confirmReset = () => {
    setDate("");
    setStartReading("");
    setEndReading("");
    setHours("");
    setFuelPrice("");
    setTotal("");
    setErrors({});
    setShowResetConfirmation(false);
  };
  
  // Validate form fields
  const validateField = (name: string, value: string): string | undefined => {
    switch (name) {
      case 'date':
        if (!value) return 'Date is required';
        return undefined;
      case 'startReading':
        if (props.branch.template === 'START_AND_END') {
          if (!value) return 'Start reading is required';
          if (isNaN(Number(value))) return 'Must be a number';
        }
        return undefined;
      case 'endReading':
        if (props.branch.template === 'START_AND_END') {
          if (!value) return 'End reading is required';
          if (isNaN(Number(value))) return 'Must be a number';
          if (Number(value) <= Number(startReading)) return 'Must be greater than start reading';
        }
        return undefined;
      case 'hours':
        if (!value) return 'Hours is required';
        if (isNaN(Number(value))) return 'Must be a number';
        if (Number(value) <= 0) return 'Must be positive';
        if (props.branch.template === 'MINUTES' && !Number.isInteger(Number(value))) {
          return 'Minutes must be a whole number';
        }
        return undefined;
      case 'fuelPrice':
        if (!value) return 'Fuel price is required';
        if (isNaN(Number(value))) return 'Must be a number';
        if (Number(value) <= 0) return 'Must be positive';
        return undefined;
      default:
        return undefined;
    }
  };
  
  // Auto-calculate hours for START_AND_END template branches
  useEffect(() => {
    if (props.branch.template === 'START_AND_END' && startReading && endReading) {
      const start = Number(startReading);
      const end = Number(endReading);
      
      if (!isNaN(start) && !isNaN(end) && end > start) {
        const calculatedHours = (end - start).toString();
        setHours(calculatedHours);
      }
    }
  }, [startReading, endReading, props.branch.template]);

  useEffect(() => {
    if (hours && fuelPrice && branch) {
      const billTotal: number = calculateTotal(
        Number(hours),
        Number(fuelPrice),
        branch
      );
      setTotal(billTotal.toFixed(2));
    } else {
      setTotal("");
    }
  }, [hours, fuelPrice, branch]);

  const handleAddDocument = async () => {
    if (!total) return;
    
    // Validate all fields before submission
    const newErrors: ValidationErrors = {};
    newErrors.date = validateField('date', date);
    if (props.branch.template === 'START_AND_END') {
      newErrors.startReading = validateField('startReading', startReading);
      newErrors.endReading = validateField('endReading', endReading);
    }
    newErrors.hours = validateField('hours', hours);
    newErrors.fuelPrice = validateField('fuelPrice', fuelPrice);
    
    // Filter out undefined errors
    const filteredErrors = Object.fromEntries(
      Object.entries(newErrors).filter(([, value]) => value !== undefined)
    );
    
    setErrors(filteredErrors);
    
    // If there are errors, don't proceed
    if (Object.keys(filteredErrors).length > 0) {
      return;
    }
    
    try {
      console.log('Adding document for branch:', branch);
      
      const formValues = {
        branch,
        date,
        startReading,
        endReading,
        hours,
        fuelPrice,
        total,
      };
      
      console.log('Form values:', formValues);
      
      // Generate document blob
      const docBlob = await generateDocumentAsBlob(formValues);
      console.log('Document blob generated:', docBlob);
      
      // Add to document list
      addDocument({ branch, formValues, docxBlob: docBlob });
      console.log('Document added to list');
      
    } catch (error) {
      console.error('Error adding document:', error);
      
      // Handle specific error types
      if (error instanceof DocumentGenerationError) {
        // Error is already handled in generateDocument with specific messages
        // We could add additional UI feedback here if needed
        switch (error.type) {
          case DocumentErrorType.TEMPLATE_NOT_FOUND:
            console.error('Template error:', error.message);
            break;
          case DocumentErrorType.CONVERSION_FAILED:
            console.error('Conversion error:', error.message);
            break;
          case DocumentErrorType.NETWORK_ERROR:
            console.error('Network error:', error.message);
            break;
          case DocumentErrorType.API_ERROR:
            console.error('API error:', error.message);
            break;
          default:
            console.error('Unknown error:', error.message);
        }
      } else {
        // Fallback for unexpected error types
        alert('Failed to add document. Please try again.');
      }
    }
  };

  const validateAndGenerateDocument = async () => {
    // Validate all fields before generating document
    const newErrors: ValidationErrors = {};
    newErrors.date = validateField('date', date);
    if (props.branch.template === 'START_AND_END') {
      newErrors.startReading = validateField('startReading', startReading);
      newErrors.endReading = validateField('endReading', endReading);
    }
    newErrors.hours = validateField('hours', hours);
    newErrors.fuelPrice = validateField('fuelPrice', fuelPrice);
    
    // Filter out undefined errors
    const filteredErrors = Object.fromEntries(
      Object.entries(newErrors).filter(([, value]) => value !== undefined)
    );
    
    setErrors(filteredErrors);
    
    // If there are errors, don't proceed
    if (Object.keys(filteredErrors).length > 0) {
      return;
    }
    
    // Set loading state to true before generating document
    setIsGenerating(true);
    
    try {
      // If validation passes, generate the document
      await generateDocument({
        branch,
        date,
        startReading,
        endReading,
        hours,
        fuelPrice,
        total,
      });
    } catch (error) {
      console.error('Error generating document:', error);
      
      // Handle specific error types
      if (error instanceof DocumentGenerationError) {
        // Error is already handled in generateDocument with specific messages
        // We could add additional UI feedback here if needed
        switch (error.type) {
          case DocumentErrorType.TEMPLATE_NOT_FOUND:
            // Could add specific UI feedback for template errors
            console.error('Template error:', error.message);
            break;
          case DocumentErrorType.CONVERSION_FAILED:
            // Could add specific UI feedback for conversion errors
            console.error('Conversion error:', error.message);
            break;
          case DocumentErrorType.NETWORK_ERROR:
            // Could add specific UI feedback for network errors
            console.error('Network error:', error.message);
            break;
          case DocumentErrorType.API_ERROR:
            // Could add specific UI feedback for API errors
            console.error('API error:', error.message);
            break;
          default:
            // Unknown error
            console.error('Unknown error:', error.message);
        }
      } else {
        // Fallback for unexpected error types
        alert('An unexpected error occurred. Please try again.');
      }
    } finally {
      // Set loading state back to false after document generation
      setIsGenerating(false);
    }
  };

  return (
    <TableRow>
      <TableCell className="font-medium text-base" data-label="Branch">{props.branch.name}</TableCell>
      <TableCell data-label="Date">
        <div className="relative">
          <Input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className={cn("text-base", errors.date && "border-destructive")}
          />
          {errors.date && <div className="text-xs text-destructive mt-1">{errors.date}</div>}
        </div>
      </TableCell>
      
      {props.branch.template === "START_AND_END" ? (
        <>
          <TableCell data-label="Start Reading">
            <div className="relative">
              <Input
                type="text"
                placeholder="Start reading"
                value={startReading}
                onChange={(event) => setStartReading(event.target.value)}
                className={cn("text-base", errors.startReading && "border-destructive")}
              />
              {errors.startReading && <div className="text-xs text-destructive mt-1">{errors.startReading}</div>}
            </div>
          </TableCell>
          <TableCell data-label="End Reading">
            <div className="relative">
              <Input
                type="text"
                placeholder="End reading"
                value={endReading}
                onChange={(event) => setEndReading(event.target.value)}
                className={cn("text-base", errors.endReading && "border-destructive")}
              />
              {errors.endReading && <div className="text-xs text-destructive mt-1">{errors.endReading}</div>}
            </div>
          </TableCell>
        </>
      ) : (
        <>
          <TableCell data-label="Start Reading"></TableCell>
          <TableCell data-label="End Reading"></TableCell>
        </>
      )}
      
      <TableCell data-label={props.branch.template === "MINUTES" ? "Minutes" : "Hours"}>
        <div className="relative">
          <Input
            type="text"
            placeholder={props.branch.template === "MINUTES" ? "Minutes" : "Hours"}
            value={hours}
            onChange={(event) => setHours(event.target.value)}
            className={cn("text-base", errors.hours && "border-destructive")}
          />
          {errors.hours && <div className="text-xs text-destructive mt-1">{errors.hours}</div>}
        </div>
      </TableCell>
      
      <TableCell data-label="Fuel Price">
        <div className="relative">
          <Input
            type="text"
            placeholder="Fuel price"
            value={fuelPrice}
            onChange={(event) => {
              const newPrice = event.target.value;
              setFuelPrice(newPrice);
              
              // Update the global fuel price if it's valid
              if (newPrice && !isNaN(Number(newPrice)) && Number(newPrice) > 0) {
                updateFuelPrice(branch, newPrice);
              }
            }}
            className={cn("text-base", errors.fuelPrice && "border-destructive")}
          />
          {errors.fuelPrice && <div className="text-xs text-destructive mt-1">{errors.fuelPrice}</div>}
        </div>
      </TableCell>
      
      <TableCell className="font-medium text-base" data-label="Total">{total ? `₹${total}` : "-"}</TableCell>
      
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
      
      <TableCell data-label="Reset">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetClick}
            disabled={!date && !startReading && !endReading && !hours && !fuelPrice}
            className="text-base"
          >
            Reset
          </Button>
      </TableCell>

      {/* Reset Confirmation Dialog */}
      <Dialog open={showResetConfirmation} onOpenChange={setShowResetConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Reset</DialogTitle>
            <DialogDescription>
              Are you sure you want to reset all fields? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetConfirmation(false)}>
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
