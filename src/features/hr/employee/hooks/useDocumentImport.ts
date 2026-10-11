import { useState, useRef, useCallback } from 'react';
import type { Employee, User } from '../../../../types/types';
import { employeeService } from '../../../../services/employeeService';
import { storageService } from '../../../../services/storageService';
import { ApiRequestError } from '../../../../utils/apiClient';
import { buildDraftEmployeeFromExtractedData } from '../utils';
import type { InitialDocumentFile } from '../types';

interface UseDocumentImportParams {
  currentUser: User | null;
  onDraftReady: (draftedEmployee: Employee, doc: InitialDocumentFile) => void;
}

export function useDocumentImport({
  currentUser,
  onDraftReady,
}: UseDocumentImportParams) {
  const [addModeModalOpen, setAddModeModalOpen] = useState(false);
  const [parseLoading, setParseLoading] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRefForPds = useRef<HTMLInputElement>(null);

  const parseFile = useCallback(
    async (file: File) => {
      setParseLoading(true);
      setParseError(null);

      try {
        const isPdf =
          file.type === 'application/pdf' ||
          file.type === 'application/x-pdf' ||
          file.name.toLowerCase().endsWith('.pdf');
        if (!isPdf) {
          throw new Error(
            'Only PDF documents are supported. Please select or drop a valid PDF document.'
          );
        }

        if (file.size > 10 * 1024 * 1024) {
          throw new Error(
            'File is too large. Please select a document smaller than 10MB.'
          );
        }

        const parsed = await employeeService.extractEmployeeDocument(file);
        const draftedEmp = buildDraftEmployeeFromExtractedData(parsed);

        const initialDoc: InitialDocumentFile = {
          file,
          documentType: parsed.documentType || 'PDS',
        };

        storageService.addLog(
          currentUser?.username || 'Staff',
          'AI Document Extracted',
          `Imported employee profile draft from "${file.name}" (${parsed.documentType}) via AI extraction.`
        );

        onDraftReady(draftedEmp, initialDoc);
        setAddModeModalOpen(false);
      } catch (err) {
        console.error(err);
        const message =
          err instanceof ApiRequestError
            ? err.message
            : err instanceof Error
              ? err.message
              : 'Could not parse this document. Please check the file and try again.';
        setParseError(message);

        storageService.addLog(
          currentUser?.username || 'Staff',
          'AI Document Extraction Failed',
          `Failed to extract profile from "${file.name}": ${message}`
        );
      } finally {
        setParseLoading(false);
        if (fileInputRefForPds.current) {
          fileInputRefForPds.current.value = '';
        }
      }
    },
    [currentUser, onDraftReady]
  );

  const handleFileSelectAndParse = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      await parseFile(file);
    },
    [parseFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) {
        await parseFile(file);
      }
    },
    [parseFile]
  );

  const openImportModal = useCallback(() => {
    setParseError(null);
    setAddModeModalOpen(true);
  }, []);

  const closeImportModal = useCallback(() => {
    if (!parseLoading) {
      setAddModeModalOpen(false);
    }
  }, [parseLoading]);

  return {
    addModeModalOpen,
    openImportModal,
    closeImportModal,
    parseLoading,
    parseError,
    isDragging,
    fileInputRefForPds,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileSelectAndParse,
  };
}
