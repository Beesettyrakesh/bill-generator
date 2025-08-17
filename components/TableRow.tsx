"use client";
import "../css/TableRow.css";
import { IBankBranch } from "@/interfaces/IBankBranch";
import { useEffect, useState } from "react";
import generateDocument, { generateDocumentAsBlob } from "@/utils/generateDocument";
import calculateTotal from "@/utils/calculateTotal";
import { useDocuments } from "@/contexts/DocumentContext";

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

const TableRow = (props: TableRowProps) => {
  const { addDocument } = useDocuments();
  const [branch] = useState(props.branch.name);
  const [date, setDate] = useState("");
  const [startReading, setStartReading] = useState("");
  const [endReading, setEndReading] = useState("");
  const [hours, setHours] = useState("");
  const [fuelPrice, setFuelPrice] = useState("");
  const [total, setTotal] = useState("");
  const [errors, setErrors] = useState<ValidationErrors>({});

  const reset = () => {
    setDate("");
    setStartReading("");
    setEndReading("");
    setHours("");
    setFuelPrice("");
    setTotal("");
    setErrors({});
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
      alert('Failed to add document. Please try again.');
    }
  };

  return (
    <tr className="bank-row">
      <td className="branch-name">{props.branch.name}</td>
      <td>
        <div className="input-container">
          <input
            type="date"
            value={date}
            onChange={(event) => {
              setDate(event.target.value);
            }}
            className="table-input"
          />
          {errors.date && <div className="error-message">{errors.date}</div>}
        </div>
      </td>
      {props.branch.template === "START_AND_END" && (
        <>
          <td>
            <div className="input-container">
              <input
                type="text"
                placeholder="Start reading"
                value={startReading}
                onChange={(event) => {
                  setStartReading(event.target.value);
                }}
                className="table-input"
              />
              {errors.startReading && <div className="error-message">{errors.startReading}</div>}
            </div>
          </td>
          <td>
            <div className="input-container">
              <input
                type="text"
                placeholder="End reading"
                value={endReading}
                onChange={(event) => {
                  setEndReading(event.target.value);
                }}
                className="table-input"
              />
              {errors.endReading && <div className="error-message">{errors.endReading}</div>}
            </div>
          </td>
        </>
      )}
      {props.branch.template !== "START_AND_END" && (
        <>
          <td></td>
          <td></td>
        </>
      )}
      <td>
        <div className="input-container">
          <input
            type="text"
            placeholder={props.branch.template === "MINUTES" ? "Minutes" : "Hours"}
            value={hours}
            onChange={(event) => {
              setHours(event.target.value);
            }}
            className="table-input"
          />
          {errors.hours && <div className="error-message">{errors.hours}</div>}
        </div>
      </td>
      <td>
        <div className="input-container">
          <input
            type="text"
            placeholder="Fuel price"
            value={fuelPrice}
            onChange={(event) => {
              setFuelPrice(event.target.value);
            }}
            className="table-input"
          />
          {errors.fuelPrice && <div className="error-message">{errors.fuelPrice}</div>}
        </div>
      </td>
      <td className="total-amount">{total ? `₹${total}` : "-"}</td>
      <td>
        <button
          className="action-button generate-button"
          onClick={() => {
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
            
            // If validation passes, generate the document
            generateDocument({
              branch,
              date,
              startReading,
              endReading,
              hours,
              fuelPrice,
              total,
            });
          }}
          disabled={!total}
        >
          Generate Bill
        </button>
      </td>
      <td>
        <button
          className="action-button add-button"
          onClick={handleAddDocument}
          disabled={!total}
        >
          Add
        </button>
      </td>
      <td>
        <button
          className="action-button reset-button"
          onClick={reset}
          disabled={
            !date && !startReading && !endReading && !hours && !fuelPrice
          }
        >
          Reset
        </button>
      </td>
    </tr>
  );
};

export default TableRow;
