import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, fontSizes, spacing, radii } from '@/styles/theme';
import { FREE_SCAN_LIMIT } from '@/utils/usePaywall';
import DiviLogo from '@/components/DiviLogo';

type PurchasesPackage = any;

type Props = {
  visible: boolean;
  onClose: () => void;
  onSubscribe: () => Promise<void>;
  onRestore: () => Promise<boolean>;
  monthlyPackage: PurchasesPackage | null;
  yearlyPackage: PurchasesPackage | null;
  selectedPlan: 'monthly' | 'yearly';
  onSelectPlan: (plan: 'monthly' | 'yearly') => void;
  purchaseError: string | null;
  scanCount: number;
};

const { width: SW } = Dimensions.get('window');

const FEATURES = [
  { icon: 'scan-outline' as const, text: 'Unlimited AI receipt scans' },
  { icon: 'people-outline' as const, text: 'Smart item assignment' },
  { icon: 'chatbubble-ellipses-outline' as const, text: 'SMS payment requests' },
  { icon: 'time-outline' as const, text: 'Full receipt history' },
];

const LOGOS = [
  { top: 24, left: 18,      size: 38, rotate: '-14deg', opacity: 0.14 },
  { top: 18, left: SW - 56, size: 32, rotate: '19deg',  opacity: 0.11 },
  { top: 78, left: 66,      size: 28, rotate: '23deg',  opacity: 0.09 },
  { top: 88, left: SW - 96, size: 36, rotate: '-11deg', opacity: 0.10 },
  { top: 148, left: 22,     size: 26, rotate: '10deg',  opacity: 0.07 },
  { top: 144, left: SW / 2, size: 30, rotate: '-21deg', opacity: 0.07 },
];

