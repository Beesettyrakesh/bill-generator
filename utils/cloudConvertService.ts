/**
 * Utility functions for converting DOCX to PDF using CloudConvert API
 */
import type { IFormValues } from '@/interfaces/IFormValues';
import { PDFDocument } from 'pdf-lib';

/**
 * Converts a DOCX blob to PDF using the CloudConvert API
 * @param docxBlob - The DOCX blob to convert
 * @param filename - The filename to use for the PDF (without extension)
 * @returns A Promise that resolves to a PDF blob
 */
export async function convertToPdf(docxBlob: Blob, filename: string): Promise<Blob> {
  try {
    // Create form data for the file upload
    const formData = new FormData();
    formData.append('file', docxBlob, `${filename}.docx`);

    // Send to the API endpoint
    const response = await fetch('/api/convert-to-pdf', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as { details?: string };
      throw new Error(`Conversion failed: ${response.statusText}. ${errorData.details || ''}`);
    }

    // Get the PDF blob from the response
    const pdfBlob = await response.blob();
    return pdfBlob;
  } catch (error) {
    console.error('PDF conversion error:', error);
    throw error;
  }
}

interface DocumentItem {
  formValues: IFormValues;
  branch: string;
}

/**
 * Generates a PDF document from form values and saves it
 * @param input - The form values to use for the document
 * @param branch - The branch name to use for the filename
 * @param generateDocxBlob - Function that generates a DOCX blob from form values
 */
export async function generateAndSavePdf(
  input: IFormValues,
  branch: string,
  generateDocxBlob: (input: IFormValues) => Promise<Blob>
): Promise<void> {
  try {
    // First generate the DOCX blob
    const docxBlob = await generateDocxBlob(input);

    try {
      // Convert to PDF
      const pdfBlob = await convertToPdf(docxBlob, branch);

      // Create a download link
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${branch}.pdf`;

      // Trigger the download
      document.body.appendChild(link);
      link.click();

      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Save bill data to DynamoDB
      await saveBillData(input);
    } catch (error) {
      console.error('PDF conversion failed, falling back to DOCX:', error);
      // Fallback to DOCX if conversion fails
      const url = URL.createObjectURL(docxBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${branch}.docx`;

      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Save bill data to DynamoDB even if PDF conversion fails
      await saveBillData(input);
    }
  } catch (error) {
    console.error('Document generation failed:', error);
    throw error;
  }
}

/**
 * Saves bill data to DynamoDB
 * @param formValues - The form values to save
 */
async function saveBillData(formValues: Record<string, unknown>): Promise<void> {
  try {
    // Get current user from session
    const response = await fetch('/api/auth/session');
    const session = await response.json() as { user?: unknown };
    const user = session?.user;

    // Save bill data to DynamoDB
    await fetch('/api/bills/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        formValues,
        user,
      }),
    });
  } catch (error) {
    console.error('Failed to save bill data:', error);
    // Don't throw error here, as we don't want to interrupt the document download
    // if saving to DynamoDB fails
  }
}

/**
 * Downloads PDF files individually from DOCX blobs
 * @param documents - Array of document items containing form values and branch names
 * @param generateDocxBlob - Function that generates a DOCX blob from form values
 */
export async function downloadPdfFiles(
  documents: DocumentItem[],
  generateDocxBlob: (formValues: IFormValues) => Promise<Blob>
): Promise<void> {
  try {
    if (documents.length === 0) {
      throw new Error('No documents to download');
    }

    // Process each document
    for (const doc of documents) {
      try {
        // Generate DOCX blob
        const docxBlob = await generateDocxBlob(doc.formValues);

        try {
          // Convert to PDF
          const pdfBlob = await convertToPdf(docxBlob, doc.branch);

          // Download the PDF
          const url = URL.createObjectURL(pdfBlob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${doc.branch}.pdf`;

          document.body.appendChild(link);
          link.click();

          document.body.removeChild(link);
          URL.revokeObjectURL(url);

          // Save bill data to DynamoDB
          await saveBillData(doc.formValues);
        } catch (error) {
          console.error(`PDF conversion failed for ${doc.branch}, falling back to DOCX`);

          // Fallback to DOCX
          const url = URL.createObjectURL(docxBlob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${doc.branch}.docx`;

          document.body.appendChild(link);
          link.click();

          document.body.removeChild(link);
          URL.revokeObjectURL(url);

          // Save bill data to DynamoDB even if PDF conversion fails
          await saveBillData(doc.formValues);
        }

        // Add a small delay between downloads to prevent browser issues
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Error processing document ${doc.branch}:`, error);
      }
    }
  } catch (error) {
    console.error('Error downloading files:', error);
    throw error;
  }
}

/**
 * Converts all queued DOCX documents to PDFs, merges them into a single PDF
 * using pdf-lib, and triggers a single download.
 * @param documents - Array of document items containing form values and branch names
 * @param generateDocxBlob - Function that generates a DOCX blob from form values
 */
export async function downloadMergedPdf(
  documents: DocumentItem[],
  generateDocxBlob: (formValues: IFormValues) => Promise<Blob>
): Promise<void> {
  if (documents.length === 0) {
    throw new Error('No documents to download');
  }

  // Step 1: Convert every DOCX to PDF (in parallel for speed)
  const pdfArrayBuffers: ArrayBuffer[] = await Promise.all(
    documents.map(async (doc) => {
      const docxBlob = await generateDocxBlob(doc.formValues);
      const pdfBlob = await convertToPdf(docxBlob, doc.branch);
      // Save bill data to DB for each document
      await saveBillData(doc.formValues);
      return pdfBlob.arrayBuffer();
    })
  );

  // Step 2: Merge all PDFs using pdf-lib
  const mergedPdf = await PDFDocument.create();
  for (const pdfBytes of pdfArrayBuffers) {
    const srcDoc = await PDFDocument.load(pdfBytes);
    const pages = await mergedPdf.copyPages(srcDoc, srcDoc.getPageIndices());
    pages.forEach((page) => mergedPdf.addPage(page));
  }

  // Step 3: Trigger single download
  const mergedPdfBytes = await mergedPdf.save();
  const blob = new Blob([mergedPdfBytes as unknown as ArrayBuffer], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'bills.pdf';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
