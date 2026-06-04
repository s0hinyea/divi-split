import React, { createContext, useContext, useState, useRef, ReactNode } from 'react';

type OCRContextType = {
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
  status: string;
  setStatus: (status: string) => void;
  error: string | null;
  setError: (error: string | null) => void;
  startOCR: () => AbortSignal;
  cancelOCR: () => void;
};

const OCRContext = createContext<OCRContextType | undefined>(undefined);

export function OCRProvider({ children }: { children: ReactNode }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const startOCR = () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    return controller.signal;
  };

  const cancelOCR = () => {
    controllerRef.current?.abort();
    controllerRef.current = null;
  };

  return (
    <OCRContext.Provider value={{ isProcessing, setIsProcessing, status, setStatus, error, setError, startOCR, cancelOCR }}>
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