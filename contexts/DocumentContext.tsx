"use client";

import React, { createContext, useState, useContext, ReactNode } from 'react';
import { IFormValues } from '@/interfaces/IFormValues';

interface DocumentItem {
  branch: string;
  formValues: IFormValues;
  docxBlob?: Blob;
}

interface DocumentContextType {
  selectedDocuments: DocumentItem[];
  addDocument: (document: DocumentItem) => void;
  removeDocument: (branchName: string) => void;
  clearDocuments: () => void;
}

const DocumentContext = createContext<DocumentContextType | undefined>(undefined);

export const DocumentProvider = ({ children }: { children: ReactNode }) => {
  const [selectedDocuments, setSelectedDocuments] = useState<DocumentItem[]>([]);

  const addDocument = (document: DocumentItem) => {
    setSelectedDocuments([...selectedDocuments, document]);
  };

  const removeDocument = (branchName: string) => {
    setSelectedDocuments(selectedDocuments.filter(doc => doc.branch !== branchName));
  };

  const clearDocuments = () => {
    setSelectedDocuments([]);
  };

  return (
    <DocumentContext.Provider value={{ selectedDocuments, addDocument, removeDocument, clearDocuments }}>
      {children}
    </DocumentContext.Provider>
  );
};

export const useDocuments = () => {
  const context = useContext(DocumentContext);
  if (context === undefined) {
    throw new Error('useDocuments must be used within a DocumentProvider');
  }
  return context;
};
