import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Pressable, StyleSheet, ActivityIndicator, Modal } from 'react-native';
import { BlurView } from 'expo-blur';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSplitStore, ReceiptItem, ItemCategory } from '../stores/splitStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, fontSizes, spacing, radii } from '@/styles/theme';
import { MaterialIcons } from '@expo/vector-icons';
import { usePaywall } from '../utils/usePaywall';
import PaywallModal from '../components/PaywallModal';

export default function AssignAmounts() {
  const router = useRouter();
  const params = useLocalSearchParams<{ manual?: string }>();
  const selected = useSplitStore((state) => state.selected);
  const manageItems = useSplitStore((state) => state.manageItems);
  const receiptData = useSplitStore((state) => state.receiptData);
  const setUserItems = useSplitStore((state) => state.setUserItems);
  const setCurrentStep = useSplitStore((state) => state.setCurrentStep);
  const setResumeContactIndex = useSplitStore((state) => state.setResumeContactIndex);

  const paywall = usePaywall();
  const [showSplitEvenlyModal, setShowSplitEvenlyModal] = useState(false);

  const [currentContactIndex, setCurrentContactIndex] = useState(() => {
    if (params.initialIndex) {
      const idx = Number(params.initialIndex);
      return isNaN(idx) ? 0 : idx;
    }
    return 0;
  });

  useEffect(() => { setCurrentStep('assign'); }, []);
  useEffect(() => { setResumeContactIndex(currentContactIndex); }, [currentContactIndex]);

  const currentContact = selected[currentContactIndex];
  const CATEGORY_ORDER: ItemCategory[] = ['entree', 'appetizer', 'side', 'drink', 'dessert', 'other'];
  const CATEGORY_LABELS: Record<ItemCategory, string> = {
    entree: 'Entrees',
    appetizer: 'Appetizers',
    side: 'Sides',
    drink: 'Drinks',
    dessert: 'Desserts',
    other: 'Other',
  };

  const items = useMemo(
    () => 'items' in receiptData ? receiptData.items.filter(item => !/tax/i.test(item.name)) : [],
    [receiptData]
  );

  const available = useMemo(() => {
    const assignedToOthers = selected
      .filter(c => c.id !== currentContact?.id)
      .flatMap(c => c.items);
    return items.filter(item => !assignedToOthers.some(assigned => assigned.id === item.id));
  }, [items, selected, currentContact?.id]);

  const groupedAvailable = useMemo(() =>
    CATEGORY_ORDER
      .map(cat => ({ cat, items: available.filter(it => (it.category ?? 'other') === cat) }))
      .filter(g => g.items.length > 0),
    [available]
  );

  const hasCategoryData = useMemo(() => available.some(it => it.category != null), [available]);

  const contactTotal = currentContact?.items?.reduce((sum, item) => sum + item.price, 0) ?? 0;

  const toggleItem = useCallback((item: ReceiptItem) => {
    if (currentContact) manageItems(item, currentContact);
  }, [currentContact, manageItems]);

  const isSelected = useCallback(
    (item: ReceiptItem) => currentContact?.items?.some(it => it.id === item.id) ?? false,
    [currentContact]
  );

  const finishAssign = useCallback(async () => {
    const store = useSplitStore.getState();
    const allItems = 'items' in store.receiptData
      ? store.receiptData.items.filter(item => !/tax/i.test(item.name))
      : [];
    const allAssignedItems = store.selected.flatMap(c => c.items);
    const remainingItems = allItems.filter(item =>
      !allAssignedItems.some(assigned => assigned.id === item.id)
    );
    setUserItems(remainingItems.length > 0 ? remainingItems : []);
    router.push('/review');
  }, [setUserItems, router]);

  const splitEvenly = useCallback(() => {
    const store = useSplitStore.getState();
    const allItems = 'items' in store.receiptData
      ? store.receiptData.items.filter(item => !/tax/i.test(item.name))
      : [];
    const subtotal = allItems.reduce((sum, item) => sum + item.price, 0);
    const N = store.selected.length + 1;
    const sharePerPerson = Math.round((subtotal / N) * 100) / 100;
    const userShare = Math.round((subtotal - sharePerPerson * store.selected.length) * 100) / 100;

    store.setSplitEvenlySnapshot({
      selected: JSON.parse(JSON.stringify(store.selected)),
      userItems: [...(store.receiptData.userItems ?? [])],
    });

    useSplitStore.setState({
      selected: store.selected.map(contact => ({
        ...contact,
        items: [{ id: `even_${contact.id}`, name: 'Even split', price: sharePerPerson }],
      })),
    });
    setUserItems([{ id: 'even_user', name: 'Even split', price: userShare }]);
    router.push('/review');
  }, [setUserItems, router]);

  const nextContact = async () => {
    const isLastContact = currentContactIndex + 1 === selected.length;
    if (isLastContact) {
      await finishAssign();
    } else {
      setCurrentContactIndex(currentContactIndex + 1);
    }
  };

  const handleBack = () => {
    if (currentContactIndex > 0) {
      setCurrentContactIndex(currentContactIndex - 1);
    } else {
      router.back();
    }
  };

  if (currentContactIndex === selected.length) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.green} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerContainer}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={handleBack} style={{ marginRight: spacing.sm }}>
            <MaterialIcons name="arrow-back" size={28} color={colors.black} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginRight: spacing.sm }}>
            <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
              <Text style={{ color: colors.black }}>Assign: </Text>
              <Text style={{ color: colors.green }}>{currentContact?.name}</Text>
            </Text>
            {contactTotal > 0 && (
              <Text style={styles.contactTotal}>${contactTotal.toFixed(2)}</Text>
            )}
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={() => router.replace('/(tabs)')} style={styles.homeButton}>
              <MaterialIcons name="home" size={20} color={colors.gray400} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.itemsContainer}>
          {available.length === 0 ? (
            <Text style={styles.emptyText}>No more items to assign.</Text>
          ) : hasCategoryData ? (
            groupedAvailable.map(({ cat, items: groupItems }) => (
              <View key={cat}>
                <Text style={styles.categoryHeader}>{CATEGORY_LABELS[cat]}</Text>
                <View style={styles.categoryGroup}>
                  {groupItems.map(item => {
                    const sel = isSelected(item);
                    return (
                      <Pressable
                        key={item.id}
                        style={({ pressed }) => [styles.itemCard, sel && styles.selectedItemCard, pressed && styles.itemCardPressed]}
                        onPress={() => toggleItem(item)}
                      >
                        <View style={styles.itemInfo}>
                          <Text style={[styles.itemName, sel && styles.selectedItemText]}>{item.name}</Text>
                          <Text style={[styles.itemPrice, sel && styles.selectedItemText]}>${item.price.toFixed(2)}</Text>
                        </View>
                        <View style={[styles.checkbox, sel && styles.checkedBox]}>
                          {sel && <MaterialIcons name="check" size={16} color={colors.white} />}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))
          ) : (
            available.map(item => {
              const sel = isSelected(item);
              return (
                <Pressable
                  key={item.id}
                  style={({ pressed }) => [styles.itemCard, sel && styles.selectedItemCard, pressed && styles.itemCardPressed]}
                  onPress={() => toggleItem(item)}
                >
                  <View style={styles.itemInfo}>
                    <Text style={[styles.itemName, sel && styles.selectedItemText]}>{item.name}</Text>
                    <Text style={[styles.itemPrice, sel && styles.selectedItemText]}>${item.price.toFixed(2)}</Text>
                  </View>
                  <View style={[styles.checkbox, sel && styles.checkedBox]}>
                    {sel && <MaterialIcons name="check" size={16} color={colors.white} />}
                  </View>
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.splitEvenlyButton} onPress={() => setShowSplitEvenlyModal(true)}>
          <MaterialIcons name="call-split" size={22} color={colors.black} />
          <Text style={styles.splitEvenlyButtonText}>Split evenly</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.continueButton} onPress={nextContact}>
          <MaterialIcons name="check" size={28} color={colors.white} />
          <Text style={styles.continueButtonText}>Next</Text>
        </TouchableOpacity>
      </View>

      <Modal
        animationType="fade"
        transparent={true}
        visible={showSplitEvenlyModal}
        onRequestClose={() => setShowSplitEvenlyModal(false)}
      >
        <BlurView intensity={20} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Split evenly?</Text>
            <Text style={styles.modalSubtitle}>This will override any assignments you've made so far and split the total equally between everyone.</Text>
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={() => { setShowSplitEvenlyModal(false); splitEvenly(); }}
              >
                <Text style={styles.modalButtonPrimaryText}>Yes, split evenly</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setShowSplitEvenlyModal(false)}
              >
                <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </Modal>

      <PaywallModal
        visible={paywall.paywallVisible}
        onClose={paywall.hidePaywall}
        onSubscribe={paywall.purchaseSubscription}
        onRestore={paywall.restorePurchases}
        currentPackage={paywall.currentPackage}
        purchaseError={paywall.purchaseError}
        scanCount={paywall.scanCount}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray100,
  },
  homeButton: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 28,
  },
  contactTotal: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.sm,
    color: colors.green,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  itemsContainer: {
    gap: spacing.md,
  },
  categoryHeader: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.xs,
    color: colors.gray500,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  categoryGroup: {
    gap: spacing.md,
  },
  itemCard: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedItemCard: {
    borderColor: colors.green,
    backgroundColor: colors.greenLight,
    shadowColor: colors.green,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  itemCardPressed: {
    opacity: 0.75,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.black,
    marginBottom: 4,
  },
  itemPrice: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.md,
    color: colors.green,
  },
  selectedItemText: {},
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: radii.full,
    borderWidth: 2,
    borderColor: colors.gray300,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.md,
  },
  checkedBox: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    paddingTop: spacing.md,
    gap: spacing.sm,
    backgroundColor: 'transparent',
  },
  splitEvenlyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 54,
    borderRadius: radii.xl,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.gray200,
  },
  splitEvenlyButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.md,
    color: colors.black,
  },
  continueButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 54,
    borderRadius: radii.xl,
    backgroundColor: colors.black,
    shadowColor: colors.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  continueButtonText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.md,
    color: colors.white,
  },
  emptyText: {
    textAlign: 'center',
    fontFamily: fonts.body,
    color: colors.gray500,
    marginTop: spacing.xl,
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
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.gray500,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 20,
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
  },
});
