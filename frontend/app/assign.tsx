import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, ActivityIndicator, Modal } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSplitStore, ReceiptItem } from '../stores/splitStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, fontSizes, spacing, radii, shadows } from '@/styles/theme';
import { MaterialIcons } from '@expo/vector-icons';
import AgentChatPanel from '../components/AgentChatPanel';

export default function AssignAmounts() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const selected = useSplitStore((state) => state.selected);
  const manageItems = useSplitStore((state) => state.manageItems);
  const receiptData = useSplitStore((state) => state.receiptData);
  const setUserItems = useSplitStore((state) => state.setUserItems);

  const [agentVisible, setAgentVisible] = useState(false);

  const [currentContactIndex, setCurrentContactIndex] = useState(() => {
    if (params.initialIndex) {
      const idx = Number(params.initialIndex);
      return isNaN(idx) ? 0 : idx;
    }
    return 0;
  });

  const currentContact = selected[currentContactIndex];
  const items = 'items' in receiptData ? receiptData.items.filter(item => !/tax/i.test(item.name)) : [];

  const assignedToOthers = selected
    .filter(c => c.id !== currentContact?.id)
    .flatMap(c => c.items);

  const available = items.filter(item => !assignedToOthers.some(assigned => assigned.id === item.id));

  const toggleItem = (item: ReceiptItem) => {
    if (currentContact) {
      manageItems(item, currentContact);
    }
  }

  const isSelected = (item: ReceiptItem) => {
    return currentContact?.items?.some(it => it.id === item.id);
  };

  const nextContact = async () => {
    if (currentContactIndex + 1 === selected.length) {
      const allAssignedItems = selected.flatMap(c => c.items);

      const remainingItems = items.filter(item =>
        !allAssignedItems.some(assigned => assigned.id === item.id)
      );

      if (remainingItems.length > 0) {
        setUserItems(remainingItems);
      } else {
        setUserItems([]);
      }
      router.push("/review");
    } else {
      setCurrentContactIndex(currentContactIndex + 1);
    }
  }

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
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerContainer}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={handleBack} style={{ marginRight: spacing.sm }}>
            <MaterialIcons name="arrow-back" size={28} color={colors.black} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
            <Text style={{ color: colors.black }}>Assign Items to </Text>
            <Text style={{ color: colors.green }}>{currentContact?.name}</Text>
          </Text>
          <TouchableOpacity
            style={styles.agentButton}
            onPress={() => setAgentVisible(true)}
            activeOpacity={0.8}
          >
            <MaterialIcons name="auto-awesome" size={20} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.itemsContainer}>
          {available.length === 0 ? (
            <Text style={styles.emptyText}>No more items to assign.</Text>
          ) : (
            available.map(item => {
              const selected = isSelected(item);
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.itemCard, selected && styles.selectedItemCard]}
                  onPress={() => toggleItem(item)}
                  activeOpacity={0.8}
                >
                  <View style={styles.itemInfo}>
                    <Text style={[styles.itemName, selected && styles.selectedItemText]}>{item.name}</Text>
                    <Text style={[styles.itemPrice, selected && styles.selectedItemText]}>${item.price.toFixed(2)}</Text>
                  </View>
                  <View style={[styles.checkbox, selected && styles.checkedBox]}>
                    {selected && <MaterialIcons name="check" size={16} color={colors.white} />}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={nextContact}>
          <MaterialIcons name="check" size={32} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Agent chat modal */}
      <Modal
        visible={agentVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setAgentVisible(false)}
      >
        <SafeAreaView style={styles.modalSafeArea} edges={['top']}>
          <View style={styles.modalHandle} />
          <TouchableOpacity
            style={styles.modalClose}
            onPress={() => setAgentVisible(false)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialIcons name="keyboard-arrow-down" size={28} color={colors.gray500} />
          </TouchableOpacity>
          <AgentChatPanel />
        </SafeAreaView>
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
    paddingBottom: spacing.md,
  },
  headerTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 28,
    flex: 1,
    marginRight: spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 100, // Space for footer
  },
  itemsContainer: {
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
    backgroundColor: colors.white, // Keep white bg but emphasize border
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
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.md,
    color: colors.green,
  },
  selectedItemText: {
    // Optional: change text color when selected? keeping it standard for now looks cleaner
  },
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
    padding: spacing.xl,
    backgroundColor: 'transparent', // Let content scroll behind? Or white bg?
    // Let's make it a gradient or just transparent with floating button
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButton: {
    width: 72,
    height: 72,
    borderRadius: radii.full,
    backgroundColor: colors.black,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  emptyText: {
    textAlign: 'center',
    fontFamily: fonts.body,
    color: colors.gray500,
    marginTop: spacing.xl,
  },
  agentButton: {
    width: 38,
    height: 38,
    borderRadius: radii.full,
    backgroundColor: colors.black,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.green,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  modalSafeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: radii.full,
    backgroundColor: colors.gray300,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  modalClose: {
    alignSelf: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
});



