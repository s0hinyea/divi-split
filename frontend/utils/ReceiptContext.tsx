import React, { createContext, useContext, useState, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../lib/supabase';
import  { useContacts } from '../utils/ContactsContext'

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
  saveReceipt: (receiptName: string) => void;
  calculateTotal: (items: any[]) => number;
};

// Create the context with a default value
const ReceiptContext = createContext<ReceiptContextType | undefined>(undefined);

// Create a provider component
export function ReceiptProvider({ children }: { children: ReactNode }) {
  // Initialize state with empty data
  const [receiptData, setReceiptData] = useState<OCRResponse>({ text: '', items: [], tax: 0, total: 0, tip: 0});
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

  const saveReceipt = async (receiptName: string) => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Save main receipt
      const { data: receipt, error: receiptError } = await supabase
        .from('receipts')
        .insert({
          user_id: user.id,
          receipt_name: receiptName,
          total_amount: 'total' in receiptData ? receiptData.total : 0,
          tax_amount: 'tax' in receiptData ? receiptData.tax : 0,
          tip_amount: 'tip' in receiptData ? receiptData.tip : 0,
        })
        .select()
        .single();

      if (receiptError) throw receiptError;

      const receiptItems = receiptData.items.map((item) => ({
        receipt_id: receipt.id,
        item_name: item.name,
        item_price: item.price,
        item_id: item.id
      }));

      const { data: insertedItems, error: itemsError } = await supabase
      .from('receipt_items')
      .insert(receiptItems)
      .select();

      if (itemsError) throw itemsError;

      const selectedContacts = selected.map((contact) => ({
        user_id: user.id,
        contact_name: contact.name,
        phone_number: contact.phoneNumber,
        contact_id: contact.id
      }))

      const { data: insertedContacts, error: contactsError } = await supabase
        .from('contacts')
        .insert(selectedContacts)
        .select();

      if (contactsError) throw contactsError;

      const assigningItems = selected.flatMap((contact) =>
        contact.items.map((item) => {
          // Find the actual database IDs
          const dbItem = insertedItems?.find(dbItem => dbItem.item_id === item.id);
          const dbContact = insertedContacts?.find(dbContact => dbContact.contact_id === contact.id);
          
          return {
            item_id: dbItem?.id,      // Use database primary key
            contact_id: dbContact?.id // Use database primary key
          };
        })
      );

      const { error: assignmentError } = await supabase
        .from('assignments')
        .insert(assigningItems);

      if (assignmentError) throw assignmentError;

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