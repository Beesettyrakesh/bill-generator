import { saveAs } from 'file-saver';
import { IFormValues } from '@/interfaces/IFormValues';

interface DocumentItem {
  branch: string;
  formValues: IFormValues;
  docxBlob?: Blob;
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
