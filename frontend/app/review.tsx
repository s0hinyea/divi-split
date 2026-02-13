import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, Alert, ActivityIndicator, TextInput, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useContacts } from '../utils/ContactsContext';
import { useReceipt, ReceiptItem } from '../utils/ReceiptContext';
import { styles } from '../styles/reviewCss';
import * as SMS from 'expo-sms';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function ReviewPage() {
  const router = useRouter();
  const { selected, clearItems, clearSelected } = useContacts();
  const { receiptData, setUserItems, updateReceiptData, calculateTotal, saveReceipt } = useReceipt();
  // Modal state
  const [showSmsModal, setShowSmsModal] = useState(false);

  // Receipt name and date states
  const [receiptName, setReceiptName] = useState('');
  const [receiptDate, setReceiptDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if ('items' in receiptData) {
      const allMealItems = receiptData.items;
      const subtotal = calculateTotal(allMealItems);
      const tax = receiptData.tax || 0;
      const tip = receiptData.tip || 0;
      const grandTotal = subtotal + tax + tip;
      updateReceiptData({ ...receiptData, total: grandTotal })
    }
  }, [receiptData.items, receiptData.tax, receiptData.tip, selected]);

  const calculateTaxBreakdown = () => {
    if (!('tax' in receiptData) || !receiptData.tax || receiptData.tax <= 0) {
      return { taxPercentage: 0, individualTaxes: {} };
    }

    const allMealItems = 'items' in receiptData ? receiptData.items : [];
    const subtotal = calculateTotal(allMealItems);

    if (subtotal <= 0) {
      return { taxPercentage: 0, individualTaxes: {} };
    }

    // Calculate tax percentage
    const taxPercentage = receiptData.tax / subtotal;

    // Calculate individual tax amounts
    const individualTaxes: { [key: string]: number } = {};

    // Calculate tax for each contact
    selected.forEach(contact => {
      const contactMealTotal = calculateTotal(contact.items as ReceiptItem[]);
      individualTaxes[contact.id] = contactMealTotal * taxPercentage;
    });

    // Calculate tax for user items
    if (receiptData.userItems && receiptData.userItems.length > 0) {
      const userMealTotal = calculateTotal(receiptData.userItems as ReceiptItem[]);
      individualTaxes['user'] = userMealTotal * taxPercentage;
    }

    return { taxPercentage, individualTaxes };
  };

  const calculateTipBreakdown = () => {
    if (!('tip' in receiptData) || !receiptData.tip || receiptData.tip <= 0) {
      return { tipPerPerson: 0, individualTips: {} };
    }

    // Count total people (contacts + user if user has items)
    let totalPeople = selected.length;
    if (receiptData.userItems && receiptData.userItems.length > 0) {
      totalPeople += 1;
    }

    if (totalPeople <= 0) {
      return { tipPerPerson: 0, individualTips: {} };
    }

    // Split tip evenly among all people
    const tipPerPerson = receiptData.tip / totalPeople;

    // Calculate individual tip amounts
    const individualTips: { [key: string]: number } = {};

    // Assign tip for each contact
    selected.forEach(contact => {
      individualTips[contact.id] = tipPerPerson;
    });

    // Assign tip for user if they have items
    if (receiptData.userItems && receiptData.userItems.length > 0) {
      individualTips['user'] = tipPerPerson;
    }

    return { tipPerPerson, individualTips };
  };

  const { taxPercentage, individualTaxes } = calculateTaxBreakdown();
  const { tipPerPerson, individualTips } = calculateTipBreakdown();

  // Send group summary via native Messages app
  const sendGroupSummary = async () => {
    try {
      const isAvailable = await SMS.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('SMS Not Available', 'This device cannot send text messages.');
        return;
      }

      // Collect all phone numbers
      const phoneNumbers = selected
        .map(c => c.phoneNumber)
        .filter((num): num is string => !!num);

      if (phoneNumbers.length === 0) {
        Alert.alert('No Phone Numbers', 'None of the selected contacts have phone numbers.');
        return;
      }

      // Build the formatted message
      const name = receiptName.trim() || 'Split';
      const dateStr = receiptDate.toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
      });

      let message = `🧾 Divi Split — ${name}\n📅 ${dateStr}\n\n`;

      selected.forEach(contact => {
        const contactMealTotal = calculateTotal(contact.items as ReceiptItem[]);
        const contactTax = individualTaxes[contact.id] || 0;
        const contactTip = individualTips[contact.id] || 0;
        const contactTotal = contactMealTotal + contactTax + contactTip;

        message += `• ${contact.name}: $${contactTotal.toFixed(2)}`;

        // Add breakdown details
        const details: string[] = [];
        details.push(`meal $${contactMealTotal.toFixed(2)}`);
        if (contactTax > 0) details.push(`tax $${contactTax.toFixed(2)}`);
        if (contactTip > 0) details.push(`tip $${contactTip.toFixed(2)}`);
        message += ` (${details.join(' + ')})\n`;
      });

      const allMealItems = 'items' in receiptData ? receiptData.items : [];
      const grandTotal = calculateTotal(allMealItems) +
        Object.values(individualTaxes).reduce((s, t) => s + t, 0) +
        Object.values(individualTips).reduce((s, t) => s + t, 0);

      message += `\nTotal: $${grandTotal.toFixed(2)}`;

      await SMS.sendSMSAsync(phoneNumbers, message);
      setShowSmsModal(false);
      proceedToNextScreen();

    } catch (error) {
      console.error('SMS Error:', error);
      Alert.alert('Error', 'Failed to open Messages.');
      setShowSmsModal(false);
    }
  };

  // Navigate to next screen and cleanup
  const proceedToNextScreen = () => {
    clearItems();
    clearSelected();
    setUserItems([]);
    router.push('/expense-splitter');
  };

  // Handle date picker change
  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios'); // Keep open on iOS, close on Android
    if (selectedDate) {
      setReceiptDate(selectedDate);
    }
  };
  // Handle finish - save receipt via ReceiptContext (which calls backend)
  const handleFinish = async () => {
    // Use custom name or default
    const name = receiptName.trim() || `Split - ${receiptDate.toLocaleDateString()}`;
    await saveReceipt(name, receiptDate);

    if (selected.length > 0) {
      setShowSmsModal(true);
    } else {
      proceedToNextScreen();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Review Assignments</Text>
      </View>

      {/* Receipt Name and Date Section */}
      <View style={{ padding: 16, backgroundColor: '#f5f5f5', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' }}>
        <Text style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>Receipt Name</Text>
        <TextInput
          style={{
            backgroundColor: '#fff',
            padding: 12,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: '#ddd',
            fontSize: 16,
            marginBottom: 12
          }}
          placeholder="e.g., Dinner at Joe's"
          placeholderTextColor="#999"
          value={receiptName}
          onChangeText={setReceiptName}
        />

        <Text style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>Receipt Date</Text>
        <TouchableOpacity
          style={{
            backgroundColor: '#fff',
            padding: 12,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: '#ddd',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={{ fontSize: 16 }}>{receiptDate.toLocaleDateString()}</Text>
          <Text style={{ color: '#007AFF' }}>Change</Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={receiptDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onDateChange}
            maximumDate={new Date()}
          />
        )}
      </View>

      <ScrollView style={styles.scrollView}>
        {selected.map((contact) => {
          const contactMealTotal = calculateTotal(contact.items as ReceiptItem[]);
          const contactTax = individualTaxes[contact.id] || 0;
          const contactTip = individualTips[contact.id] || 0;
          const contactTotal = contactMealTotal + contactTax + contactTip;

          return (
            <View key={contact.id} style={styles.contactSection}>
              <Text style={styles.contactName}>{contact.name}</Text>
              {contact.items.map((item: ReceiptItem) => (
                <View key={item.id} style={styles.itemRow}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
                </View>
              ))}
              <View style={styles.subtotalRow}>
                <Text style={styles.subtotalLabel}>Subtotal:</Text>
                <Text style={styles.subtotalAmount}>${contactMealTotal.toFixed(2)}</Text>
              </View>
              {contactTax > 0 && (
                <View style={styles.taxRow}>
                  <Text style={styles.taxLabel}>Tax ({(taxPercentage * 100).toFixed(1)}%):</Text>
                  <Text style={styles.taxAmount}>${contactTax.toFixed(2)}</Text>
                </View>
              )}
              {contactTip > 0 && (
                <View style={styles.taxRow}>
                  <Text style={styles.taxLabel}>Tip:</Text>
                  <Text style={styles.taxAmount}>${contactTip.toFixed(2)}</Text>
                </View>
              )}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total:</Text>
                <Text style={styles.totalAmount}>${contactTotal.toFixed(2)}</Text>
              </View>
            </View>
          );
        })}

        {'userItems' in receiptData && receiptData.userItems && receiptData.userItems.length > 0 && (
          (() => {
            const userMealTotal = calculateTotal(receiptData.userItems as ReceiptItem[]);
            const userTax = individualTaxes['user'] || 0;
            const userTip = individualTips['user'] || 0;
            const userTotal = userMealTotal + userTax + userTip;

            return (
              <View style={styles.contactSection}>
                <Text style={styles.contactName}>You</Text>
                {receiptData.userItems.map((item: ReceiptItem) => (
                  <View key={item.id} style={styles.itemRow}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
                  </View>
                ))}
                <View style={styles.subtotalRow}>
                  <Text style={styles.subtotalLabel}>Subtotal:</Text>
                  <Text style={styles.subtotalAmount}>${userMealTotal.toFixed(2)}</Text>
                </View>
                {userTax > 0 && (
                  <View style={styles.taxRow}>
                    <Text style={styles.taxLabel}>Tax ({(taxPercentage * 100).toFixed(1)}%):</Text>
                    <Text style={styles.taxAmount}>${userTax.toFixed(2)}</Text>
                  </View>
                )}
                {userTip > 0 && (
                  <View style={styles.taxRow}>
                    <Text style={styles.taxLabel}>Tip:</Text>
                    <Text style={styles.taxAmount}>${userTip.toFixed(2)}</Text>
                  </View>
                )}
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Your Total:</Text>
                  <Text style={styles.totalAmount}>${userTotal.toFixed(2)}</Text>
                </View>
              </View>
            );
          })()
        )}

        {/* Show final total calculation */}
        {(() => {
          const allMealItems = 'items' in receiptData ? receiptData.items : [];

          return (
            <View style={styles.contactSection}>
              <Text style={styles.contactName}> Total</Text>
              <View style={styles.itemRow}>
                <Text style={styles.itemName}>Subtotal (all meals)</Text>
                <Text style={styles.itemPrice}>
                  ${(calculateTotal(allMealItems)).toFixed(2)}
                </Text>
              </View>
              <View style={styles.itemRow}>
                <Text style={styles.itemName}>Total Tax</Text>
                <Text style={styles.itemPrice}>
                  ${Object.values(individualTaxes).reduce((sum, tax) => sum + tax, 0).toFixed(2)}
                </Text>
              </View>
              <View style={styles.itemRow}>
                <Text style={styles.itemName}>Total Tip</Text>
                <Text style={styles.itemPrice}>
                  ${Object.values(individualTips).reduce((sum, tip) => sum + tip, 0).toFixed(2)}
                </Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Grand Total:</Text>
                <Text style={styles.totalAmount}>
                  ${receiptData.total ? receiptData.total.toFixed(2) : '0.00'}
                </Text>
              </View>
            </View>
          );
        })()}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.finishButton}
          onPress={handleFinish}
        >
          <Text style={styles.finishButtonText}>Proceed</Text>
        </TouchableOpacity>
      </View>

      {/* Group SMS Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showSmsModal}
        onRequestClose={() => setShowSmsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Send split summary to group chat?</Text>

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={sendGroupSummary}
              >
                <Text style={styles.modalButtonPrimaryText}>Yes</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => {
                  setShowSmsModal(false);
                  proceedToNextScreen();
                }}
              >
                <Text style={styles.modalButtonSecondaryText}>No</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
