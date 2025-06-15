import React, { createContext, useContext, useState, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Define our types
export type ReceiptItem = {
  name: string;
  price: number;
  id: string
};

export type OCRResponse = {
  text: string;
  items: ReceiptItem[];
  userItems?: ReceiptItem[];
} | {
  error?: string;
};

// Define the shape of our context
type ReceiptContextType = {
  receiptData: OCRResponse;
  updateReceiptData: (data: OCRResponse) => void;
  updateItem: (id: string, item: ReceiptItem) => void;
  addItem: (item: ReceiptItem) => void;
  removeItem: (id: string) => void;
  setUserItems: (items: ReceiptItem[]) => void;
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

  // Function to set user items
  const setUserItems = (items: ReceiptItem[]) => {
    if ('items' in receiptData) {
      setReceiptData({ ...receiptData, userItems: items });
    }
  };

  // Function to update a single item
  const updateItem = (id: string, item: ReceiptItem) => {
    if ('items' in receiptData) {
      const newItems = receiptData.items.map((it) =>
        it.id === id ? item : it
      );
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
  const removeItem = (id: string) => {
    if ('items' in receiptData) {
      const newItems = receiptData.items.filter((it) => it.id !== id);
      setReceiptData({ ...receiptData, items: newItems });
    }
  };

  // The value that will be provided to consumers
  const value = {
    receiptData,
    updateReceiptData,
    updateItem,
    addItem,
    removeItem,
    setUserItems
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