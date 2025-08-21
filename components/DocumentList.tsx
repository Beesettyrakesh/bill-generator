"use client";

import { useDocuments } from '@/contexts/DocumentContext';
import { useState } from 'react';
import { downloadPdfFiles } from '@/utils/cloudConvertService';
import { generateDocumentAsBlob } from '@/utils/generateDocument';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

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
    <Card className="mt-8 shadow-md">
      <CardHeader className="bg-muted/50 pb-2">
        <CardTitle className="text-xl font-heading">Selected Documents</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {selectedDocuments.map((doc) => (
            <div 
              key={doc.branch} 
              className="flex items-center justify-between p-2 bg-muted rounded-md border border-border"
            >
              <span className="font-medium font-serif">{doc.branch}</span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-full" 
                onClick={() => removeDocument(doc.branch)}
                aria-label={`Remove ${doc.branch}`}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="default"
          onClick={handleDownload}
          disabled={isProcessing}
        >
          {isProcessing ? 'Processing...' : 'Download PDF Documents'}
        </Button>
        <Button 
          variant="outline"
          onClick={handleClearAll}
          disabled={isProcessing}
        >
          Clear All
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DocumentList;
