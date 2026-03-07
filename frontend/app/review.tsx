import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, Alert, ActivityIndicator, TextInput, Platform, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSplitStore, ReceiptItem } from '../stores/splitStore';
import { useHistory } from '../utils/HistoryContext';
import { useProfile } from '../utils/ProfileContext';
import * as SMS from 'expo-sms';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, fontSizes, spacing, radii, shadows } from '@/styles/theme';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { allocateAmount } from '../utils/mathUtil';
export default function ReviewPage() {
  const router = useRouter();
  const selected = useSplitStore((state) => state.selected);
  const clearItems = useSplitStore((state) => state.clearItems);
  const clearSelected = useSplitStore((state) => state.clearSelected);
  const receiptData = useSplitStore((state) => state.receiptData);
  const setUserItems = useSplitStore((state) => state.setUserItems);
  const updateReceiptData = useSplitStore((state) => state.updateReceiptData);
  const calculateTotal = useSplitStore((state) => state.calculateTotal);
  const saveReceipt = useSplitStore((state) => state.saveReceipt);
  const updateContactName = useSplitStore((state) => state.updateContactName);
  const { refreshReceipts } = useHistory();
  const { profile } = useProfile();
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

    const shares: { id: string; share: number }[] = [];
    selected.forEach(contact => {
      shares.push({ id: contact.id, share: calculateTotal(contact.items as ReceiptItem[]) });
    });
    if (receiptData.userItems && receiptData.userItems.length > 0) {
      shares.push({ id: 'user', share: calculateTotal(receiptData.userItems as ReceiptItem[]) });
    }

    const individualTaxes = allocateAmount(receiptData.tax, shares);
    return { taxPercentage: 0, individualTaxes }; // Return signature kept identical for UI components
  };

  const calculateTipBreakdown = () => {
    if (!('tip' in receiptData) || !receiptData.tip || receiptData.tip <= 0) {
      return { tipPerPerson: 0, individualTips: {} };
    }

    const shares: { id: string; share: number }[] = [];
    selected.forEach(contact => {
      shares.push({ id: contact.id, share: 1 }); // Even split for tips (weight of 1 each)
    });
    if (receiptData.userItems && receiptData.userItems.length > 0) {
      shares.push({ id: 'user', share: 1 });
    }

    const individualTips = allocateAmount(receiptData.tip, shares);
    return { tipPerPerson: 0, individualTips }; // Return signature kept identical for UI components
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

      // Append Venmo Link if handle exists
      if (profile?.venmo_handle) {
        const handle = profile.venmo_handle.replace('@', '');
        const note = encodeURIComponent(`Divi Split - ${name}`);
        // Deep link format: venmo://paycharge?txn=pay&recipients=HANDLE&note=NOTE
        // Web fallback: https://venmo.com/u/HANDLE
        const venmoLink = `https://venmo.com/u/${handle}`;
        message += `\n\nPay me on Venmo:\n${venmoLink}`;
      }

      // Append CashApp Link if handle exists
      if (profile?.cashapp_handle) {
        const handle = profile.cashapp_handle.replace('$', '');
        const cashLink = `https://cash.app/$${handle}`;
        message += `\n\nPay me on Cash App:\n${cashLink}`;
      }

      // Append Zelle Info if number exists
      if (profile?.zelle_number) {
        message += `\n\nPay me on Zelle:\n${profile.zelle_number}`;
      }

      await SMS.sendSMSAsync(phoneNumbers, message);
      setShowSmsModal(false);
      triggerCompletion();

    } catch (error) {
      console.error('SMS Error:', error);
      Alert.alert('Error', 'Failed to open Messages.');
      setShowSmsModal(false);
    }
  };

  // Clean up and route to home; the global CompletionOverlay (in _layout)
  // is triggered BEFORE navigation so the blur covers the transition.
  const triggerCompletion = () => {
    const { triggerCompletion: showOverlay } = useSplitStore.getState();
    showOverlay();              // overlay appears instantly over current screen
    
    // Give the overlay 50ms to mount and render its first opaque frame
    // before we trigger the heavy layout transition of navigation.
    setTimeout(() => {
      clearItems();
      clearSelected();
      setUserItems([]);
      router.replace('/(tabs)');
    }, 50);
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
    const success = await saveReceipt(name, receiptDate);

    if (success) {
      await refreshReceipts();
    }

    if (selected.length > 0) {
      setShowSmsModal(true);
    } else {
      triggerCompletion();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerContainer}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => router.push({ pathname: '/assign', params: { initialIndex: selected.length - 1 } })}
            style={{ marginRight: spacing.sm }}
          >
            <MaterialIcons name="arrow-back" size={28} color={colors.black} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            <Text style={{ color: colors.black }}>Review </Text>
            <Text style={{ color: colors.green }}>Split</Text>
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Receipt Name and Date Section */}
        <View style={styles.detailsCard}>
          <Text style={styles.inputLabel}>Receipt Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Dinner at Joe's"
            placeholderTextColor={colors.gray400}
            value={receiptName}
            onChangeText={setReceiptName}
          />

          <Text style={styles.inputLabel}>Receipt Date</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateText}>{receiptDate.toLocaleDateString()}</Text>
            <Text style={styles.changeDateText}>Change</Text>
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

        <Text style={styles.sectionTitle}>Breakdown</Text>
        <Text style={styles.sectionSubtitle}>Tap a name below to edit it if needed</Text>

        {selected.map((contact) => {
          const contactMealTotal = calculateTotal(contact.items as ReceiptItem[]);
          const contactTax = individualTaxes[contact.id] || 0;
          const contactTip = individualTips[contact.id] || 0;
          const contactTotal = contactMealTotal + contactTax + contactTip;

          return (
            <View key={contact.id} style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <TextInput
                  style={styles.cardTitleInput}
                  value={contact.name}
                  onChangeText={(text) => updateContactName(contact.id, text)}
                  placeholder="Contact Name"
                  placeholderTextColor={colors.gray400}
                />
                <MaterialIcons name="edit" size={16} color={colors.gray400} />
              </View>
              <View style={styles.cardDivider} />

              {contact.items.map((item: ReceiptItem) => (
                <View key={item.id} style={styles.itemRow}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
                </View>
              ))}

              <View style={styles.cardDivider} />

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>${contactMealTotal.toFixed(2)}</Text>
              </View>
              {contactTax > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Tax</Text>
                  <Text style={styles.summaryValue}>${contactTax.toFixed(2)}</Text>
                </View>
              )}
              {contactTip > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Tip</Text>
                  <Text style={styles.summaryValue}>${contactTip.toFixed(2)}</Text>
                </View>
              )}

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
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
              <View style={styles.card}>
                <Text style={styles.cardTitle}>You</Text>
                <View style={styles.cardDivider} />

                {receiptData.userItems.map((item: ReceiptItem) => (
                  <View key={item.id} style={styles.itemRow}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
                  </View>
                ))}

                <View style={styles.cardDivider} />

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal</Text>
                  <Text style={styles.summaryValue}>${userMealTotal.toFixed(2)}</Text>
                </View>
                {userTax > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Tax</Text>
                    <Text style={styles.summaryValue}>${userTax.toFixed(2)}</Text>
                  </View>
                )}
                {userTip > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Tip</Text>
                    <Text style={styles.summaryValue}>${userTip.toFixed(2)}</Text>
                  </View>
                )}
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Your Total</Text>
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
            <View style={[styles.card, styles.totalCard]}>
              <Text style={styles.cardTitle}>Grand Total</Text>
              <View style={styles.cardDivider} />

              <View style={styles.summaryRow}>
                <Text style={styles.itemName}>Subtotal (all meals)</Text>
                <Text style={styles.itemPrice}>
                  ${(calculateTotal(allMealItems)).toFixed(2)}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.itemName}>Total Tax</Text>
                <Text style={styles.itemPrice}>
                  ${Object.values(individualTaxes).reduce((sum, tax) => sum + tax, 0).toFixed(2)}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.itemName}>Total Tip</Text>
                <Text style={styles.itemPrice}>
                  ${Object.values(individualTips).reduce((sum, tip) => sum + tip, 0).toFixed(2)}
                </Text>
              </View>

              <View style={styles.cardDivider} />

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Final Amount</Text>
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
        animationType="fade"
        transparent={true}
        visible={showSmsModal}
        onRequestClose={() => setShowSmsModal(false)}
      >
        <BlurView intensity={20} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Send split summary to group chat?</Text>

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={sendGroupSummary}
              >
                <Text style={styles.modalButtonPrimaryText}>Yes, Send</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => {
                  setShowSmsModal(false);
                  triggerCompletion();
                }}
              >
                <Text style={styles.modalButtonSecondaryText}>No, Skip</Text>
              </TouchableOpacity>
            </View>
          </View>
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
  },
  headerTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 28,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.lg,
    color: colors.black,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionSubtitle: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.gray500,
    marginTop: -spacing.sm,
    marginBottom: spacing.lg,
  },
  detailsCard: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    padding: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  inputLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.sm,
    color: colors.gray600,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  input: {
    backgroundColor: colors.gray100,
    borderRadius: radii.md,
    padding: spacing.md,
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.black,
  },
  dateButton: {
    backgroundColor: colors.gray100,
    borderRadius: radii.md,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.black,
  },
  changeDateText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.sm,
    color: colors.green,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  totalCard: {
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.green,
  },
  cardTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.lg,
    color: colors.black,
    marginBottom: spacing.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  cardTitleInput: {
    flex: 1,
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.lg,
    color: colors.black,
    padding: 0,
    margin: 0,
  },
  cardDivider: {
    height: 1,
    backgroundColor: colors.gray200,
    marginVertical: spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  itemName: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.gray600,
    flex: 1,
  },
  itemPrice: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.black,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  summaryLabel: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.gray500,
  },
  summaryValue: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.sm,
    color: colors.black,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
  },
  totalLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.md,
    color: colors.black,
  },
  totalAmount: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.lg,
    color: colors.green,
  },
  footer: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  finishButton: {
    backgroundColor: colors.black,
    borderRadius: radii.full,
    paddingVertical: spacing.md,
    alignItems: 'center',
    shadowColor: colors.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  finishButtonText: {
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
  modalButtonContainer: {
    gap: spacing.md,
  },
  modalButton: {
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    alignItems: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: colors.black,
  },
  modalButtonSecondary: {
    backgroundColor: colors.gray200,
  },
  modalButtonPrimaryText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.md,
    color: colors.white,
  },
  modalButtonSecondaryText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.md,
    color: colors.black,
  }
});
