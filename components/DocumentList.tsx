"use client";
import { useDocuments } from '@/contexts/DocumentContext';
import '../css/DocumentList.css';
import { useState } from 'react';
import { downloadPdfFiles } from '@/utils/cloudConvertService';
import { generateDocumentAsBlob } from '@/utils/generateDocument';

const DocumentList = () => {
  const { selectedDocuments, removeDocument, clearDocuments } = useDocuments();
  const [isProcessing, setIsProcessing] = useState(false);
  
  console.log('DocumentList rendering, selectedDocuments:', selectedDocuments);
  
  const handleDownload = async () => {
    if (selectedDocuments.length === 0) return;
    
    try {
      setIsProcessing(true);
      console.log('Downloading documents:', selectedDocuments);
      
      // Download PDF files individually
      await downloadPdfFiles(selectedDocuments, generateDocumentAsBlob);
      
      setIsProcessing(false);
    } catch (error) {
      console.error('Error downloading documents:', error);
      alert('Failed to download documents. Please try again.');
      setIsProcessing(false);
    }
  };
  
  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all selected documents?')) {
      clearDocuments();
    }
  };
  
  if (selectedDocuments.length === 0) {
    console.log('No documents selected, not rendering DocumentList');
    return null; // Don't render anything if there are no documents
  }
  
  return (
    <div className="document-list-container">
      <h3 className="document-list-title">Selected Documents</h3>
      <div className="document-list">
        {selectedDocuments.map((doc) => (
          <div key={doc.branch} className="document-item">
            <span>{doc.branch}</span>
            <button 
              className="remove-button"
              onClick={() => removeDocument(doc.branch)}
              aria-label={`Remove ${doc.branch}`}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <div className="document-list-actions">
        <button 
          className="merge-button"
          onClick={handleDownload}
          disabled={isProcessing}
        >
          {isProcessing ? 'Processing...' : 'Download PDF Documents'}
        </button>
        <button 
          className="clear-button"
          onClick={handleClearAll}
          disabled={isProcessing}
        >
          Clear All
        </button>
      </div>
    </div>
  );
};

export default DocumentList;
