import React, { createContext, useContext, useState, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../lib/supabase';
import { useContacts } from '../utils/ContactsContext'

// Define our types
export type ReceiptItem = {
  name: string;
  price: number;
  id: string
};

export type OCRResponse = {
  text: string;
  items: ReceiptItem[];
  total?: number
  tax: number,
  tip?: number,
  userItems?: ReceiptItem[],
};

// Define the shape of our context
type ReceiptContextType = {
  receiptData: OCRResponse;
  updateReceiptData: (data: OCRResponse) => void;
  updateItem: (id: string, item: ReceiptItem) => void;
  addItem: (item: ReceiptItem) => void;
  removeItem: (id: string) => void;
  setUserItems: (items: ReceiptItem[]) => void;
  saveReceipt: (receiptName: string, receiptDate?: Date) => void;
  calculateTotal: (items: any[]) => number;
};

// Create the context with a default value
const ReceiptContext = createContext<ReceiptContextType | undefined>(undefined);

// Create a provider component
export function ReceiptProvider({ children }: { children: ReactNode }) {
  // Initialize state with empty data
  const [receiptData, setReceiptData] = useState<OCRResponse>({ text: '', items: [], tax: 0, total: 0, tip: 0 });
  const { selected } = useContacts();

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

  const calculateTotal = (items: any[]) => {
    const grandTotal = items.reduce((sum, item) => sum + item.price, 0);
    return grandTotal;
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

  const saveReceipt = async (receiptName: string, receiptDate?: Date) => {
    try {
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        console.error('No auth token available');
        return false;
      }

      // Prepare contacts with their assigned items
      const contactsData = selected.map(contact => ({
        id: contact.id,
        name: contact.name,
        phoneNumber: contact.phoneNumber,
        items: contact.items  // Items assigned to this contact
      }));

      // Call backend API
      const response = await fetch('https://divi-backend-7bfd.onrender.com/receipts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          receipt_name: receiptName,
          receipt_date: receiptDate?.toISOString() || new Date().toISOString(),
          items: receiptData.items,
          contacts: contactsData,
          tax: receiptData.tax || 0,
          tip: receiptData.tip || 0,
          total: receiptData.total || 0
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save receipt');
      }

      console.log('Receipt saved successfully via backend');
      return true;
    } catch (error) {
      console.error('Save receipt error:', error);
      return false;
    }
  };
  // The value that will be provided to consumers
  const value = {
    receiptData,
    updateReceiptData,
    updateItem,
    addItem,
    removeItem,
    setUserItems,
    saveReceipt,
    calculateTotal
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