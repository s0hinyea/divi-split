import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useContacts } from '../utils/ContactsContext';
import { useReceipt, ReceiptItem } from '../utils/ReceiptContext';
import { styles } from '../styles/reviewCss';

export default function ReviewPage() {
  const router = useRouter();
  const { selected, clearItems, clearSelected } = useContacts();
  const { receiptData, setUserItems, updateReceiptData, calculateTotal, saveReceipt } = useReceipt();
  // Modal and SMS states
  const [showSmsModal, setShowSmsModal] = useState(false);
  const [sendingSms, setSendingSms] = useState(false);

  useEffect(() => {
    if ('items' in receiptData) {
      const allMealItems = receiptData.items;
      const subtotal = calculateTotal(allMealItems);
      updateReceiptData({...receiptData, total: subtotal })
    }
  }, [receiptData.items, receiptData.tax, selected]);

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

  const { taxPercentage, individualTaxes } = calculateTaxBreakdown();

  // SMS sending function
  const sendSmsToContacts = async () => {
    setSendingSms(true);
    
    try {
      // Format contact data for backend
      const contactsData = selected.map(contact => {
        const contactMealTotal = calculateTotal(contact.items as ReceiptItem[]);
        const contactTax = individualTaxes[contact.id] || 0;
        const contactTotal = contactMealTotal + contactTax;
        
        return {
          phoneNumber: contact.phoneNumber,
          total: contactTotal
        };
      });

      const response = await fetch("https://divi-backend-7bfd.onrender.com/sms", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contacts: contactsData
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send SMS');
      }

      Alert.alert('Success', 'SMS sent to all contacts!');
      proceedToNextScreen();
      
    } catch (error) {
      console.error('SMS Error:', error);
      Alert.alert('Error', 'Failed to send SMS. Please try again.');
    } finally {
      setSendingSms(false);
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

  // Updated handleFinish to show modal
  const handleFinish = () => {
    saveReceipt("Trial");
    
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

      <ScrollView style={styles.scrollView}>
        {selected.map((contact) => {
          const contactMealTotal = calculateTotal(contact.items as ReceiptItem[]);
          const contactTax = individualTaxes[contact.id] || 0;
          const contactTotal = contactMealTotal + contactTax;
          
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
            const userTotal = userMealTotal + userTax;
            
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
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Grand Total:</Text>
                <Text style={styles.totalAmount}>
                  ${(calculateTotal(allMealItems) + Object.values(individualTaxes).reduce((sum, tax) => sum + tax, 0)).toFixed(2)}
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
          disabled={sendingSms}
        >
          <Text style={styles.finishButtonText}>Proceed</Text>
        </TouchableOpacity>
      </View>

      {/* SMS Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showSmsModal}
        onRequestClose={() => setShowSmsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
                         <Text style={styles.modalTitle}>Do you want to send SMS to receipients?</Text>
            
            {sendingSms ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Sending SMS...</Text>
              </View>
            ) : (
                             <View style={styles.modalButtonContainer}>
                 <TouchableOpacity 
                   style={[styles.modalButton, styles.modalButtonPrimary]}
                   onPress={sendSmsToContacts}
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
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
