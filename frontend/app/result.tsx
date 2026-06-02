import { useRouter } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import {
  View, TextInput, StyleSheet, TouchableOpacity, Pressable,
  Modal, Text, Keyboard, Animated, Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { ScrollView } from 'react-native-gesture-handler';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { MaterialIcons } from '@expo/vector-icons';
import { useChange } from '../utils/ChangesContext';
import 'react-native-get-random-values';
import * as uuid from 'uuid';
import { BlurView } from 'expo-blur';
import { colors, fonts, fontSizes, spacing, radii } from '@/styles/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSplitStore, ReceiptItem, ItemCategory } from '../stores/splitStore';
import { useResultAgent, ActionSummary } from '../utils/useResultAgent';
import DiviLogoAnimated from '../components/DiviLogoAnimated';
import { usePaywall } from '../utils/usePaywall';
import PaywallModal from '../components/PaywallModal';
import { useCustomAlert } from '../components/CustomAlert';

export default function OCRResults() {
  const router = useRouter();
  const updateItem = useSplitStore((state) => state.updateItem);
  const removeItem = useSplitStore((state) => state.removeItem);
  const addItem = useSplitStore((state) => state.addItem);
  const splitItemStore = useSplitStore((state) => state.splitItem);
  const updateReceiptData = useSplitStore((state) => state.updateReceiptData);
  const receiptData = useSplitStore((state) => state.receiptData);
  const setCurrentStep = useSplitStore((state) => state.setCurrentStep);
  const { addChange, undoChange, clearChanges, changes } = useChange();

  const paywall = usePaywall();
  const { showAlert } = useCustomAlert();

  const [mode, setMode] = useState<'fork' | 'manual'>('fork');
  const [agentDidAct, setAgentDidAct] = useState(false);

  useEffect(() => { setCurrentStep('result'); }, []);

  const agent = useResultAgent(addChange);

  // ── Pulse animation ────────────────────────────────────────────────────────
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

  // ── Spin animation ─────────────────────────────────────────────────────────
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

  // ── Agent overlay ──────────────────────────────────────────────────────────
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [overlayPhase, setOverlayPhase] = useState<'processing' | 'revealing'>('processing');
  const [revealItems, setRevealItems] = useState<{ summary: ActionSummary; opacity: Animated.Value; translateY: Animated.Value }[]>([]);
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const overlayActiveRef = useRef(false);

  useEffect(() => {
    const processing = agent.loading || agent.isTranscribing;
    if (processing) {
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
    } else {
      Animated.timing(overlayOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
        setOverlayVisible(false);
      });
    }
  }, [agent.loading, agent.isTranscribing, agent.lastActionSummary]);

  // Auto-navigate to assign after agent acts in fork mode
  useEffect(() => {
    if (agentDidAct && mode === 'fork') {
      router.push('/assign');
    }
  }, [agentDidAct, mode]);

  // ── Items data ─────────────────────────────────────────────────────────────
  const items = 'items' in receiptData ? receiptData.items : [];
  const displayItems = items.filter(item => item.name.trim().toLowerCase() !== 'tax');

  const calculatedTotal = displayItems.reduce((sum, item) => sum + item.price, 0)
    + (receiptData.tax ?? 0)
    + (receiptData.tip ?? 0);

  const CATEGORY_ORDER: ItemCategory[] = ['entree', 'appetizer', 'side', 'drink', 'dessert', 'other'];
  const CATEGORY_LABELS: Record<ItemCategory, string> = {
    entree: 'Entrees', appetizer: 'Appetizers', side: 'Sides',
    drink: 'Drinks', dessert: 'Desserts', other: 'Other',
  };
  const groupedItems = CATEGORY_ORDER
    .map(cat => ({ cat, items: displayItems.filter(it => (it.category ?? 'other') === cat) }))
    .filter(g => g.items.length > 0);
  const hasCategoryData = displayItems.some(it => it.category != null);

  // ── Manual mode state ──────────────────────────────────────────────────────
  const [changing, changeItem] = useState<string>('');
  const [newName, setNewName] = useState<string>('');
  const [newPrice, setNewPrice] = useState<string>('');
  const [adding, isAdding] = useState<boolean>(false);
  const [taxInput, setTaxInput] = useState<string>('');
  const [editingTax, setEditingTax] = useState<boolean>(false);
  const [tipInput, setTipInput] = useState<string>('');
  const [editingTip, setEditingTip] = useState<boolean>(false);
  const [splitTarget, setSplitTarget] = useState<string | null>(null);
  const splitProgress = useRef(new Animated.Value(0)).current;
  const splitTimeoutRef = useRef<any>(null);

  useEffect(() => {
    return () => { clearChanges(); };
  }, []);

  // ── Paywall / mic press ────────────────────────────────────────────────────
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

  const handleBack = () => {
    if (mode === 'manual') {
      setMode('fork');
    } else {
      router.back();
    }
  };

  // ── Manual edit helpers ────────────────────────────────────────────────────
  function saveCurrentEdit(targetId: string, finalName: string, finalPrice: string) {
    if (!targetId) return;
    const previousItem = items.find(item => item.id === targetId);
    if (!previousItem) return;
    let updatedItem = { ...previousItem };
    let changed = false;
    let parsedPrice = parseFloat(finalPrice);
    if (isNaN(parsedPrice)) parsedPrice = 0;
    if (previousItem.name !== finalName) {
      updatedItem.name = finalName;
      addChange({ type: 'EDIT_NAME', id: targetId, previous: previousItem });
      changed = true;
    }
    if (previousItem.price !== parsedPrice) {
      updatedItem.price = parsedPrice;
      addChange({ type: 'EDIT_PRICE', id: targetId, previous: previousItem });
      changed = true;
    }
    if (changed) updateItem(targetId, updatedItem);
  }

  function finishChange() {
    if (changing) {
      saveCurrentEdit(changing, newName, newPrice);
      changeItem('');
      setNewName('');
      setNewPrice('');
    }
  }

  function startChange(id: string) {
    if (changing && changing !== id) saveCurrentEdit(changing, newName, newPrice);
    changeItem(id);
    const item = items.find(it => it.id === id);
    setNewName(item ? item.name : '');
    setNewPrice(item ? item.price.toString() : '');
  }

  function deleteItem(id: string, item: ReceiptItem) {
    const index = items.findIndex(it => it.id === id);
    addChange({ type: 'DELETE', id, previous: item, index });
    removeItem(id);
  }

  function handleLongPress(item: ReceiptItem) {
    if (item.price <= 0.01) return;
    setSplitTarget(item.id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.timing(splitProgress, { toValue: 1, duration: 2500, useNativeDriver: false }).start();
    splitTimeoutRef.current = setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      const currentItems = useSplitStore.getState().receiptData.items;
      const originalItem = currentItems.find(it => it.id === item.id);
      const originalIndex = currentItems.findIndex(it => it.id === item.id);
      const childIds = splitItemStore(item.id);
      if (originalItem && childIds.length === 2) {
        addChange({ type: 'SPLIT', id: item.id, previous: originalItem, splitChildIds: childIds, index: originalIndex });
      }
      clearSplitState();
    }, 2500);
  }

  function clearSplitState() {
    if (splitTimeoutRef.current) { clearTimeout(splitTimeoutRef.current); splitTimeoutRef.current = null; }
    setSplitTarget(null);
    splitProgress.setValue(0);
  }

  function addNewItem() {
    const newID = uuid.v4();
    const price = parseFloat(newPrice) || 0;
    const newItem: ReceiptItem = { id: newID, name: newName, price };
    addItem(newItem);
    addChange({ type: 'ADD', id: newID, previous: newItem });
    isAdding(false);
    setNewName('');
    setNewPrice('');
  }

  function startTaxEdit() {
    if (changing) finishChange();
    setTaxInput(receiptData.tax != null ? receiptData.tax.toString() : '');
    setEditingTax(true);
  }

  function finishTaxEdit() {
    setEditingTax(false);
    const taxValue = parseFloat(taxInput) || 0;
    if ('items' in receiptData) updateReceiptData({ ...receiptData, tax: taxValue });
  }

  function startTipEdit() {
    if (changing) finishChange();
    setTipInput(receiptData.tip != null ? receiptData.tip.toString() : '');
    setEditingTip(true);
  }

  function finishTipEdit() {
    setEditingTip(false);
    const tipValue = parseFloat(tipInput) || 0;
    if ('items' in receiptData) updateReceiptData({ ...receiptData, tip: tipValue });
  }

  const renderRightActions = (id: string, item: ReceiptItem) => (
    <TouchableOpacity style={styles.deleteAction} onPress={() => deleteItem(item.id, item)}>
      <MaterialIcons name="delete" size={24} color="white" />
    </TouchableOpacity>
  );

  // ── Overlay (shared between modes) ────────────────────────────────────────
  const overlay = overlayVisible && (
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
        {overlayPhase === 'revealing' && (
          <View style={styles.actionList}>
            {revealItems.map((item, i) => {
              const verbColor =
                item.summary.verb === 'Added' ? colors.green :
                item.summary.verb === 'Removed' ? colors.error :
                colors.black;
              const iconName =
                item.summary.verb === 'Added' ? 'add-circle-outline' :
                item.summary.verb === 'Removed' ? 'remove-circle-outline' :
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
            {agent.lastDurationMs != null && (
              <Text style={styles.timingLabel}>{(agent.lastDurationMs / 1000).toFixed(1)}s</Text>
            )}
          </View>
        )}
      </View>
    </Animated.View>
  );

  // ── Fork mode ──────────────────────────────────────────────────────────────
  if (mode === 'fork') {
    return (
      <SafeAreaView style={styles.forkContainer} edges={['top']}>
        <View style={styles.forkHeader}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={26} color={colors.black} />
          </TouchableOpacity>
          <Text style={styles.forkHeaderTitle}>Edit Items</Text>
          <TouchableOpacity onPress={() => router.replace('/(tabs)')} style={styles.homeButton}>
            <MaterialIcons name="home" size={20} color={colors.gray400} />
          </TouchableOpacity>
        </View>

        <View style={styles.voiceZone}>
          <MaterialIcons name="auto-awesome" size={22} color={colors.green} style={{ marginBottom: spacing.md }} />
          <Text style={styles.voiceTitle}>
            {agent.isRecording ? 'Listening...' : agent.isTranscribing ? 'Transcribing...' : agent.loading ? 'Working...' : 'Say what to change.'}
          </Text>
          <Text style={styles.voiceSubtitle}>
            {agent.isRecording
              ? 'Speak clearly, then tap mic to send'
              : 'Tap mic, speak your changes.'}
          </Text>

          {agent.lastDurationMs != null && !agent.loading && !agent.isTranscribing && (
            <Text style={styles.timingBadge}>{(agent.lastDurationMs / 1000).toFixed(1)}s</Text>
          )}

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
        </View>

        <ScrollView
          style={styles.itemRefList}
          contentContainerStyle={styles.itemRefContent}
          showsVerticalScrollIndicator={false}
        >
          {displayItems.map((item, i) => (
            <View key={item.id} style={[styles.itemRefRow, i < displayItems.length - 1 && styles.itemRefRowBorder]}>
              <Text style={styles.itemRefName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.itemRefPrice}>${item.price.toFixed(2)}</Text>
            </View>
          ))}
          {((receiptData.tax ?? 0) > 0 || (receiptData.tip ?? 0) > 0) && (
            <View style={styles.itemRefDivider} />
          )}
          {(receiptData.tax ?? 0) > 0 && (
            <View style={styles.itemRefRow}>
              <Text style={styles.itemRefName}>Tax</Text>
              <Text style={styles.itemRefPrice}>${(receiptData.tax ?? 0).toFixed(2)}</Text>
            </View>
          )}
          {(receiptData.tip ?? 0) > 0 && (
            <View style={styles.itemRefRow}>
              <Text style={styles.itemRefName}>Tip</Text>
              <Text style={styles.itemRefPrice}>${(receiptData.tip ?? 0).toFixed(2)}</Text>
            </View>
          )}
          <View style={styles.itemRefDivider} />
          <View style={styles.itemRefRow}>
            <Text style={styles.itemRefTotal}>Total</Text>
            <Text style={styles.itemRefTotalAmount}>${calculatedTotal.toFixed(2)}</Text>
          </View>
        </ScrollView>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerLabel}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.manualZone}>
          <TouchableOpacity style={styles.continueAssignButton} onPress={() => router.push('/assign')}>
            <MaterialIcons name="check" size={18} color={colors.white} />
            <Text style={styles.continueAssignText}>Looks good</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.manualButton}
            onPress={() => setMode('manual')}
            activeOpacity={0.8}
          >
            <Text style={styles.manualButtonText}>Edit manually</Text>
          </TouchableOpacity>
          <Text style={styles.manualHint}>Tap, swipe, and hold to edit</Text>
        </View>

        <PaywallModal
          visible={paywall.paywallVisible}
          onClose={paywall.hidePaywall}
          onSubscribe={paywall.purchaseSubscription}
          onRestore={paywall.restorePurchases}
          currentPackage={paywall.currentPackage}
          purchaseError={paywall.purchaseError}
          scanCount={paywall.scanCount}
        />

        {overlay}
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
            <Text style={styles.headerTitle}>
              <Text style={{ color: colors.black }}>Edit </Text>
              <Text style={{ color: colors.green }}>Items</Text>
            </Text>
            <Text style={styles.headerSubtitle}>Tap to edit, swipe to delete, hold to split</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={() => router.replace('/(tabs)')} style={styles.homeButton}>
              <MaterialIcons name="home" size={20} color={colors.gray400} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.agentButton, agent.isRecording && styles.agentButtonRecording]}
              onPress={() => setMode('fork')}
              activeOpacity={0.8}
            >
              <MaterialIcons name="auto-awesome" size={18} color={agent.isRecording ? colors.white : colors.green} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Tax & Tip */}
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
              <Text style={[styles.compactValue, !receiptData.tax && styles.placeholderText]}>
                {receiptData.tax ? `$${receiptData.tax.toFixed(2)}` : '$0.00'}
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
              <Text style={[styles.compactValue, !receiptData.tip && styles.placeholderText]}>
                {receiptData.tip ? `$${receiptData.tip.toFixed(2)}` : '$0.00'}
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.itemsScroll}
        contentContainerStyle={styles.itemsContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <Pressable
          style={{ flexGrow: 1, minHeight: 200 }}
          onPress={() => { Keyboard.dismiss(); if (changing) finishChange(); }}
        >
          <View style={styles.itemsContainer}>
            {hasCategoryData ? (
              groupedItems.map(({ cat, items: groupItems }) => (
                <View key={cat}>
                  <Text style={styles.categoryHeader}>{CATEGORY_LABELS[cat]}</Text>
                  <View style={styles.categoryGroup}>
                    {groupItems.map(item => (
                      changing === item.id ? (
                        <View key={item.id} style={styles.changeRow}>
                          <View style={[styles.changeInputContainer, { flex: 2 }]}>
                            <TextInput
                              style={styles.changeInput}
                              value={newName}
                              onChangeText={(text) => setNewName(text)}
                              onSubmitEditing={() => { Keyboard.dismiss(); finishChange(); }}
                              autoFocus
                            />
                          </View>
                          <View style={[styles.changeInputContainer, { flex: 1 }]}>
                            <TextInput
                              style={styles.changeInput}
                              value={newPrice}
                              onChangeText={(text) => setNewPrice(text)}
                              keyboardType="decimal-pad"
                              onSubmitEditing={() => { Keyboard.dismiss(); finishChange(); }}
                            />
                          </View>
                        </View>
                      ) : (
                        <Swipeable
                          key={item.id}
                          renderRightActions={() => renderRightActions(item.id, item)}
                          rightThreshold={40}
                        >
                          <Pressable
                            onPress={() => startChange(item.id)}
                            onLongPress={() => handleLongPress(item)}
                            onPressOut={() => { if (splitTarget) clearSplitState(); }}
                            delayLongPress={500}
                            style={({ pressed }) => [
                              styles.itemRow,
                              splitTarget === item.id && { backgroundColor: `${colors.green}10`, borderColor: colors.green },
                              (pressed && !splitTarget) && { backgroundColor: `${colors.green}18`, borderColor: colors.green },
                            ]}
                          >
                            <Text style={styles.itemName}>{item.name}</Text>
                            <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
                          </Pressable>
                        </Swipeable>
                      )
                    ))}
                  </View>
                </View>
              ))
            ) : (
              displayItems.map(item => (
                changing === item.id ? (
                  <View key={item.id} style={styles.changeRow}>
                    <View style={[styles.changeInputContainer, { flex: 2 }]}>
                      <TextInput
                        style={styles.changeInput}
                        value={newName}
                        onChangeText={(text) => setNewName(text)}
                        onSubmitEditing={() => { Keyboard.dismiss(); finishChange(); }}
                        autoFocus
                      />
                    </View>
                    <View style={[styles.changeInputContainer, { flex: 1 }]}>
                      <TextInput
                        style={styles.changeInput}
                        value={newPrice}
                        onChangeText={(text) => setNewPrice(text)}
                        keyboardType="decimal-pad"
                        onSubmitEditing={() => { Keyboard.dismiss(); finishChange(); }}
                      />
                    </View>
                  </View>
                ) : (
                  <Swipeable
                    key={item.id}
                    renderRightActions={() => renderRightActions(item.id, item)}
                    rightThreshold={40}
                  >
                    <Pressable
                      onPress={() => startChange(item.id)}
                      onLongPress={() => handleLongPress(item)}
                      onPressOut={() => { if (splitTarget) clearSplitState(); }}
                      delayLongPress={500}
                      style={({ pressed }) => [
                        styles.itemRow,
                        splitTarget === item.id && { backgroundColor: `${colors.green}10`, borderColor: colors.green },
                        (pressed && !splitTarget) && { backgroundColor: `${colors.green}18`, borderColor: colors.green },
                      ]}
                    >
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
                    </Pressable>
                  </Swipeable>
                )
              ))
            )}
          </View>
        </Pressable>
      </ScrollView>

      <View style={styles.fixedFooter}>
        {splitTarget ? (
          <View style={styles.splitProgressContainer}>
            <Text style={styles.totalLabel}>Splitting Item...</Text>
            <View style={styles.progressBarBackground}>
              <Animated.View style={[styles.progressBarFill, {
                width: splitProgress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] })
              }]} />
            </View>
          </View>
        ) : (
          <>
            {items.length > 0 && (
              <View style={styles.totalContainer}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalAmount}>${calculatedTotal.toFixed(2)}</Text>
              </View>
            )}
            <View style={styles.footerButtons}>
              <TouchableOpacity
                style={styles.footerButton}
                onPress={undoChange}
                disabled={changes.length === 0}
              >
                <MaterialIcons name="undo" size={24} color={changes.length === 0 ? colors.gray300 : colors.black} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.continueButton, displayItems.length === 0 && { backgroundColor: colors.gray300, shadowOpacity: 0 }]}
                onPress={() => {
                  Keyboard.dismiss();
                  if (changing) finishChange();
                  if (displayItems.length === 0) {
                    Alert.alert('No Items', 'Add at least one item before continuing.');
                    return;
                  }
                  router.push('/assign');
                }}
                activeOpacity={0.8}
              >
                <MaterialIcons name="check" size={28} color={colors.white} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.footerButton}
                onPress={() => { Keyboard.dismiss(); if (changing) finishChange(); isAdding(true); }}
              >
                <MaterialIcons name="add" size={28} color={colors.black} />
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {overlay}

      <Modal animationType="fade" transparent visible={adding} onRequestClose={() => isAdding(false)}>
        <BlurView intensity={20} style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => isAdding(false)}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add New Item</Text>
              <TextInput
                style={styles.modalInput}
                value={newName}
                onChangeText={setNewName}
                placeholder="Item name"
                placeholderTextColor={colors.gray400}
              />
              <TextInput
                style={styles.modalInput}
                value={newPrice}
                onChangeText={setNewPrice}
                keyboardType="decimal-pad"
                placeholder="Price (0.00)"
                placeholderTextColor={colors.gray400}
              />
              <TouchableOpacity style={styles.modalAddButton} onPress={addNewItem}>
                <Text style={styles.modalAddButtonText}>Add Item</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </BlurView>
      </Modal>

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

