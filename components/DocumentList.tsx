"use client";

import { useDocuments } from '@/contexts/DocumentContext';
import { useBranchForm } from '@/contexts/BranchFormContext';
import { useHistory } from '@/contexts/HistoryContext';
import { useConfig } from '@/contexts/ConfigContext';
import { useState } from 'react';
import { downloadMergedPdf } from '@/utils/cloudConvertService';
import { generateDocumentAsBlob, type ResolvedDocConfig } from '@/utils/generateDocument';
import type { IBranchConfig } from '@/interfaces/IBranchConfig';
import { Button } from '@/components/ui/button';
import { X, Download, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

const DocumentList = () => {
  const { selectedDocuments, removeDocument, clearDocuments } = useDocuments();
  const { clearAfterBulkDownload } = useBranchForm();
  const { invalidate: invalidateHistory } = useHistory();
  const { getBranch, getCompany, role } = useConfig();
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [showClearConfirmation, setShowClearConfirmation] = useState(false);

  const handleDownload = async () => {
    if (selectedDocuments.length === 0) return;

    try {
      setIsProcessing(true);
      setDownloadError(null);
      // Resolve each branch's config from the ConfigContext cache so blob
      // generation skips per-document network fetches (branch/company/session).
      const isDemo = role === 'demo';
      const resolveConfig = (branch: string): ResolvedDocConfig | undefined => {
        const b = getBranch(branch);
        if (!b) return undefined;
        const company = getCompany(b.company);
        if (!company) return undefined;
        const branchDetails: IBranchConfig = {
          company: b.company,
          template: b.template,
          genCapacity: b.genCapacity ?? '',
          consumption: b.consumption ?? 0,
          cpm: b.cpm,
        };
        return { branchDetails, companyDetails: company, isDemo };
      };
      await downloadMergedPdf(selectedDocuments, generateDocumentAsBlob, resolveConfig);
      clearAfterBulkDownload(selectedDocuments.map((doc) => doc.branch));
      // New bills were saved to DynamoDB — clear the History cache so the
      // next History visit shows them.
      invalidateHistory();
      setIsProcessing(false);
    } catch (error) {
      console.error('Error downloading documents:', error);
      setDownloadError('Failed to download documents. Please try again.');
      setIsProcessing(false);
    }
  };

  const handleClearAll = () => setShowClearConfirmation(true);

  const confirmClearAll = () => {
    clearDocuments();
    setShowClearConfirmation(false);
    setDownloadError(null);
  };

  if (selectedDocuments.length === 0) return null;

  return (
    <>
      <div className="rounded-xl border border-border bg-card shadow-sm">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Selected Documents</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{selectedDocuments.length} document{selectedDocuments.length !== 1 ? 's' : ''} queued</p>
          </div>
          <div className="flex items-center gap-2 sm:flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              disabled={isProcessing}
              className="text-muted-foreground hover:text-destructive gap-1.5 flex-1 sm:flex-none"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear all
            </Button>
            <Button
              size="sm"
              onClick={handleDownload}
              disabled={isProcessing}
              className="gap-1.5 flex-1 sm:flex-none"
            >
              <Download className="h-3.5 w-3.5" />
              {isProcessing ? 'Processing…' : 'Download'}
            </Button>
          </div>
        </div>

        {/* Error */}
        {downloadError && (
          <div className="mx-5 mt-4 rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
            {downloadError}
          </div>
        )}

        {/* Document tags */}
        <div className="flex flex-wrap gap-2 p-5">
          {selectedDocuments.map((doc) => (
            <span
              key={doc.branch}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1 text-sm font-medium text-foreground"
            >
              {doc.branch}
              <button
                onClick={() => removeDocument(doc.branch)}
                className="ml-0.5 rounded-full p-0.5 text-muted-foreground hover:bg-zinc-200 hover:text-foreground transition-colors"
                aria-label={`Remove ${doc.branch}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      </div>

      <Dialog open={showClearConfirmation} onOpenChange={setShowClearConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear all documents?</DialogTitle>
            <DialogDescription>
              This will remove all {selectedDocuments.length} queued documents. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClearConfirmation(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmClearAll}>
              Clear all
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DocumentList;
