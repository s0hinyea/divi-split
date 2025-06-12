import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { ReceiptItem } from "../utils/ReceiptContext"


export type Contact = {
  id: string;
  name: string;
  phoneNumber: string | undefined; 
  items: ReceiptItem[];
};




export type SelectedContactsType = {
  selected: Array<Contact>,
  manageContacts: (newContact: Contact) => void,
  manageItems: (newItem: ReceiptItem, currentContact: Contact) => void
}

const ContactsContext = createContext<SelectedContactsType | undefined>(undefined);

export function ContactsProvider({ children }: { children: ReactNode }) {
  const [selected, setSelectedContacts] = useState<Contact[]>([]);
  const [contactItems, setContactItems] = useState<ReceiptItem[]>([]);

  const manageContacts = (newContact: Contact) => {
    if (selected.some(contact => contact.id === newContact.id)){
       let newSelected = selected.filter((contact) => contact.id !== newContact.id);
       setSelectedContacts((prevSelected) => newSelected);
    }
    else {
      setSelectedContacts((prevSelected) => [...prevSelected, newContact]);
    }
  }

  const manageItems = (newItem: ReceiptItem, currentContact: Contact) => {
    setSelectedContacts(prevSelected => 
      prevSelected.map(contact => {
        if (contact.id === currentContact.id) {
          // If item exists, remove it
          if (contact?.items?.some(it => it.id === newItem.id)) {
            return {
              ...contact,
              items: contact?.items?.filter(it => it.id !== newItem.id)
            };
          }
          // If item doesn't exist, add it
          return {
            ...contact,
            items: [...contact.items, newItem]
          };
        }
        return contact;
      })
    );
  }

  useEffect(() => {
    console.log('Selected contacts changed:', selected);
  }, [selected]);

  const value = {
    selected,
    manageContacts,
    manageItems
  }

  return (
    <ContactsContext.Provider value={ value }>
      {children}
    </ContactsContext.Provider>
  );
}

export function useContacts() {
  const context = useContext(ContactsContext);
  if (context === undefined) {
    throw new Error('useContacts must be used within an ContactsProvider');
  }
  return context;
} 