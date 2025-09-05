/**
 * Utility functions for converting DOCX to PDF using CloudConvert API
 */

/**
 * Converts a DOCX blob to PDF using the CloudConvert API
 * @param {Blob} docxBlob - The DOCX blob to convert
 * @param {string} filename - The filename to use for the PDF (without extension)
 * @returns {Promise<Blob>} A Promise that resolves to a PDF blob
 */
export async function convertToPdf(docxBlob, filename) {
  try {
    // Create form data for the file upload
    const formData = new FormData();
    formData.append('file', docxBlob, `${filename}.docx`);
    
    // Send to the API endpoint
    const response = await fetch('/api/convert-to-pdf', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
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

/**
 * Generates a PDF document from form values and saves it
 * @param {Object} input - The form values to use for the document
 * @param {string} branch - The branch name to use for the filename
 * @param {Function} generateDocxBlob - Function that generates a DOCX blob from form values
 * @returns {Promise<void>}
 */
export async function generateAndSavePdf(input, branch, generateDocxBlob) {
  try {
    const docxBlob = await generateDocxBlob(input);
    
    try {
      const pdfBlob = await convertToPdf(docxBlob, branch);
      
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${branch}.pdf`;
      
      document.body.appendChild(link);
      link.click();
      
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('PDF conversion failed, falling back to DOCX');
      // Fallback to DOCX if conversion fails
      const url = URL.createObjectURL(docxBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${branch}.docx`;
      
      document.body.appendChild(link);
      link.click();
      
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  } catch (error) {
    console.error('Document generation failed:', error);
    throw error;
  }
}

/**
 * Downloads PDF files individually from DOCX blobs
 * @param {Array} documents - Array of document items containing form values and branch names
 * @param {Function} generateDocxBlob - Function that generates a DOCX blob from form values
 * @returns {Promise<void>}
 */
export async function downloadPdfFiles(documents, generateDocxBlob) {
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
        }
        
        // Add a small delay between downloads to prevent browser issues
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Error processing document ${doc.branch}:`, error);
      }
    }
  } catch (error) {
    console.error('Error downloading files:', error);
    throw error;
  }
}
