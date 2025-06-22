import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useContacts } from '../utils/ContactsContext';
import { useReceipt, ReceiptItem } from '../utils/ReceiptContext';
import { styles } from '../styles/assignCss';

export default function AssignAmounts() {
  const router = useRouter();
  const { selected, manageItems } = useContacts();
  const { receiptData, setUserItems } = useReceipt();
  const [currentContactIndex, setCurrentContactIndex] = useState(0);
  const [assigned, setAssigned] = useState<ReceiptItem[]>([]);

  useEffect(() => {
    return () => {
      setAssigned([]);
    };
  }, []);
  

  const currentContact = selected[currentContactIndex];
  const items = 'items' in receiptData ? receiptData.items.filter(item => !/tax/i.test(item.name)) : [];

  const available = items.filter(item => !assigned.some(assigned => assigned.id === item.id));

  const toggleItem = (item: ReceiptItem) => {
    if (currentContact) {
      manageItems(item, currentContact);
    }
  }
  
  const getItemStyle = (item: ReceiptItem) => {
    if (!currentContact) return styles.itemPill;
    return [
      styles.itemPill,
      currentContact.items?.some(it => it.id === item.id) && styles.selectedItemPill
    ];
  }

  const nextContact = async () => {
    if(currentContact?.items){
      await setAssigned(prev => [...prev, ...currentContact.items]);
    }
    
    if(currentContactIndex + 1 === selected.length) {
      const allAssignedItems = [
        ...assigned,
        ...(currentContact?.items || [])
      ];
      
      const remainingItems = items.filter(item => 
        !allAssignedItems.some(assigned => assigned.id === item.id)
      );
      
      if (remainingItems.length > 0) {
        await setUserItems(remainingItems);
      }
      router.push("/review");
    }
    
    setCurrentContactIndex(currentContactIndex + 1);
  }



  return currentContactIndex == selected.length ? (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>DONE</Text>
      </View>
    </View>
  ) : currentContact ? (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Assign Items to <Text style={styles.contactName}>{currentContact?.name}</Text></Text>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.itemsContainer}>
          {available.map(item => (
            <TouchableOpacity
              key={item.id}
              style={getItemStyle(item)}
              onPress={() => toggleItem(item)}
            >
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.continueButton}
          onPress={nextContact}>
          <Image 
            source={require('../assets/images/check.png')} 
            style={styles.continueIcon} 
          />
        </TouchableOpacity>
      </View>
    </View>
  ) : null;
}
    


