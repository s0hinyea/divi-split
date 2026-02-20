import React, { createContext, useContext, useState, ReactNode } from 'react';

type OCRContextType = {
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
  status: string;
  setStatus: (status: string) => void;
  error: string | null;
  setError: (error: string | null) => void;
};

const OCRContext = createContext<OCRContextType | undefined>(undefined);

export function OCRProvider({ children }: { children: ReactNode }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState<string | null>(null);

  return (
    <OCRContext.Provider value={{ isProcessing, setIsProcessing, status, setStatus, error, setError }}>
      {children}
    </OCRContext.Provider>
  );
}

export function useOCR() {
  const context = useContext(OCRContext);
  if (context === undefined) {
    throw new Error('useOCR must be used within an OCRProvider');
  }
  return context;
} 