const styles = StyleSheet.create({
  // ── Fork mode ──────────────────────────────────────────────────────────────
  forkContainer: { flex: 1, backgroundColor: colors.white },
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
  timingBadge: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.gray400,
    marginBottom: spacing.md,
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
  spinRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2.5,
    borderColor: 'transparent',
    borderTopColor: colors.green,
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
  bigMicButtonProcessing: { opacity: 0.6 },
  itemRefList: {
    flex: 1,
    marginHorizontal: spacing.lg,
  },
  itemRefContent: { paddingVertical: spacing.xs },
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
  itemRefPrice: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.sm,
    color: colors.gray400,
  },
  itemRefDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.gray200,
    marginVertical: spacing.xs,
  },
  itemRefTotal: {
    flex: 1,
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
    color: colors.black,
  },
  itemRefTotalAmount: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
    color: colors.green,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.xl + spacing.md,
    marginVertical: spacing.sm,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.gray200 },
  dividerLabel: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.gray400,
    marginHorizontal: spacing.md,
  },
  manualZone: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  continueAssignButton: {
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
  continueAssignText: {
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

  // ── Manual mode ────────────────────────────────────────────────────────────
  container: { flex: 1, backgroundColor: colors.gray100 },
  backButton: {
    width: 36, height: 36, borderRadius: radii.full,
    justifyContent: 'center', alignItems: 'center',
  },
  homeButton: {
    width: 32, height: 32, borderRadius: radii.full,
    backgroundColor: colors.gray100,
    justifyContent: 'center', alignItems: 'center',
  },
  headerContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.gray100,
  },
  headerTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 28,
  },
  headerSubtitle: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.gray500,
    marginTop: 3,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  agentButton: {
    width: 36, height: 36, borderRadius: radii.full,
    backgroundColor: `${colors.green}15`,
    justifyContent: 'center', alignItems: 'center',
  },
  agentButtonRecording: { backgroundColor: colors.error },
  taxTipContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
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
  compactPressable: { flex: 1, alignItems: 'flex-end' },
  compactValue: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.md,
    color: colors.green,
  },
  placeholderText: { color: colors.gray400 },
  itemsScroll: { flex: 1 },
  itemsContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  itemsContainer: { gap: spacing.sm },
  categoryHeader: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.xs,
    color: colors.gray500,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  categoryGroup: { gap: spacing.sm },
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
  changeRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xs },
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
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    paddingBottom: 40,
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
    width: 50, height: 50,
    justifyContent: 'center', alignItems: 'center',
    borderRadius: radii.full,
    backgroundColor: colors.gray100,
  },
  continueButton: {
    width: 64, height: 64,
    justifyContent: 'center', alignItems: 'center',
    borderRadius: radii.full,
    backgroundColor: colors.black,
    shadowColor: colors.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  splitProgressContainer: { justifyContent: 'center', paddingVertical: spacing.sm },
  progressBarBackground: {
    height: 12,
    backgroundColor: colors.gray200,
    borderRadius: radii.full,
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.green,
    borderRadius: radii.full,
  },

  // ── Add item modal ─────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modalBackdrop: {
    flex: 1, width: '100%',
    justifyContent: 'center', alignItems: 'center',
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

  // ── Overlay ────────────────────────────────────────────────────────────────
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
  actionList: { gap: spacing.xl, width: '100%' },
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
  timingLabel: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.gray400,
    marginTop: spacing.sm,
    alignSelf: 'flex-end',
  },
});
