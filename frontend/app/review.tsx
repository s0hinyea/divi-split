import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useContacts } from '../utils/ContactsContext';
import { useReceipt } from '../utils/ReceiptContext';
import { styles } from '../styles/reviewCss';

export default function ReviewPage() {
  const router = useRouter();
  const { selected, clearItems, clearSelected } = useContacts();
  const { receiptData, setUserItems } = useReceipt();

  const calculateTotal = (items: any[]) => {
    return items.reduce((sum, item) => sum + item.price, 0);
  };

  const handleFinish = () => {
    clearItems();
    clearSelected();
    setUserItems([]);
    
    router.push('/expense-splitter');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Review Assignments</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {selected.map((contact) => (
          <View key={contact.id} style={styles.contactSection}>
            <Text style={styles.contactName}>{contact.name}</Text>
            {contact.items?.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
              </View>
            ))}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalAmount}>
                ${calculateTotal(contact.items || []).toFixed(2)}
              </Text>
            </View>
          </View>
        ))}

        {'userItems' in receiptData && receiptData.userItems && receiptData.userItems.length > 0 && (
          <View style={styles.contactSection}>
            <Text style={styles.contactName}>You</Text>
            {receiptData.userItems.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
              </View>
            ))}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Your Total:</Text>
              <Text style={styles.totalAmount}>
                ${calculateTotal(receiptData.userItems).toFixed(2)}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.finishButton}
          onPress={handleFinish}
        >
          <Text style={styles.finishButtonText}>Finish</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
