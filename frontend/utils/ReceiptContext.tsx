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
  saveReceipt: (receiptName: string, receiptDate?: Date) => Promise<boolean>;
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user');
        return false;
      }

      // 1. Insert the receipt — RLS auto-scopes to the logged-in user
      const { data: receipt, error: receiptError } = await supabase
        .from('receipts')
        .insert({
          user_id: user.id,
          receipt_name: receiptName || 'Untitled Receipt',
          total_amount: receiptData.total || 0,
          tax_amount: receiptData.tax || 0,
          tip_amount: receiptData.tip || 0,
          created_at: receiptDate?.toISOString() || new Date().toISOString(),
        })
        .select()
        .single();

      if (receiptError) throw receiptError;

      // 2. Insert receipt items
      let frontendToDbItemMap: Record<string, string> = {};
      if (receiptData.items && receiptData.items.length > 0) {
        const itemsToInsert = receiptData.items.map(item => ({
          receipt_id: receipt.id,
          item_name: item.name,
          item_price: item.price,
        }));

        const { data: insertedItems, error: itemsError } = await supabase
          .from('receipt_items')
          .insert(itemsToInsert)
          .select();

        if (itemsError) throw itemsError;

        // Map frontend item IDs to the new DB IDs for assignments
        receiptData.items.forEach((item, index) => {
          if (insertedItems?.[index]) {
            frontendToDbItemMap[item.id] = insertedItems[index].id;
          }
        });
      }

      // 3. Insert contacts and their item assignments
      if (selected && selected.length > 0) {
        for (const contact of selected) {
          const { data: insertedContact, error: contactError } = await supabase
            .from('contacts')
            .insert({
              user_id: user.id,
              contact_name: contact.name,
              phone_number: contact.phoneNumber,
              contact_id: contact.id,
            })
            .select()
            .single();

          if (contactError) {
            console.error('Contact insert error:', contactError.message);
            continue;
          }

          if (contact.items && contact.items.length > 0) {
            const assignments = contact.items
              .map(item => ({ item_id: frontendToDbItemMap[item.id], contact_id: insertedContact.id }))
              .filter(a => a.item_id);

            if (assignments.length > 0) {
              const { error: assignmentError } = await supabase
                .from('assignments')
                .insert(assignments);
              if (assignmentError) console.error('Assignment error:', assignmentError.message);
            }
          }
        }
      }

      console.log('Receipt saved successfully via Supabase client');
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