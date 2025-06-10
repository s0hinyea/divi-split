import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { View, TextInput, ScrollView, StyleSheet, TouchableOpacity, Pressable, Image, Modal} from 'react-native';
import { Text, Button, Surface } from 'react-native-paper';
import { useReceipt, ReceiptItem } from '../utils/ReceiptContext';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { MaterialIcons } from '@expo/vector-icons';
import { useChange } from '../utils/ChangesContext';
import 'react-native-get-random-values';
import * as uuid from 'uuid';
import { BlurView } from 'expo-blur';
import { styles } from "../styles/resultCss"

export default function OCRResults() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [ changing, changeItem ] = useState<string>('');
  const { updateItem, removeItem, addItem, updateReceiptData, receiptData } = useReceipt(); 
  const { addChange, undoChange, clearChanges, changes } = useChange(); 
  const [ donebuttonVisible, setDoneButtonVisible] = useState<boolean>(false);
  const [ newName, setNewName] = useState<string>('');
  const [ newPrice, setNewPrice ] = useState<string>('');
  const [ stackEmpty, isStackEmpty] = useState<boolean>(true);
  const [adding, isAdding ] = useState<boolean>(false);
  
  // Get items from context instead of params
  const items = 'items' in receiptData ? receiptData.items : [];

  // Monitor changes array
  useEffect(() => {
    isStackEmpty(changes.length === 0);
  }, [changes]);

  function finishChange(){
    setDoneButtonVisible(false);
    changeItem('');
    const previousItem = items.find(item => item.id === changing);
    if (!previousItem) return;

    // Build the updated item with all changes
    let updatedItem = { ...previousItem };
    let changed = false;

    if (previousItem.name !== newName) {
      updatedItem.name = newName;
      addChange({ type: 'EDIT_NAME', id: changing, previous: previousItem });
      changed = true;
    }
    if (previousItem.price !== parseFloat(newPrice)) {
      updatedItem.price = parseFloat(newPrice);
      addChange({ type: 'EDIT_PRICE', id: changing, previous: previousItem });
      changed = true;
    }

    // Only update if something changed
    if (changed) {
      updateItem(changing, updatedItem);
      setNewName('');
      setNewPrice('');
    }
  }

  //The text inputs are pre-filled with current value
  //i.e. if i put "bro" for setNewName, when that item is in edit state, it will show "bro" in the pressable  
  function startChange(id: string){
    setDoneButtonVisible(true);
    changeItem(id);
    const item = items.find(it => it.id === id);
    setNewName(item ? item.name : '');
    setNewPrice(item ? item.price.toString() : '');
  }

  function changePrice(id: string, text: string, item: ReceiptItem) {
    const price = parseFloat(text) || 0;
    setNewPrice(text);
  }

  function changeName(id: string, text: string, item: ReceiptItem) {
    setNewName(text);
  }

  function deleteItem(id: string, item: ReceiptItem){
    addChange({type: 'DELETE', id, previous: item })
    removeItem(id);
  }

  function addNewItem(){
    const newID = uuid.v4()
    const price = parseFloat(newPrice) || 0;
    const newItem: ReceiptItem = { id:newID, name: newName, price}
    addItem(newItem);
    isAdding(false);
    setNewName('');
    setNewPrice('');
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
                <Pressable style={styles.modalInput}>
                  <TextInput 
                    value={newName}
                    onChangeText={(text) => setNewName(text)}
                    placeholder="Item name"
                    placeholderTextColor="#80deea"
                  />
                </Pressable>
                <Pressable style={styles.modalInput}>
                  <TextInput
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
        <View style={styles.footer}>
    <TouchableOpacity 
    style={styles.footerButton} 
    onPress={() => {isAdding(true)}}>
    <Image source={require('../assets/images/plus.png')} style={styles.footerIcon} />
  </TouchableOpacity>

  <TouchableOpacity 
    style={styles.continueButton} 
    onPress={() => {router.push("/assign")}}>
    <Image source={require('../assets/images/check.png')} style={styles.continueIcon} />
  </TouchableOpacity>

  <TouchableOpacity 
      style={styles.footerButton}
      onPress={undoChange}>
      <Image 
        style={styles.footerIcon} 
        source={require('../assets/images/undo-button.png')}
      />
    </TouchableOpacity>
  </View>
      )}

      
    </View>
  );
}