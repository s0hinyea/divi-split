import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import type { ReceiptItem } from '../utils/receiptItems';
import { useReceipt } from '../utils/ReceiptContext';

export default function OCRResults() {
  const params = useLocalSearchParams();
  const [ changing, changeItem ] = useState<number>(-1);
  const { updateItem, removeItem, addItem, updateReceiptData } = useReceipt(); 
  const items: ReceiptItem[] = params.items ? JSON.parse(params.items as string) : [];



  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Click to make changes</Text>
      <View style={styles.itemsContainer}>
        {items.map((item, index) => (
          
          changing === index ? (
            <>
            <View key={index} style={styles.changeRow}>
            <TouchableOpacity style={styles.changeName}>
              <Text style={styles.itemName}>{item.name}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.changePrice}>
            <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
            </TouchableOpacity>
            </View>
            </>
          ) : (
            <>
            <TouchableOpacity onPress = {() => {changeItem(index)}} >
            <View key={index} style={styles.itemRow}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
            </View>
          </TouchableOpacity>
            </>
          ) 
          
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
    backgroundColor: '#e0f7fa',  // Light aquamarine background
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#00838f',  // Dark aquamarine text
    textAlign: 'center',
  },
  itemsContainer: {
    gap: 10,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#b2ebf2',
  },
  changeRow:{
    flexDirection: 'row',
    gap: 8

  },
  changeName:{
    flex: 3,
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#b2ebf2',
  },
  changePrice:{
    flex: 1,
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#b2ebf2',
  },
  itemName: {
    fontSize: 16,
    color: '#006064',  // Medium aquamarine text
    flex: 1,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00acc1',  // Aquamarine accent
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    marginTop: 16,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#b2ebf2',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00838f',  // Dark aquamarine text
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00acc1',  // Aquamarine accent
  },
});