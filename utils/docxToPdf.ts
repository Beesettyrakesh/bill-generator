import { PDFDocument, StandardFonts, rgb, PageSizes } from 'pdf-lib';
import { IFormValues } from '@/interfaces/IFormValues';
import getBranchDetails from './getBranchDetails';
import getCompanyDetails from './getCompanyDetails';

interface DocumentItem {
  branch: string;
  formValues: IFormValues;
  docxBlob?: Blob;
}

/**
 * Converts a DOCX document to PDF format while preserving the layout as much as possible
 * @param doc The document item containing branch and form values
 * @returns A Promise that resolves to a PDF document
 */
export async function convertDocxToPdf(doc: DocumentItem): Promise<PDFDocument> {
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();
  
  // Embed fonts
  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesBoldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const timesItalicFont = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
  
  // Get branch and company details
  const branchDetails = getBranchDetails(doc.branch);
  const companyDetails = getCompanyDetails(branchDetails.company);
  
  // Add a new page (A4 size)
  const page = pdfDoc.addPage(PageSizes.A4);
  const { width, height } = page.getSize();
  const margin = 50;
  
  // Draw border
  page.drawRectangle({
    x: margin,
    y: margin,
    width: width - (margin * 2),
    height: height - (margin * 2),
    borderColor: rgb(0.8, 0.8, 0.8),
    borderWidth: 1,
    opacity: 0.5,
  });
  
  // Add company header
  page.drawText(branchDetails.company, {
    x: margin + 20,
    y: height - margin - 40,
    size: 24,
    font: timesBoldFont,
    color: rgb(0.1, 0.3, 0.6),
  });
  
  // Add company address
  const addressLines = companyDetails.address.split(',');
  addressLines.forEach((line, index) => {
    page.drawText(line.trim(), {
      x: margin + 20,
      y: height - margin - 70 - (index * 20),
      size: 10,
      font: timesRomanFont,
      color: rgb(0.3, 0.3, 0.3),
    });
  });
  
  // Add contact info
  page.drawText(`Contact: ${companyDetails.contact}`, {
    x: margin + 20,
    y: height - margin - 70 - (addressLines.length * 20) - 20,
    size: 10,
    font: timesRomanFont,
    color: rgb(0.3, 0.3, 0.3),
  });
  
  // Add bill title
  page.drawText(`BILL FOR ${doc.branch.toUpperCase()}`, {
    x: width / 2 - 100,
    y: height - margin - 150,
    size: 18,
    font: timesBoldFont,
    color: rgb(0, 0, 0),
  });
  
  // Add bill details section
  const startY = height - margin - 200;
  const colWidth = (width - (margin * 2) - 40) / 2;
  
  // Left column - Bill details
  const leftDetails = [
    { label: "Date", value: doc.formValues.date || 'N/A' },
    { label: "Generator Capacity", value: branchDetails.genCapacity || 'N/A' },
    { label: "Consumption Rate", value: `${branchDetails.consumption} L/hr` },
  ];
  
  if (branchDetails.template === "START_AND_END") {
    leftDetails.push(
      { label: "Start Reading", value: doc.formValues.startReading || 'N/A' },
      { label: "End Reading", value: doc.formValues.endReading || 'N/A' }
    );
  }
  
  // Right column - Financial details
  const rightDetails = [
    { label: "Hours", value: doc.formValues.hours || 'N/A' },
    { label: "Fuel Price", value: `Rs. ${doc.formValues.fuelPrice || 'N/A'}` },
    { label: "Total Amount", value: `Rs. ${doc.formValues.total || 'N/A'}` },
  ];
  
  // Draw left column
  leftDetails.forEach((detail, index) => {
    // Label
    page.drawText(`${detail.label}:`, {
      x: margin + 20,
      y: startY - (index * 25),
      size: 12,
      font: timesBoldFont,
      color: rgb(0.2, 0.2, 0.2),
    });
    
    // Value
    page.drawText(detail.value, {
      x: margin + 150,
      y: startY - (index * 25),
      size: 12,
      font: timesRomanFont,
      color: rgb(0, 0, 0),
    });
  });
  
  // Draw right column
  rightDetails.forEach((detail, index) => {
    // Label
    page.drawText(`${detail.label}:`, {
      x: margin + colWidth + 40,
      y: startY - (index * 25),
      size: 12,
      font: timesBoldFont,
      color: rgb(0.2, 0.2, 0.2),
    });
    
    // Value
    page.drawText(detail.value, {
      x: margin + colWidth + 170,
      y: startY - (index * 25),
      size: 12,
      font: timesRomanFont,
      color: rgb(0, 0, 0),
    });
  });
  
  // Draw horizontal line
  const lineY = startY - (Math.max(leftDetails.length, rightDetails.length) * 25) - 20;
  page.drawLine({
    start: { x: margin + 20, y: lineY },
    end: { x: width - margin - 20, y: lineY },
    thickness: 1,
    color: rgb(0.7, 0.7, 0.7),
  });
  
  // Add account details
  page.drawText("Account Details:", {
    x: margin + 20,
    y: lineY - 30,
    size: 12,
    font: timesBoldFont,
    color: rgb(0.2, 0.2, 0.2),
  });
  
  page.drawText(companyDetails.account, {
    x: margin + 20,
    y: lineY - 50,
    size: 10,
    font: timesRomanFont,
    color: rgb(0.3, 0.3, 0.3),
  });
  
  // Add footer
  page.drawText('Generated with Bill Generator', {
    x: width / 2 - 80,
    y: margin + 20,
    size: 10,
    font: timesItalicFont,
    color: rgb(0.5, 0.5, 0.5),
  });
  
  return pdfDoc;
}

/**
 * Merges multiple PDF documents into a single PDF
 * @param pdfDocs Array of PDF documents to merge
 * @returns A Promise that resolves to a merged PDF document
 */
export async function mergePdfDocuments(pdfDocs: PDFDocument[]): Promise<PDFDocument> {
  // Create a new PDF document
  const mergedPdf = await PDFDocument.create();
  
  // Copy pages from each PDF document
  for (const pdfDoc of pdfDocs) {
    const pages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
    pages.forEach(page => mergedPdf.addPage(page));
  }
  
  return mergedPdf;
}

/**
 * Converts multiple documents to PDF and merges them into a single PDF
 * @param documents Array of document items to convert and merge
 * @returns A Promise that resolves to a Blob containing the merged PDF
 */
export async function convertAndMergeToPdf(documents: DocumentItem[]): Promise<Blob> {
  try {
    // Convert each document to PDF
    const pdfDocs: PDFDocument[] = [];
    for (const doc of documents) {
      const pdfDoc = await convertDocxToPdf(doc);
      pdfDocs.push(pdfDoc);
    }
    
    // Merge PDF documents
    const mergedPdf = await mergePdfDocuments(pdfDocs);
    
    // Save the merged PDF
    const pdfBytes = await mergedPdf.save();
    
    // Convert to blob
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    
    return blob;
  } catch (error) {
    console.error('Error converting and merging to PDF:', error);
    throw error;
  }
}
