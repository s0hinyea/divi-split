import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Pressable, StyleSheet, ActivityIndicator, Animated } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSplitStore, ReceiptItem, ItemCategory } from '../stores/splitStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, fontSizes, spacing, radii } from '@/styles/theme';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useVoiceAgent } from '../utils/useVoiceAgent';
import { ActionSummary } from '../utils/useAgentChat';
import DiviLogoAnimated from '../components/DiviLogoAnimated';
import { usePaywall } from '../utils/usePaywall';
import PaywallModal from '../components/PaywallModal';
import { useCustomAlert } from '../components/CustomAlert';

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
  const paywall = usePaywall();
  const { showAlert } = useCustomAlert();

  const [mode, setMode] = useState<'fork' | 'manual'>('fork');
  const [agentDidAct, setAgentDidAct] = useState(false);

  // Pulse animation for recording
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (agent.isRecording) {
      pulseLoopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.25, duration: 700, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        ])
      );
      pulseLoopRef.current.start();
    } else {
      pulseLoopRef.current?.stop();
      Animated.timing(pulseAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    }
    return () => pulseLoopRef.current?.stop();
  }, [agent.isRecording]);

  // Spin animation for processing
  const spinAnim = useRef(new Animated.Value(0)).current;
  const spinLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const isProcessing = agent.loading || agent.isTranscribing;

  useEffect(() => {
    if (isProcessing) {
      spinLoopRef.current = Animated.loop(
        Animated.timing(spinAnim, { toValue: 1, duration: 900, useNativeDriver: true, easing: (t) => t })
      );
      spinLoopRef.current.start();
    } else {
      spinLoopRef.current?.stop();
      spinAnim.setValue(0);
    }
    return () => spinLoopRef.current?.stop();
  }, [isProcessing]);

  const spinDeg = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  // ── Agent overlay ─────────────────────────────────────────────────────────
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [overlayPhase, setOverlayPhase] = useState<'processing' | 'revealing' | 'message'>('processing');
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
      setAgentDidAct(true);
      const items = summary.map(s => ({
        summary: s,
        opacity: new Animated.Value(0),
        translateY: new Animated.Value(12),
      }));
      setRevealItems(items);
      setOverlayPhase('revealing');
      Animated.sequence([
        Animated.stagger(250, items.map(item =>
          Animated.parallel([
            Animated.timing(item.opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
            Animated.timing(item.translateY, { toValue: 0, duration: 300, useNativeDriver: true }),
          ])
        )),
        Animated.delay(900),
        Animated.timing(overlayOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => {
        setOverlayVisible(false);
        setRevealItems([]);
      });
    } else if (agent.lastReply) {
      setOverlayPhase('message');
      Animated.sequence([
        Animated.delay(1800),
        Animated.timing(overlayOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => setOverlayVisible(false));
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

  const contactTotal = currentContact?.items?.reduce((sum, item) => sum + item.price, 0) ?? 0;

  const toggleItem = (item: ReceiptItem) => {
    if (currentContact) {
      manageItems(item, currentContact);
    }
  };

  const isSelected = (item: ReceiptItem) => {
    return currentContact?.items?.some(it => it.id === item.id);
  };

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
    router.push("/review");
  }, [setUserItems, router]);

  // Auto-navigate after voice agent acts in fork mode
  useEffect(() => {
    if (agentDidAct && mode === 'fork') {
      finishAssign();
    }
  }, [agentDidAct, mode, finishAssign]);

  const nextContact = async () => {
    const isLastContact = currentContactIndex + 1 === selected.length;
    if (isLastContact) {
      await finishAssign();
    } else {
      setCurrentContactIndex(currentContactIndex + 1);
    }
  };

  const handleBack = () => {
    if (mode === 'manual') {
      if (currentContactIndex > 0) {
        setCurrentContactIndex(currentContactIndex - 1);
      } else {
        setMode('fork');
      }
    } else {
      router.back();
    }
  };

  const handleVoicePress = async () => {
    if (agent.isRecording) {
      agent.stopAndSend();
      return;
    }

    if (paywall.isSubscribed) {
      agent.startRecording();
      return;
    }

    const remaining = paywall.scansRemaining;
    if (remaining > 0) {
      const label = remaining === 1 ? '1 free scan left' : `${remaining} free scans left`;
      showAlert({
        title: label,
        message: remaining === 1
          ? "This is your last free AI scan. After this you'll need Divi Pro."
          : `You have ${remaining} free AI scans remaining. Use one now?`,
        buttons: [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Use scan',
            onPress: async () => {
              const allowed = await paywall.attemptAgentUse();
              if (allowed) agent.startRecording();
            },
          },
        ],
      });
    } else {
      const allowed = await paywall.attemptAgentUse();
      if (allowed) agent.startRecording();
    }
  };

  if (currentContactIndex === selected.length) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.green} />
      </View>
    );
  }

  // ── Fork mode ──────────────────────────────────────────────────────────────
  if (mode === 'fork') {
    return (
      <SafeAreaView style={styles.forkContainer} edges={['top']}>
        {/* Header */}
        <View style={styles.forkHeader}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={26} color={colors.black} />
          </TouchableOpacity>
          <Text style={styles.forkHeaderTitle}>Assign Items</Text>
          <TouchableOpacity onPress={() => router.replace('/(tabs)')} style={styles.homeButton}>
            <MaterialIcons name="home" size={20} color={colors.gray400} />
          </TouchableOpacity>
        </View>

        {/* Voice controls */}
        <View style={styles.voiceZone}>
          <MaterialIcons name="auto-awesome" size={22} color={colors.green} style={{ marginBottom: spacing.md }} />
          <Text style={styles.voiceTitle}>
            {agent.isRecording ? 'Listening...' : agent.isTranscribing ? 'Transcribing...' : agent.loading ? 'Working...' : 'Say who gets what.'}
          </Text>
          <Text style={styles.voiceSubtitle}>
            {agent.isRecording
              ? 'Speak clearly, then tap mic to send'
              : 'Anything not assigned goes to you.'}
          </Text>

          {/* Big mic button */}
          <View style={styles.micWrapper}>
            <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseAnim }] }]} />
            {isProcessing && (
              <Animated.View style={[styles.spinRing, { transform: [{ rotate: spinDeg }] }]} />
            )}
            <TouchableOpacity
              style={[styles.bigMicButton, agent.isRecording && styles.bigMicButtonActive, isProcessing && styles.bigMicButtonProcessing]}
              onPress={handleVoicePress}
              disabled={isProcessing}
              activeOpacity={0.85}
            >
              <MaterialIcons
                name={agent.isRecording ? 'stop' : 'mic'}
                size={36}
                color={colors.white}
              />
            </TouchableOpacity>
          </View>

          {/* Contact chips */}
          <View style={styles.chipRow}>
            {selected.map(contact => {
              const hasItems = contact.items && contact.items.length > 0;
              return (
                <View key={contact.id} style={[styles.chip, hasItems && styles.chipActive]}>
                  {hasItems && (
                    <MaterialIcons name="check" size={13} color={colors.green} style={{ marginRight: 3 }} />
                  )}
                  <Text style={[styles.chipText, hasItems && styles.chipTextActive]}>
                    {contact.name}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Item reference list */}
        <ScrollView
          style={styles.itemRefList}
          contentContainerStyle={styles.itemRefContent}
          showsVerticalScrollIndicator={false}
        >
          {items.map((item, i) => {
            const isAssigned = selected.some(c => c.items?.some(ci => ci.id === item.id));
            return (
              <View key={item.id} style={[styles.itemRefRow, i < items.length - 1 && styles.itemRefRowBorder]}>
                <Text style={[styles.itemRefName, isAssigned && styles.itemRefNameAssigned]} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={[styles.itemRefPrice, isAssigned && styles.itemRefPriceAssigned]}>
                  ${item.price.toFixed(2)}
                </Text>
                {isAssigned && (
                  <MaterialIcons name="check" size={13} color={colors.green} style={{ marginLeft: spacing.xs }} />
                )}
              </View>
            );
          })}
        </ScrollView>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerLabel}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Manual zone */}
        <View style={styles.manualZone}>
          <TouchableOpacity style={styles.continueReviewButton} onPress={finishAssign}>
            <MaterialIcons name="check" size={18} color={colors.white} />
            <Text style={styles.continueReviewText}>Looks good</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.manualButton}
            onPress={() => setMode('manual')}
            activeOpacity={0.8}
          >
            <Text style={styles.manualButtonText}>Assign manually</Text>
          </TouchableOpacity>
          <Text style={styles.manualHint}>Go person by person</Text>
        </View>

        <PaywallModal
          visible={paywall.paywallVisible}
          onClose={paywall.hidePaywall}
          onSubscribe={paywall.purchaseSubscription}
          onRestore={paywall.restorePurchases}
          currentPackage={paywall.currentPackage}
          purchaseError={paywall.purchaseError}
        />
      </SafeAreaView>
    );
  }

  // ── Manual mode ────────────────────────────────────────────────────────────
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
            <TouchableOpacity
              style={[styles.agentButton, agent.isRecording && styles.agentButtonRecording]}
              onPress={handleVoicePress}
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
        {agent.lastActionSummary && agent.lastActionSummary.length > 0 && (
          <TouchableOpacity style={styles.undoButton} onPress={agent.undoLastAgentAction}>
            <MaterialIcons name="undo" size={22} color={colors.black} />
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.continueButton} onPress={nextContact}>
          <MaterialIcons name="check" size={32} color={colors.white} />
        </TouchableOpacity>
      </View>

      <PaywallModal
        visible={paywall.paywallVisible}
        onClose={paywall.hidePaywall}
        onSubscribe={paywall.purchaseSubscription}
        onRestore={paywall.restorePurchases}
        currentPackage={paywall.currentPackage}
        purchaseError={paywall.purchaseError}
      />

      {/* Agent overlay */}
      {overlayVisible && (
        <Animated.View
          style={[styles.processingOverlay, { opacity: overlayOpacity }]}
          onTouchEnd={() => {
            if (overlayPhase === 'revealing') {
              Animated.timing(overlayOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
                setOverlayVisible(false);
                setRevealItems([]);
              });
            }
          }}
        >
          <BlurView intensity={55} style={StyleSheet.absoluteFill} />
          <View style={styles.overlayContent}>
            {overlayPhase === 'processing' && <DiviLogoAnimated size={140} />}
            {overlayPhase === 'message' && (
              <View style={styles.messagePhase}>
                <MaterialIcons name="info-outline" size={28} color={colors.gray500} />
                <Text style={styles.messagePhaseText}>{agent.lastReply}</Text>
              </View>
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
  // ── Shared ──────────────────────────────────────────────────────────────────
  container: {
    flex: 1,
    backgroundColor: colors.gray100,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  homeButton: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Fork mode ───────────────────────────────────────────────────────────────
  forkContainer: {
    flex: 1,
    backgroundColor: colors.white,
  },
  forkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  forkHeaderTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.xl,
    color: colors.black,
  },
  voiceZone: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  voiceTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.xl,
    color: colors.black,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  voiceSubtitle: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.gray500,
    textAlign: 'center',
    marginBottom: spacing.xl + spacing.md,
  },
  micWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl + spacing.md,
  },
  pulseRing: {
    position: 'absolute',
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: `${colors.green}18`,
  },
  bigMicButton: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.black,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 10,
  },
  bigMicButtonActive: {
    backgroundColor: colors.error,
    shadowColor: colors.error,
    shadowOpacity: 0.3,
  },
  bigMicButtonProcessing: {
    opacity: 0.6,
  },
  spinRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2.5,
    borderColor: 'transparent',
    borderTopColor: colors.green,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    backgroundColor: colors.gray100,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  chipActive: {
    backgroundColor: `${colors.green}12`,
    borderColor: `${colors.green}50`,
  },
  chipText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.sm,
    color: colors.gray500,
  },
  chipTextActive: {
    color: colors.green,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.xl + spacing.md,
    marginVertical: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.gray200,
  },
  dividerLabel: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.gray400,
    marginHorizontal: spacing.md,
  },
  itemRefList: {
    flex: 1,
    marginHorizontal: spacing.lg,
  },
  itemRefContent: {
    paddingVertical: spacing.xs,
  },
  itemRefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
  },
  itemRefRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray200,
  },
  itemRefName: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.gray500,
  },
  itemRefNameAssigned: {
    color: colors.gray300,
    textDecorationLine: 'line-through',
  },
  itemRefPrice: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.sm,
    color: colors.gray400,
  },
  itemRefPriceAssigned: {
    color: colors.gray300,
  },
  manualZone: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  continueReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.green,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.xl + spacing.md,
    borderRadius: radii.lg,
    width: '100%',
    shadowColor: colors.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  continueReviewText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.md,
    color: colors.white,
  },
  manualButton: {
    width: '100%',
    paddingVertical: spacing.md + 2,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.gray300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manualButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.md,
    color: colors.black,
  },
  manualHint: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.gray400,
  },
  unassignedNote: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.gray400,
    textAlign: 'center',
    marginTop: spacing.xs,
  },

  // ── Manual mode ─────────────────────────────────────────────────────────────
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
    backgroundColor: colors.white,
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
    padding: spacing.xl,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.lg,
  },
  undoButton: {
    width: 48,
    height: 48,
    borderRadius: radii.full,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    gap: spacing.sm,
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

  // ── Overlay ─────────────────────────────────────────────────────────────────
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
  messagePhase: {
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  messagePhaseText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.lg,
    color: colors.gray600,
    textAlign: 'center',
    lineHeight: 26,
  },
});
