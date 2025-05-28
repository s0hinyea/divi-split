import { useLocalSearchParams } from 'expo-router';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import type { ReceiptItem } from '../utils/receiptItems';
import { ExtractedData } from '../utils/receiptItems';

export default function OCRResults() {
  const params = useLocalSearchParams();
  const items: ReceiptItem[] = params.items ? JSON.parse(params.items as string) : [];
  
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Click to make changes</Text>
      <View style={styles.itemsContainer}>
        {items.map((item, index) => (
          <TouchableOpacity>
          <View key={index} style={styles.itemRow}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
          </View>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Show total */}
      {items.length > 0 && (
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalAmount}>
            ${items.reduce((sum, item) => sum + item.price, 0).toFixed(2)}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  itemsContainer: {
    gap: 10,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
  },
  itemName: {
    fontSize: 16,
    color: '#1976D2',
    flex: 1,
  },
  itemPrice: {
    fontSize: 16,
    color: '#1976D2',
    fontWeight: '600',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    marginTop: 16,
    backgroundColor: '#BBDEFB',
    borderRadius: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1565C0',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1565C0',
  },
});