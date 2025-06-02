import { useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { View, TextInput, ScrollView, StyleSheet, TouchableOpacity, Pressable, Image, Modal} from 'react-native';
import { Text, Button, Surface } from 'react-native-paper';
import { useReceipt, ReceiptItem } from '../utils/ReceiptContext';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { MaterialIcons } from '@expo/vector-icons';
import { useChange } from '../utils/ChangesContext'
import { v4 as uuidv4 } from 'uuid';
import { BlurView } from 'expo-blur';
import { styles } from "../styles/resultCss"

export default function OCRResults() {
  const params = useLocalSearchParams();
  const [ changing, changeItem ] = useState<string>('');
  const { updateItem, removeItem, addItem, updateReceiptData, receiptData } = useReceipt(); 
  const { addChange, undoChange, clearChanges, changes } = useChange(); 
  const [ donebuttonVisible, setDoneButtonVisible] = useState<boolean>(false);
  const [ newName, setNewName] = useState<string>('');
  const [ newPrice, setNewPrice ] = useState<string>('');
  const [ stackEmpty, isStackEmpty] = useState<boolean>(true);
  const [ changeType, setChangeType ] = useState<string>('');
  const [adding, isAdding ] = useState<boolean>(false);
  
  // Get items from context instead of params
  const items = 'items' in receiptData ? receiptData.items : [];

  // Monitor changes array
  useEffect(() => {
    console.log('Changes stack updated:', changes);
    isStackEmpty(changes.length === 0);
  }, [changes]);

  function finishChange(){
    setDoneButtonVisible(false);
    changeItem('');
    // Save the change only when Done is clicked
    if (changeType) {
      const previousItem = items.find(item => item.id === changing);
      if (!previousItem) return; // Guard against undefined
      console.log('Saving change:', { type: changeType, id: changing, previous: previousItem });
      // Apply the actual change here
      if (changeType === 'EDIT_NAME') {
        updateItem(changing, { ...previousItem, name: newName });
      } else if (changeType === 'EDIT_PRICE') {
        const price = parseFloat(newPrice) || 0;
        updateItem(changing, { ...previousItem, price });
      }
      addChange({
        type: changeType,
        id: changing,
        previous: previousItem
      });
    }
    setChangeType(''); // Reset change type
  }

  //The text inputs are pre-filled with current value
  //i.e. if i put "bro" for setNewName, when that item is in edit state, it will show "bro" in the pressable  
  function startChange(id: string){
    setDoneButtonVisible(true);
    changeItem(id);
    const item = items.find(it => it.id === id);
    setNewName(item ? item.name : '');
    setNewPrice(item ? item.price.toString() : '');
    setChangeType(''); // Reset change type when starting new change
    console.log('Starting change for item:', item);
  }

  function changePrice(id: string, text: string, item: ReceiptItem) {
    const price = parseFloat(text) || 0;
    setNewPrice(text);
    setChangeType('EDIT_PRICE');
    console.log('Price changed to:', price);
  }

  function changeName(id: string, text: string, item: ReceiptItem) {
    setNewName(text);
    setChangeType('EDIT_NAME');
    console.log('Name changed to:', text);
  }

  function deleteItem(id: string, item: ReceiptItem){
    addChange({type: 'DELETE', id, previous: item })
    removeItem(id);
  }

  function addNewItem(){
    const newID = uuidv4()
    const price = parseFloat(newPrice) || 0;
    const newItem: ReceiptItem = { id:newID, name: newName, price}
    addItem(newItem);
  }


  const renderRightActions = (id: string, item: ReceiptItem) => {
    return (
      <TouchableOpacity
        style={styles.deleteAction}
        onPress={() => deleteItem(item.id, item)}
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
        <Text style={styles.title}>Click to change, swipe to delete</Text>
        <View style={styles.itemsContainer}>
          {items.map(item => (
            changing === item.id ? (
              <View key={item.id} style={styles.changeRow}>
                <Pressable style={styles.changeName}>
                  <TextInput 
                    style={styles.itemName}
                    value={newName}
                    onChangeText={(text) => changeName(item.id, text, item)}
                  />
                </Pressable>
                <Pressable style={styles.changePrice}>
                  <TextInput 
                    style={styles.itemPrice}
                    value={newPrice}
                    onChangeText={(text) => changePrice(item.id, text, item)}
                    keyboardType="decimal-pad"
                  />
                </Pressable>
              </View>
            ) : (
              <Swipeable
                key={item.id}
                renderRightActions={() => renderRightActions(item.id, item)}
                rightThreshold={20}
              >
                <TouchableOpacity onPress={() => {startChange(item.id)}}>
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

      <Modal animationType='slide' transparent={true} visible={adding} onRequestClose={() => isAdding(false)}>
        <BlurView intensity={50} style={styles.modalOverlay}>
          <Pressable style={styles.modalOverlay} onPress={() => isAdding(false)}>
            <View style={styles.modalContainer}>
              <Surface style={styles.modalSurface}>
                <Text style={styles.modalTitle}>Add New Item</Text>
                <Pressable style={styles.modalInput}>
                  <TextInput 
                    style={styles.itemName}
                    value={newName}
                    onChangeText={(text) => setNewName(text)}
                    placeholder="Item name"
                    placeholderTextColor="#80deea"
                  />
                </Pressable>
                <Pressable style={styles.modalInput}>
                  <TextInput 
                    style={styles.itemPrice}
                    value={newPrice}
                    onChangeText={(text) => setNewPrice(text)}
                    keyboardType="decimal-pad"
                    placeholder="Price"
                    placeholderTextColor="#80deea"
                  />
                </Pressable>

                <TouchableOpacity 
                  style={styles.modalButton}
                  onPress={() => {addNewItem()}}>
                  <Text style={styles.modalButtonText}>Add Item</Text>
                </TouchableOpacity>
              </Surface>
            </View>
          </Pressable>
        </BlurView>
      </Modal>
      
      {donebuttonVisible ? (
        <View>
          <Button 
            mode="contained"
            onPress={finishChange}
            style={styles.button}>
            Done
          </Button>
        </View>
      ) :(
        <TouchableOpacity style={styles.plusButton} onPress={() => {isAdding(true)}}>
  <Image source={require('../assets/images/plus.png')} style={styles.plusIcon} />
</TouchableOpacity>
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