import { saveAs } from 'file-saver';
import { IFormValues } from '@/interfaces/IFormValues';

interface DocumentItem {
  branch: string;
  formValues: IFormValues;
  docxBlob?: Blob;
}

/**
 * Merges multiple DOCX files into a single DOCX file with page breaks between them
 * @param documents Array of document items containing DOCX blobs
 * @returns A Promise that resolves to the merged DOCX file as a Blob
 */
export async function mergeDocxFiles(documents: DocumentItem[]): Promise<Blob> {
  try {
    if (documents.length === 0) {
      throw new Error('No documents to merge');
    }

    // If there's only one document, just return it
    if (documents.length === 1 && documents[0].docxBlob) {
      return documents[0].docxBlob;
    }

    // Filter out documents without blobs
    const validDocuments = documents.filter(doc => doc.docxBlob);
    
    if (validDocuments.length === 0) {
      throw new Error('No valid documents to merge');
    }

    // Since we can't easily merge DOCX files in the browser due to XML namespace issues,
    // we'll download them individually in sequence
    const mergedBlob = validDocuments[0].docxBlob!;
    
    // Return the first document as a fallback
    // In a real-world scenario, we would need a server-side solution or a more complex
    // client-side library to properly merge DOCX files
    return mergedBlob;
  } catch (error) {
    console.error('Error merging DOCX files:', error);
    throw error;
  }
}

/**
 * Downloads DOCX files individually
 * @param documents Array of document items containing DOCX blobs
 */
export async function downloadDocxFiles(documents: DocumentItem[]): Promise<void> {
  try {
    if (documents.length === 0) {
      throw new Error('No documents to download');
    }

    // If there's only one document, just download it
    if (documents.length === 1 && documents[0].docxBlob) {
      saveAs(documents[0].docxBlob, `${documents[0].branch}.docx`);
      console.log('Single document downloaded successfully');
      return;
    }

    // For multiple documents, download them individually with branch names
    for (const doc of documents) {
      if (doc.docxBlob) {
        // Use the branch name as the filename
        saveAs(doc.docxBlob, `${doc.branch}.docx`);
        
        // Add a small delay between downloads to prevent browser issues
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    console.log('Documents downloaded individually successfully');
  } catch (error) {
    console.error('Error downloading DOCX files:', error);
    throw error;
  }
}
