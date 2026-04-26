import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Animated } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSplitStore, ReceiptItem, ItemCategory } from '../stores/splitStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, fontSizes, spacing, radii } from '@/styles/theme';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useVoiceAgent } from '../utils/useVoiceAgent';
import { ActionSummary } from '../utils/useAgentChat';
import DiviLogoAnimated from '../components/DiviLogoAnimated';

export default function AssignAmounts() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const selected = useSplitStore((state) => state.selected);
  const manageItems = useSplitStore((state) => state.manageItems);
  const receiptData = useSplitStore((state) => state.receiptData);
  const setUserItems = useSplitStore((state) => state.setUserItems);
  const setCurrentStep = useSplitStore((state) => state.setCurrentStep);
  const setResumeContactIndex = useSplitStore((state) => state.setResumeContactIndex);

  const agent = useVoiceAgent();

  // ── Agent overlay ─────────────────────────────────────────────────────────
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [overlayPhase, setOverlayPhase] = useState<'processing' | 'revealing'>('processing');
  const [revealItems, setRevealItems] = useState<{ summary: ActionSummary; opacity: Animated.Value; translateY: Animated.Value }[]>([]);
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const overlayActiveRef = useRef(false);

  useEffect(() => {
    const isProcessing = agent.loading || agent.isTranscribing;
    if (isProcessing) {
      if (!overlayActiveRef.current) {
        overlayActiveRef.current = true;
        setOverlayPhase('processing');
        setOverlayVisible(true);
        Animated.timing(overlayOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      }
      return;
    }
    if (!overlayActiveRef.current) return;
    overlayActiveRef.current = false;

    const summary = agent.lastActionSummary;
    if (summary && summary.length > 0) {
      const items = summary.map(s => ({
        summary: s,
        opacity: new Animated.Value(0),
        translateY: new Animated.Value(12),
      }));
      setRevealItems(items);
      setOverlayPhase('revealing');
      Animated.sequence([
        Animated.stagger(500, items.map(item =>
          Animated.parallel([
            Animated.timing(item.opacity, { toValue: 1, duration: 450, useNativeDriver: true }),
            Animated.timing(item.translateY, { toValue: 0, duration: 450, useNativeDriver: true }),
          ])
        )),
        Animated.delay(2000),
        Animated.timing(overlayOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start(() => {
        setOverlayVisible(false);
        setRevealItems([]);
      });
    } else {
      Animated.timing(overlayOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
        setOverlayVisible(false);
      });
    }
  }, [agent.loading, agent.isTranscribing, agent.lastActionSummary]);

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
  const items = 'items' in receiptData ? receiptData.items.filter(item => !/tax/i.test(item.name)) : [];

  const assignedToOthers = selected
    .filter(c => c.id !== currentContact?.id)
    .flatMap(c => c.items);

  const available = items.filter(item => !assignedToOthers.some(assigned => assigned.id === item.id));

  const CATEGORY_ORDER: ItemCategory[] = ['entree', 'appetizer', 'side', 'drink', 'dessert', 'other'];
  const CATEGORY_LABELS: Record<ItemCategory, string> = {
    entree: 'Entrees',
    appetizer: 'Appetizers',
    side: 'Sides',
    drink: 'Drinks',
    dessert: 'Desserts',
    other: 'Other',
  };
  const groupedAvailable = CATEGORY_ORDER
    .map(cat => ({ cat, items: available.filter(it => (it.category ?? 'other') === cat) }))
    .filter(g => g.items.length > 0);
  const hasCategoryData = available.some(it => it.category != null);

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
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={() => router.replace('/(tabs)')} style={styles.homeButton}>
              <MaterialIcons name="home" size={20} color={colors.gray400} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.agentButton, agent.isRecording && styles.agentButtonRecording]}
              onPress={agent.isRecording ? agent.stopAndSend : agent.startRecording}
              disabled={agent.loading || agent.isTranscribing}
              activeOpacity={0.8}
            >
              <MaterialIcons
                name={agent.isRecording ? 'stop' : 'auto-awesome'}
                size={18}
                color={agent.isRecording ? colors.white : colors.green}
              />
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
                      <TouchableOpacity
                        key={item.id}
                        style={[styles.itemCard, sel && styles.selectedItemCard]}
                        onPress={() => toggleItem(item)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.itemInfo}>
                          <Text style={[styles.itemName, sel && styles.selectedItemText]}>{item.name}</Text>
                          <Text style={[styles.itemPrice, sel && styles.selectedItemText]}>${item.price.toFixed(2)}</Text>
                        </View>
                        <View style={[styles.checkbox, sel && styles.checkedBox]}>
                          {sel && <MaterialIcons name="check" size={16} color={colors.white} />}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))
          ) : (
            available.map(item => {
              const sel = isSelected(item);
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.itemCard, sel && styles.selectedItemCard]}
                  onPress={() => toggleItem(item)}
                  activeOpacity={0.8}
                >
                  <View style={styles.itemInfo}>
                    <Text style={[styles.itemName, sel && styles.selectedItemText]}>{item.name}</Text>
                    <Text style={[styles.itemPrice, sel && styles.selectedItemText]}>${item.price.toFixed(2)}</Text>
                  </View>
                  <View style={[styles.checkbox, sel && styles.checkedBox]}>
                    {sel && <MaterialIcons name="check" size={16} color={colors.white} />}
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

      {/* Agent overlay — processing spinner → action reveal → fade out */}
      {overlayVisible && (
        <Animated.View style={[styles.processingOverlay, { opacity: overlayOpacity }]}>
          <BlurView intensity={55} style={StyleSheet.absoluteFill} />
          <View style={styles.overlayContent}>
            {overlayPhase === 'processing' && (
              <DiviLogoAnimated size={140} />
            )}
            {overlayPhase === 'revealing' && (
              <View style={styles.actionList}>
                {revealItems.map((item, i) => {
                  const verbColor =
                    item.summary.verb === 'Assigned' ? colors.green :
                    item.summary.verb === 'Unassigned' ? colors.error :
                    colors.black;
                  const iconName =
                    item.summary.verb === 'Assigned' ? 'check-circle-outline' :
                    item.summary.verb === 'Unassigned' ? 'remove-circle-outline' :
                    item.summary.verb === 'Split' ? 'call-split' :
                    'edit';
                  return (
                    <Animated.View
                      key={i}
                      style={[styles.actionRow, { opacity: item.opacity, transform: [{ translateY: item.translateY }] }]}
                    >
                      <MaterialIcons name={iconName as any} size={18} color={verbColor} />
                      <Text style={[styles.actionVerb, { color: verbColor }]}>{item.summary.verb}</Text>
                      <Text style={styles.actionName} numberOfLines={1}>{item.summary.name}</Text>
                      {item.summary.amount !== undefined && (
                        <Text style={styles.actionAmount}>${item.summary.amount.toFixed(2)}</Text>
                      )}
                    </Animated.View>
                  );
                })}
              </View>
            )}
          </View>
        </Animated.View>
      )}
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
    fontFamily: fonts.bodySemiBold,
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  homeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  agentButton: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    backgroundColor: `${colors.green}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  agentButtonRecording: {
    backgroundColor: colors.error,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  overlayContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.xl + 8,
  },
  actionList: {
    gap: spacing.xl,
    width: '100%',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  actionVerb: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.xl,
    minWidth: 90,
  },
  actionName: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xl,
    color: colors.black,
    flex: 1,
  },
  actionAmount: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.xl,
    color: colors.green,
  },
});



