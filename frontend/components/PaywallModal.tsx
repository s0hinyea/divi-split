import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Pressable,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
type PurchasesPackage = any;
import { colors, fonts, fontSizes, spacing, radii, shadows } from '@/styles/theme';
import { FREE_SCAN_LIMIT } from '@/utils/usePaywall';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSubscribe: () => Promise<void>;
  onRestore: () => Promise<boolean>;
  currentPackage: PurchasesPackage | null;
  purchaseError: string | null;
  scanCount: number;
};

const FEATURES = [
  { icon: 'bolt', text: 'Unlimited AI-powered bill splitting' },
  { icon: 'mic', text: 'Assign items by voice, instantly' },
  { icon: 'group', text: 'Split any receipt with any group' },
];

export default function PaywallModal({
  visible,
  onClose,
  onSubscribe,
  onRestore,
  currentPackage,
  purchaseError,
  scanCount,
}: Props) {
  const slideAnim = useRef(new Animated.Value(500)).current;
  const [purchasing, setPurchasing] = React.useState(false);
  const [restoring, setRestoring] = React.useState(false);

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 60,
        friction: 12,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 500,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const price = currentPackage?.product?.price ?? 4.99;
  const priceString = currentPackage?.product?.priceString ?? '$4.99';
  const perDay = (price / 30).toFixed(2);
  const scansUsed = Math.min(scanCount, FREE_SCAN_LIMIT);

  const handleSubscribe = async () => {
    setPurchasing(true);
    try {
      await onSubscribe();
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      await onRestore();
    } finally {
      setRestoring(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <BlurView intensity={25} style={StyleSheet.absoluteFill} />
      </Pressable>

      <Animated.View
        style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}
      >
        {/* Drag handle */}
        <View style={styles.handle} />

        {/* Close */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <MaterialIcons name="close" size={20} color={colors.gray400} />
        </TouchableOpacity>

        {/* Scan limit context */}
        <View style={styles.limitBadge}>
          <MaterialIcons name="lock-outline" size={13} color={colors.gray500} />
          <Text style={styles.limitBadgeText}>
            You've used {scansUsed} of {FREE_SCAN_LIMIT} free AI scans
          </Text>
        </View>

        {/* Icon */}
        <View style={styles.iconRing}>
          <MaterialIcons name="auto-awesome" size={30} color={colors.green} />
        </View>

        {/* Header */}
        <Text style={styles.title}>Divi Pro</Text>
        <Text style={styles.subtitle}>Stop doing the math.{'\n'}Split any bill in seconds.</Text>

        {/* Feature list */}
        <View style={styles.features}>
          {FEATURES.map((f) => (
            <View key={f.text} style={styles.featureRow}>
              <View style={styles.featureIconBox}>
                <MaterialIcons name={f.icon as any} size={15} color={colors.green} />
              </View>
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          ))}
        </View>

        {/* Price card */}
        <View style={styles.priceCard}>
          <View>
            <Text style={styles.priceMain}>{priceString}</Text>
            <Text style={styles.priceSub}>per month</Text>
          </View>
          <View style={styles.perDayBadge}>
            <Text style={styles.perDayText}>just ${perDay}/day</Text>
          </View>
        </View>

        {/* Error */}
        {purchaseError && (
          <Text style={styles.errorText}>{purchaseError}</Text>
        )}

        {/* CTA */}
        <TouchableOpacity
          style={[styles.subscribeButton, purchasing && styles.subscribeButtonDisabled]}
          onPress={handleSubscribe}
          disabled={purchasing || restoring}
          activeOpacity={0.85}
        >
          {purchasing ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.subscribeText}>Get Divi Pro</Text>
          )}
        </TouchableOpacity>

        {/* Trust line */}
        <Text style={styles.trustText}>Cancel anytime · No commitment</Text>

        {/* Restore */}
        <TouchableOpacity
          style={styles.restoreButton}
          onPress={handleRestore}
          disabled={purchasing || restoring}
        >
          {restoring ? (
            <ActivityIndicator color={colors.gray400} size="small" />
          ) : (
            <Text style={styles.restoreText}>Restore Purchases</Text>
          )}
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,10,10,0.5)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 44 : spacing.xl,
    alignItems: 'center',
    ...shadows.lg,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: radii.full,
    backgroundColor: colors.gray300,
    marginBottom: spacing.md,
  },
  closeButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.lg,
  },
  limitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.gray100,
    borderRadius: radii.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: spacing.md,
  },
  limitBadgeText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.gray500,
  },
  iconRing: {
    width: 68,
    height: 68,
    borderRadius: radii.full,
    backgroundColor: colors.greenLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: fontSizes.xl,
    color: colors.black,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.gray500,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  features: {
    alignSelf: 'stretch',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  featureIconBox: {
    width: 28,
    height: 28,
    borderRadius: radii.sm,
    backgroundColor: colors.greenLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.black,
    flex: 1,
  },
  priceCard: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.gray100,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    marginBottom: spacing.md,
  },
  priceMain: {
    fontFamily: fonts.display,
    fontSize: fontSizes.lg,
    color: colors.black,
  },
  priceSub: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.gray400,
    marginTop: 1,
  },
  perDayBadge: {
    backgroundColor: colors.greenLight,
    borderRadius: radii.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  perDayText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.green,
  },
  errorText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.error,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subscribeButton: {
    alignSelf: 'stretch',
    backgroundColor: colors.black,
    borderRadius: radii.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  subscribeButtonDisabled: {
    opacity: 0.6,
  },
  subscribeText: {
    fontFamily: fonts.display,
    fontSize: fontSizes.md,
    color: colors.white,
    letterSpacing: 0.2,
  },
  trustText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.gray400,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  restoreButton: {
    paddingVertical: spacing.sm,
  },
  restoreText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.gray400,
  },
});