export default function PaywallModal({
  visible,
  onClose,
  onSubscribe,
  onRestore,
  monthlyPackage,
  yearlyPackage,
  selectedPlan,
  onSelectPlan,
  purchaseError,
  scanCount,
}: Props) {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 60,
        friction: 14,
      }).start();
    } else {
      slideAnim.setValue(0);
    }
  }, [visible]);

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [80, 0],
  });

  const opacity = slideAnim.interpolate({
    inputRange: [0, 0.4],
    outputRange: [0, 1],
  });

  const monthlyPrice = monthlyPackage?.product?.priceString ?? '$4.99';
  const yearlyPrice = yearlyPackage?.product?.priceString ?? '$29.99';
  const yearlyPerMonth = yearlyPackage?.product?.price
    ? `$${(yearlyPackage.product.price / 12).toFixed(2)}/mo`
    : '$2.50/mo';

  const scansUsed = Math.min(scanCount, FREE_SCAN_LIMIT);

  const handleSubscribe = async () => {
    setPurchasing(true);
    try { await onSubscribe(); }
    finally { setPurchasing(false); }
  };

  const handleRestore = async () => {
    setRestoring(true);
    try { await onRestore(); }
    finally { setRestoring(false); }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.root, { opacity, transform: [{ translateY }] }]}>

        {/* ── Hero (black) ── */}
        <View style={styles.hero}>
          {LOGOS.map((l, i) => (
            <View
              key={i}
              style={{
                position: 'absolute',
                top: l.top,
                left: l.left,
                opacity: l.opacity,
                transform: [{ rotate: l.rotate }],
              }}
            >
              <DiviLogo size={l.size} color={colors.white} />
            </View>
          ))}

          <LinearGradient
            colors={['transparent', 'rgba(0,195,127,0.15)', 'transparent']}
            style={styles.heroGlow}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />

          <SafeAreaView edges={['top']} style={styles.heroSafe}>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Ionicons name="close" size={22} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>

            <View style={styles.heroContent}>
              <View style={styles.logoBadgeRow}>
                <DiviLogo size={44} color={colors.white} />
                <View style={styles.proBadge}>
                  <Text style={styles.proBadgeText}>PRO</Text>
                </View>
              </View>
              <Text style={styles.heroTitle}>Divi Pro</Text>
              <Text style={styles.heroSub}>Split smarter. Pay faster.</Text>
            </View>
          </SafeAreaView>
        </View>

        {/* ── Content card (white) ── */}
        <View style={styles.card}>

          {/* Scan usage badge */}
          <View style={styles.usageBadge}>
            <View style={styles.usageDots}>
              {Array.from({ length: FREE_SCAN_LIMIT }).map((_, i) => (
                <View
                  key={i}
                  style={[styles.dot, i < scansUsed && styles.dotUsed]}
                />
              ))}
            </View>
            <Text style={styles.usageText}>
              {scansUsed} of {FREE_SCAN_LIMIT} free scans used
            </Text>
          </View>

          {/* Plan toggle */}
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleOption, selectedPlan === 'monthly' && styles.toggleActive]}
              onPress={() => onSelectPlan('monthly')}
              activeOpacity={0.8}
            >
              <Text style={[styles.toggleLabel, selectedPlan === 'monthly' && styles.toggleLabelActive]}>
                Monthly
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toggleOption, selectedPlan === 'yearly' && styles.toggleActive]}
              onPress={() => onSelectPlan('yearly')}
              activeOpacity={0.8}
            >
              <Text style={[styles.toggleLabel, selectedPlan === 'yearly' && styles.toggleLabelActive]}>
                Yearly
              </Text>
              <View style={styles.saveBadge}>
                <Text style={styles.saveText}>Save 50%</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Price */}
          <View style={styles.priceSection}>
            {selectedPlan === 'monthly' ? (
              <>
                <Text style={styles.priceMain}>{monthlyPrice}</Text>
                <Text style={styles.pricePeriod}>per month</Text>
              </>
            ) : (
              <>
                <Text style={styles.priceMain}>{yearlyPrice}</Text>
                <Text style={styles.pricePeriod}>per year · {yearlyPerMonth}</Text>
              </>
            )}
          </View>

          {/* Features */}
          <View style={styles.features}>
            {FEATURES.map((f) => (
              <View key={f.text} style={styles.featureRow}>
                <View style={styles.featureIcon}>
                  <Ionicons name={f.icon} size={16} color={colors.green} />
                </View>
                <Text style={styles.featureText}>{f.text}</Text>
              </View>
            ))}
          </View>

          {purchaseError && (
            <Text style={styles.errorText}>{purchaseError}</Text>
          )}

          {/* CTA */}
          <TouchableOpacity
            style={[styles.cta, (purchasing || restoring) && styles.ctaDisabled]}
            onPress={handleSubscribe}
            disabled={purchasing || restoring}
            activeOpacity={0.88}
          >
            {purchasing ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.ctaText}>
                {selectedPlan === 'yearly' ? `Get Divi Pro · ${yearlyPrice}/yr` : `Get Divi Pro · ${monthlyPrice}/mo`}
              </Text>
            )}
          </TouchableOpacity>

          <Text style={styles.trustText}>
            {selectedPlan === 'yearly' ? 'Billed annually · Cancel anytime' : 'Billed monthly · Cancel anytime'}
          </Text>

          <TouchableOpacity onPress={handleRestore} disabled={purchasing || restoring} style={styles.restoreBtn}>
            {restoring
              ? <ActivityIndicator color={colors.gray400} size="small" />
              : <Text style={styles.restoreText}>Restore Purchases</Text>
            }
          </TouchableOpacity>

        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.black,
  },

  // Hero
  hero: {
    flex: 1,
    backgroundColor: colors.black,
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
  },
  heroSafe: {
    flex: 1,
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: spacing.md,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: radii.full,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: spacing.xl,
  },
  logoBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  proBadge: {
    backgroundColor: colors.green,
    borderRadius: radii.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  proBadgeText: {
    fontFamily: fonts.display,
    fontSize: 11,
    color: colors.white,
    letterSpacing: 1.2,
  },
  heroTitle: {
    fontFamily: fonts.display,
    fontSize: 40,
    color: colors.white,
    letterSpacing: -1,
    marginBottom: 6,
  },
  heroSub: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: 'rgba(255,255,255,0.5)',
  },

  // Card
  card: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 40 : spacing.xl,
    marginTop: -radii.xl,
  },

  // Usage
  usageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  usageDots: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gray200,
  },
  dotUsed: {
    backgroundColor: colors.green,
  },
  usageText: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.xs,
    color: colors.gray500,
  },

  // Toggle
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: colors.gray100,
    borderRadius: radii.md,
    padding: 3,
    marginBottom: spacing.lg,
  },
  toggleOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radii.sm,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  toggleActive: {
    backgroundColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.gray400,
  },
  toggleLabelActive: {
    color: colors.black,
    fontFamily: fonts.bodySemiBold,
  },
  saveBadge: {
    backgroundColor: colors.greenLight,
    borderRadius: radii.full,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  saveText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 10,
    color: colors.green,
  },

  // Price
  priceSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  priceMain: {
    fontFamily: fonts.display,
    fontSize: 42,
    color: colors.black,
    letterSpacing: -1.5,
  },
  pricePeriod: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.gray500,
    marginTop: 2,
  },

  // Features
  features: {
    gap: 10,
    marginBottom: spacing.lg,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    backgroundColor: colors.greenLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.black,
    flex: 1,
  },

  // Error
  errorText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },

  // CTA
  cta: {
    backgroundColor: colors.black,
    borderRadius: radii.md,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  ctaDisabled: {
    opacity: 0.5,
  },
  ctaText: {
    fontFamily: fonts.display,
    fontSize: fontSizes.md,
    color: colors.white,
    letterSpacing: 0.2,
  },

  // Trust + restore
  trustText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.gray400,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  restoreBtn: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
  },
  restoreText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.gray400,
  },
});
