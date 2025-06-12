import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useContacts } from '../utils/ContactsContext';
import { useReceipt, ReceiptItem } from '../utils/ReceiptContext';
import { styles } from '../styles/assignCss';

export default function AssignAmounts() {
  const router = useRouter();
  const { selected, manageItems } = useContacts();
  const { receiptData, removeItem, addItem, updateReceiptData } = useReceipt();
  const [currentContactIndex, setCurrentContactIndex] = useState(0);
  const [assigned, setAssigned] = useState<ReceiptItem[]>([]);

 

  const currentContact = selected[currentContactIndex];
  const items = 'items' in receiptData ? receiptData.items : [];

  const available = items.filter(item => !assigned.some(assigned => assigned.id === item.id));

  const toggleItem = (item: ReceiptItem) => {
    if (currentContact) {
      manageItems(item, currentContact);
    } else {
      return;
    }
  }
  
  const getItemStyle = (item: ReceiptItem) => {
    if (!currentContact) return styles.itemPill;
    return [
      styles.itemPill,
      currentContact.items?.some(it => it.id === item.id) && styles.selectedItemPill
    ];
  }

  const nextContact = () => {
    if(currentContact?.items){
      setAssigned(prev => [...prev, ...currentContact.items])
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
              style={ getItemStyle(item)}
              onPress={() => {toggleItem(item)}}
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
          onPress={() =>{ nextContact() }}>
          <Image 
            source={require('../assets/images/check.png')} 
            style={styles.continueIcon} 
          />
        </TouchableOpacity>
      </View>
    </View>
  ) : null
  ;
}
    

