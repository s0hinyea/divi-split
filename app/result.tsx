import { useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { View, TextInput, ScrollView, StyleSheet, TouchableOpacity, Pressable, Image} from 'react-native';
import { Text, Button } from 'react-native-paper';
import type { ReceiptItem } from '../utils/receiptItems';
import { useReceipt } from '../utils/ReceiptContext';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { MaterialIcons } from '@expo/vector-icons';
import { useChange } from '../utils/ChangesContext'

export default function OCRResults() {
  const params = useLocalSearchParams();
  const [ changing, changeItem ] = useState<number>(-1);
  const { updateItem, removeItem, addItem, updateReceiptData, receiptData } = useReceipt(); 
  const { addChange, undoChange, clearChanges, changes } = useChange(); 
  const [ buttonVisible, setButtonVisible] = useState<boolean>(false);
  const [ newName, setNewName] = useState<string>('');
  const [ newPrice, setNewPrice ] = useState<string>('');
  const [ stackEmpty, isStackEmpty] = useState<boolean>(true);
  const [ changeType, setChangeType ] = useState<string>('');
  
  // Get items from context instead of params
  const items = 'items' in receiptData ? receiptData.items : [];

  // Monitor changes array
  useEffect(() => {
    console.log('Changes stack updated:', changes);
    isStackEmpty(changes.length === 0);
  }, [changes]);

  function finishChange(){
    setButtonVisible(false);
    changeItem(-1);
    // Save the change only when Done is clicked
    if (changeType) {
      const previousItem = items[changing];
      console.log('Saving change:', { type: changeType, index: changing, previous: previousItem });
      // Apply the actual change here
      if (changeType === 'EDIT_NAME') {
        updateItem(changing, { ...items[changing], name: newName });
      } else if (changeType === 'EDIT_PRICE') {
        const price = parseFloat(newPrice) || 0;
        updateItem(changing, { ...items[changing], price });
      }
      addChange({
        type: changeType,
        index: changing,
        previous: previousItem
      });
    }
    setChangeType(''); // Reset change type
  }

  //The text inputs are pre-filled with current value
  //i.e. if i put "bro" for setNewName, when that item is in edit state, it will show "bro" in the pressable  
  function startChange(index: number){
    setButtonVisible(true);
    changeItem(index);
    setNewName(items[index].name);
    setNewPrice(items[index].price.toString());
    setChangeType(''); // Reset change type when starting new change
    console.log('Starting change for item:', items[index]);
  }

  function changePrice(index: number, text: string, item: ReceiptItem) {
    const price = parseFloat(text) || 0;
    setNewPrice(text);
    setChangeType('EDIT_PRICE');
    console.log('Price changed to:', price);
  }

  function changeName(index: number, text: string, item: ReceiptItem) {
    setNewName(text);
    setChangeType('EDIT_NAME');
    console.log('Name changed to:', text);
  }

  function deleteItem(index: number, item: ReceiptItem){
    removeItem(index);
    setChangeType('DELETE');
    addChange({type: changeType, index, previous: item })
  }

  const renderRightActions = (index: number, item: ReceiptItem) => {
    return (
      <TouchableOpacity
        style={styles.deleteAction}
        onPress={() => deleteItem(index, item)}
      >
        <MaterialIcons name="delete" size={24} color="white" />
      </TouchableOpacity>
    );
  };

  // Clear changes when component unmounts
  useEffect(() => {
    return () => {
      console.log('Clearing changes on unmount');
      clearChanges();
    };
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.title}>Click to make changes</Text>
        <View style={styles.itemsContainer}>
          {items.map((item, index) => (
            changing === index ? (
              <View key={index} style={styles.changeRow}>
                <Pressable style={styles.changeName}>
                  <TextInput 
                    style={styles.itemName}
                    value={newName}
                    onChangeText={(text) => changeName(index, text, item)}
                  />
                </Pressable>
                <Pressable style={styles.changePrice}>
                  <TextInput 
                    style={styles.itemPrice}
                    value={newPrice}
                    onChangeText={(text) => changePrice(index, text, item)}
                    keyboardType="decimal-pad"
                  />
                </Pressable>
              </View>
            ) : (
              <Swipeable
                key={index}
                renderRightActions={() => renderRightActions(index, item)}
                rightThreshold={20}
              >
                <TouchableOpacity onPress={() => {startChange(index)}}>
                  <View style={styles.itemRow}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
                  </View>
                </TouchableOpacity>
              </Swipeable>
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
      
      {buttonVisible && (
        <View>
          <Button 
            mode="contained"
            onPress={finishChange}
            style={styles.button}>
            Done
          </Button>
        </View>
      )}

      {changes.length > 0 && (
        <TouchableOpacity 
          onPress={undoChange}
          style={styles.undoButtonContainer}>
          <Image 
            style={styles.undoButton} 
            source={require('../assets/images/undo-button.png')}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e0f7fa',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  button: {
    marginTop: 50,
    width: '50%',
    alignSelf: 'center',
    marginBottom: 50,
    backgroundColor: '#00acc1' // Aquamarine button
  },
  undoButtonContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#00acc1',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  undoButton: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
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
  deleteAction: {
    backgroundColor: '#ff5252',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    marginLeft: 5
  }
});