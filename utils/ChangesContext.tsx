import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ReceiptItem } from '../utils/ReceiptContext'
import { useReceipt } from '../utils/ReceiptContext';

export type Change = { 
  type: string,
  index: number,
  previous: ReceiptItem
}

type ChangeContextType = {
  changes: Change[],
  addChange: (change: Change) => void,
  undoChange: () => void
  clearChanges: () => void
}

const ChangeContext = createContext< ChangeContextType | undefined >(undefined);

export function ChangeProvider({children} : {children: ReactNode}) {
  const [ changes, setChanges ] = useState<Change[]>([]);
  const { updateItem, removeItem, addItem, receiptData } = useReceipt();

  const addChange = (change: Change) => {
    setChanges(prevChanges => [...prevChanges, change]);
    console.log(changes)
  }

  const undoChange = () => {
    const items = 'items' in receiptData ? receiptData.items : [];
    if(changes){
      setChanges(prevChanges => {
        const newChanges = [...prevChanges];
        const lastChange = newChanges.pop();
        if(lastChange){
          switch(lastChange.type) {
            case 'EDIT_NAME':
              updateItem(lastChange.index, { ...items[lastChange.index], name: lastChange.previous.name });
              break;
            case 'EDIT_PRICE':
              updateItem(lastChange.index, { ...items[lastChange.index], price: lastChange.previous.price });
              break;
            case 'DELETE':
              addItem(lastChange.previous);
              break;
            case 'ADD':
              removeItem(lastChange.index)
              break;
          }
        }
        
        return newChanges;
      })
    }
  };

  const clearChanges = () => {
    setChanges([]);
  }

  const value = {
    changes,
    addChange,
    undoChange,
    clearChanges
  };

  return (
    <ChangeContext.Provider value={value}>
      {children}
    </ChangeContext.Provider>
  );
}

export function useChange() {
  const context = useContext(ChangeContext);
  if (context === undefined) {
    throw new Error('useChange must be used within a ChangeProvider');
  }
  return context;
} 