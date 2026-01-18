import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

export interface PendingFile {
  id: string;
  file: File;
  type: 'Clinical' | 'Text';
  name: string;
  size: string;
  mimeType?: string;
  rawText?: string;
}

export interface Step1Data {
  caseName: string;
  patientName: string;
  age: string;
  sex: string;
  cancerType: string;
}

interface CaseCreationContextType {
  step1Data: Step1Data | null;
  setStep1Data: (data: Step1Data | null) => void;
  pendingFiles: PendingFile[];
  setPendingFiles: (files: PendingFile[] | ((prev: PendingFile[]) => PendingFile[])) => void;
  addFiles: (files: PendingFile[]) => { success: boolean; duplicates: string[] };
  removeFile: (id: string) => void;
  clearAll: () => void;
}

const CaseCreationContext = createContext<CaseCreationContextType | undefined>(undefined);

export function CaseCreationProvider({ children }: { children: ReactNode }) {
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);

  const addFiles = useCallback((newFiles: PendingFile[]): { success: boolean; duplicates: string[] } => {
    const existingNames = new Set(pendingFiles.map(f => f.name.toLowerCase()));
    const duplicates: string[] = [];
    const filesToAdd: PendingFile[] = [];

    for (const file of newFiles) {
      const lowerName = file.name.toLowerCase();
      if (existingNames.has(lowerName)) {
        duplicates.push(file.name);
      } else {
        existingNames.add(lowerName);
        filesToAdd.push(file);
      }
    }

    if (filesToAdd.length > 0) {
      setPendingFiles(prev => [...prev, ...filesToAdd]);
    }

    return {
      success: duplicates.length === 0,
      duplicates,
    };
  }, [pendingFiles]);

  const removeFile = useCallback((id: string) => {
    setPendingFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setStep1Data(null);
    setPendingFiles([]);
  }, []);

  return (
    <CaseCreationContext.Provider
      value={{
        step1Data,
        setStep1Data,
        pendingFiles,
        setPendingFiles,
        addFiles,
        removeFile,
        clearAll,
      }}
    >
      {children}
    </CaseCreationContext.Provider>
  );
}

export function useCaseCreation() {
  const context = useContext(CaseCreationContext);
  if (context === undefined) {
    throw new Error('useCaseCreation must be used within a CaseCreationProvider');
  }
  return context;
}
