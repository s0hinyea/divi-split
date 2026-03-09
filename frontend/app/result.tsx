import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Pressable, Image, Modal, Text } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Button, Surface } from 'react-native-paper';
import { useSplitStore, ReceiptItem } from '../stores/splitStore';
import { TouchableOpacity as GHTouchableOpacity } from 'react-native-gesture-handler';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { MaterialIcons } from '@expo/vector-icons';
import { useChange } from '../utils/ChangesContext';
import 'react-native-get-random-values';
import * as uuid from 'uuid';
import { BlurView } from 'expo-blur';
import { colors, fonts, fontSizes, spacing, radii, shadows } from '@/styles/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OCRResults() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [changing, changeItem] = useState<string>('');
  const updateItem = useSplitStore((state) => state.updateItem);
  const removeItem = useSplitStore((state) => state.removeItem);
  const addItem = useSplitStore((state) => state.addItem);
  const updateReceiptData = useSplitStore((state) => state.updateReceiptData);
  const receiptData = useSplitStore((state) => state.receiptData);
  const { addChange, undoChange, clearChanges, changes } = useChange();
  const [donebuttonVisible, setDoneButtonVisible] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>('');
  const [newPrice, setNewPrice] = useState<string>('');
  const [stackEmpty, isStackEmpty] = useState<boolean>(true);
  const [adding, isAdding] = useState<boolean>(false);
  const [taxInput, setTaxInput] = useState<string>(receiptData && 'tax' in receiptData && receiptData.tax !== undefined ? receiptData.tax.toString() : '');
  const [editingTax, setEditingTax] = useState<boolean>(false);
  const [showTaxDone, setShowTaxDone] = useState<boolean>(false);
  const [tipInput, setTipInput] = useState<string>(receiptData && 'tip' in receiptData && receiptData.tip !== undefined ? receiptData.tip.toString() : '');
  const [editingTip, setEditingTip] = useState<boolean>(false);
  const [showTipDone, setShowTipDone] = useState<boolean>(false);

  // Get items from context instead of params
  const items = 'items' in receiptData ? receiptData.items : [];

  // Monitor changes array
  useEffect(() => {
    isStackEmpty(changes.length === 0);
  }, [changes]);

  function finishChange() {
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
  function startChange(id: string) {
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

  function deleteItem(id: string, item: ReceiptItem) {
    addChange({ type: 'DELETE', id, previous: item })
    removeItem(id);
  }

  function addNewItem() {
    const newID = uuid.v4()
    const price = parseFloat(newPrice) || 0;
    const newItem: ReceiptItem = { id: newID, name: newName, price }
    addItem(newItem);
    isAdding(false);
    setNewName('');
    setNewPrice('');
  }

  function startTaxEdit() {
    setEditingTax(true);
    setShowTaxDone(true);
  }

  function finishTaxEdit() {
    setEditingTax(false);
    setShowTaxDone(false);
    const taxValue = parseFloat(taxInput) || 0;
    if ('items' in receiptData) {
      updateReceiptData({ ...receiptData, tax: taxValue });
    }
  }

  function startTipEdit() {
    setEditingTip(true);
    setShowTipDone(true);
  }

  function finishTipEdit() {
    setEditingTip(false);
    setShowTipDone(false);
    const tipValue = parseFloat(tipInput) || 0;
    if ('items' in receiptData) {
      updateReceiptData({ ...receiptData, tip: tipValue });
    }
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
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Fixed Header Section */}
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
            <TouchableOpacity onPress={() => router.push('/contacts')} style={{ marginRight: spacing.sm }}>
              <MaterialIcons name="arrow-back" size={28} color={colors.black} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              <Text style={{ color: colors.black }}>Modify </Text>
              <Text style={{ color: colors.green }}>Receipt</Text>
            </Text>
          </View>
          <Text style={styles.headerSubtitle}>Tap to edit, swipe to delete</Text>
        </View>

        {/* Horizontal Tax & Tip */}
        <View style={styles.taxTipContainer}>
          <View style={styles.compactInputSection}>
            <Text style={styles.compactLabel}>Tax</Text>
            {editingTax ? (
              <TextInput
                style={styles.compactInput}
                value={taxInput}
                onChangeText={setTaxInput}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={colors.gray400}
                autoFocus
                onBlur={finishTaxEdit}
              />
            ) : (
              <Pressable onPress={startTaxEdit} style={styles.compactPressable}>
                <Text style={[styles.compactValue, !taxInput && styles.placeholderText]}>
                  {taxInput ? `$${parseFloat(taxInput).toFixed(2)}` : '$0.00'}
                </Text>
              </Pressable>
            )}
          </View>

          <View style={styles.compactInputSection}>
            <Text style={styles.compactLabel}>Tip</Text>
            {editingTip ? (
              <TextInput
                style={styles.compactInput}
                value={tipInput}
                onChangeText={setTipInput}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={colors.gray400}
                autoFocus
                onBlur={finishTipEdit}
              />
            ) : (
              <Pressable onPress={startTipEdit} style={styles.compactPressable}>
                <Text style={[styles.compactValue, !tipInput && styles.placeholderText]}>
                  {tipInput ? `$${parseFloat(tipInput).toFixed(2)}` : '$0.00'}
                </Text>
              </Pressable>
            )}
          </View>
        </View>

        <Text style={styles.itemsSubheading}>Items</Text>
      </View>

      {/* Scrollable Items List */}
      <ScrollView style={styles.itemsScroll} contentContainerStyle={styles.itemsContent}>
        <View style={styles.itemsContainer}>
          {items
            .filter(item => item.name.trim().toLowerCase() !== 'tax')
            .map(item => (
              changing === item.id ? (
                <View key={item.id} style={styles.changeRow}>
                  <View style={[styles.changeInputContainer, { flex: 2 }]}>
                    <TextInput
                      style={styles.changeInput}
                      value={newName}
                      onChangeText={(text) => changeName(item.id, text, item)}
                      autoFocus
                    />
                  </View>
                  <View style={[styles.changeInputContainer, { flex: 1 }]}>
                    <TextInput
                      style={styles.changeInput}
                      value={newPrice}
                      onChangeText={(text) => changePrice(item.id, text, item)}
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>
              ) : (
                <Swipeable
                  key={item.id}
                  renderRightActions={() => renderRightActions(item.id, item)}
                  rightThreshold={40}
                >
                  <GHTouchableOpacity
                    onPress={() => { startChange(item.id) }}
                    activeOpacity={0.7}
                    style={styles.itemRow}
                  >
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
                  </GHTouchableOpacity>
                </Swipeable>
              )
            ))}
        </View>
      </ScrollView>

      {/* Fixed Footer Section */}
      <View style={styles.fixedFooter}>
        {/* Show total */}
        {items.length > 0 && (
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>
              ${(items.reduce((sum, item) => sum + item.price, 0) + (('tax' in receiptData && receiptData.tax) ? receiptData.tax : 0) + (('tip' in receiptData && receiptData.tip) ? receiptData.tip : 0)).toFixed(2)}
            </Text>
          </View>
        )}

        {donebuttonVisible ? (
          <TouchableOpacity
            onPress={finishChange}
            style={styles.blockDoneButton}>
            <Text style={styles.blockDoneText}>Done Editing</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.footerButtons}>
            <TouchableOpacity
              style={styles.footerButton}
              onPress={undoChange}
              disabled={changes.length === 0}
            >
              <MaterialIcons
                name="undo"
                size={24}
                color={changes.length === 0 ? colors.gray300 : colors.black}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.continueButton}
              onPress={() => { router.push("/assign") }}
              activeOpacity={0.8}
            >
              <MaterialIcons name="check" size={28} color={colors.white} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.footerButton}
              onPress={() => { isAdding(true) }}>
              <MaterialIcons name="add" size={28} color={colors.black} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Modal animationType='fade' transparent={true} visible={adding} onRequestClose={() => isAdding(false)}>
        <BlurView intensity={20} style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => isAdding(false)}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add New Item</Text>

              <TextInput
                style={styles.modalInput}
                value={newName}
                onChangeText={(text) => setNewName(text)}
                placeholder="Item name"
                placeholderTextColor={colors.gray400}
              />

              <TextInput
                style={styles.modalInput}
                value={newPrice}
                onChangeText={(text) => setNewPrice(text)}
                keyboardType="decimal-pad"
                placeholder="Price (0.00)"
                placeholderTextColor={colors.gray400}
              />

              <TouchableOpacity
                style={styles.modalAddButton}
                onPress={() => { addNewItem() }}>
                <Text style={styles.modalAddButtonText}>Add Item</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </BlurView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray100,
  },
  headerContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.gray100,
    zIndex: 10,
  },
  header: {
    marginBottom: spacing.md,
    // Left aligned
  },
  headerTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 28,
  },
  headerSubtitle: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.gray600,
    marginTop: 4,
  },
  taxTipContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  compactInputSection: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radii.md,
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  compactLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.md,
    color: colors.black,
    marginRight: spacing.sm,
  },
  compactInput: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.md,
    color: colors.green,
    flex: 1,
    textAlign: 'right',
    paddingVertical: 0,
  },
  compactPressable: {
    flex: 1,
    alignItems: 'flex-end',
  },
  compactValue: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.md,
    color: colors.green,
  },
  placeholderText: {
    color: colors.gray400,
  },
  itemsSubheading: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.lg,
    color: colors.black,
    marginBottom: spacing.sm,
  },
  itemsScroll: {
    flex: 1,
  },
  itemsContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  itemsContainer: {
    gap: spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  itemName: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.black,
    flex: 1,
    marginRight: spacing.md,
  },
  itemPrice: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.md,
    color: colors.green,
  },
  changeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  changeInputContainer: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.green,
    padding: spacing.sm,
  },
  changeInput: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.black,
  },
  deleteAction: {
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    width: 60,
    height: '100%',
    marginLeft: spacing.xs,
    borderRadius: radii.md,
  },
  fixedFooter: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderTopWidth: 1, // Subtle border
    borderTopColor: colors.gray200,
    paddingBottom: 40, // Extra padding for safe area
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  totalLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.lg,
    color: colors.black,
  },
  totalAmount: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.xl,
    color: colors.green,
  },
  footerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  footerButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radii.full,
    backgroundColor: colors.gray100,
  },
  continueButton: {
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radii.full,
    backgroundColor: colors.black,
    shadowColor: colors.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  blockDoneButton: {
    backgroundColor: colors.green,
    paddingVertical: spacing.md,
    borderRadius: radii.full,
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  blockDoneText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.md,
    color: colors.white,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modalBackdrop: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: spacing.xl,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },
  modalTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.xl,
    color: colors.black,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: colors.gray100,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.black,
  },
  modalAddButton: {
    backgroundColor: colors.black,
    borderRadius: radii.lg,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  modalAddButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.md,
    color: colors.white,
  },
});