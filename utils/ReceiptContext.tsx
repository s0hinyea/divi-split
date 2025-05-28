import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define our types
export type ReceiptItem = {
  name: string;
  price: number;
};

export type OCRResponse = {
  text: string;
  items: ReceiptItem[];
} | {
  error?: string;
};

// Define the shape of our context
type ReceiptContextType = {
  receiptData: OCRResponse;
  updateReceiptData: (data: OCRResponse) => void;
  updateItem: (index: number, item: ReceiptItem) => void;
  addItem: (item: ReceiptItem) => void;
  removeItem: (index: number) => void;
};

// Create the context with a default value
const ReceiptContext = createContext<ReceiptContextType | undefined>(undefined);

// Create a provider component
export function ReceiptProvider({ children }: { children: ReactNode }) {
  // Initialize state with empty data
  const [receiptData, setReceiptData] = useState<OCRResponse>({ text: '', items: [] });

  // Function to update the entire receipt data
  const updateReceiptData = (data: OCRResponse) => {
    setReceiptData(data);
  };

  // Function to update a single item
  const updateItem = (index: number, item: ReceiptItem) => {
    if ('items' in receiptData) {
      const newItems = [...receiptData.items];
      newItems[index] = item;
      setReceiptData({ ...receiptData, items: newItems });
    }
  };

  // Function to add a new item
  const addItem = (item: ReceiptItem) => {
    if ('items' in receiptData) {
      setReceiptData({
        ...receiptData,
        items: [...receiptData.items, item]
      });
    }
  };

  // Function to remove an item
  const removeItem = (index: number) => {
    if ('items' in receiptData) {
      const newItems = receiptData.items.filter((_, i) => i !== index);
      setReceiptData({ ...receiptData, items: newItems });
    }
  };

  // The value that will be provided to consumers
  const value = {
    receiptData,
    updateReceiptData,
    updateItem,
    addItem,
    removeItem
  };

  return (
    <ReceiptContext.Provider value={value}>
      {children}
    </ReceiptContext.Provider>
  );
}

// Custom hook to use the receipt context
export function useReceipt() {
  const context = useContext(ReceiptContext);
  if (context === undefined) {
    throw new Error('useReceipt must be used within a ReceiptProvider');
  }
  return context;
} 