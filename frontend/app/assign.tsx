import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useContacts } from '../utils/ContactsContext';
import { useReceipt } from '../utils/ReceiptContext';
import { styles } from '../styles/assignCss';

export default function AssignAmounts() {
  const router = useRouter();
  const { selected } = useContacts();
  const { receiptData } = useReceipt();
  const [currentContactIndex, setCurrentContactIndex] = useState(0);

  const currentContact = selected[currentContactIndex];
  const items = 'items' in receiptData ? receiptData.items : [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Assign Items to <Text style={styles.contactName}>{currentContact?.name}</Text></Text>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.itemsContainer}>
          {items.map(item => (
            <TouchableOpacity
              key={item.id}
              style={styles.itemPill}
              onPress={() => {}}
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
          onPress={() => router.push('/result')}>
          <Image 
            source={require('../assets/images/check.png')} 
            style={styles.continueIcon} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}
