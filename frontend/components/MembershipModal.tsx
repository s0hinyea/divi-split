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
  Linking,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, fontSizes, spacing, radii } from '@/styles/theme';
import DiviLogo from '@/components/DiviLogo';
import Constants from 'expo-constants';

const isExpoGo = Constants.appOwnership === 'expo';
const { width: SW } = Dimensions.get('window');

const LOGOS = [
  { top: 24, left: 18,      size: 38, rotate: '-14deg', opacity: 0.14 },
  { top: 18, left: SW - 56, size: 32, rotate: '19deg',  opacity: 0.11 },
  { top: 78, left: 66,      size: 28, rotate: '23deg',  opacity: 0.09 },
  { top: 88, left: SW - 96, size: 36, rotate: '-11deg', opacity: 0.10 },
  { top: 148, left: 22,     size: 26, rotate: '10deg',  opacity: 0.07 },
  { top: 144, left: SW / 2, size: 30, rotate: '-21deg', opacity: 0.07 },
];

type Props = {
  visible: boolean;
  onClose: () => void;
};

type SubscriptionInfo = {
  planLabel: string;
  renewalDate: string | null;
  willRenew: boolean;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });
}

function parseSubscriptionInfo(customerInfo: any): SubscriptionInfo {
  const entitlement = customerInfo?.entitlements?.active?.['Divi Pro'];
  if (!entitlement) return { planLabel: 'Pro', renewalDate: null, willRenew: false };

  const productId: string = entitlement.productIdentifier ?? '';
  const isYearly = /annual|year/i.test(productId);
  const planLabel = isYearly ? 'Yearly' : 'Monthly';
  const renewalDate = entitlement.expirationDate ? formatDate(entitlement.expirationDate) : null;
  const willRenew: boolean = entitlement.willRenew ?? false;

  return { planLabel, renewalDate, willRenew };
}

export default function MembershipModal({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<SubscriptionInfo | null>(null);

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 60,
        friction: 14,
      }).start();

      if (isExpoGo) {
        setInfo({ planLabel: 'Yearly (Mock)', renewalDate: 'Dec 31, 2026', willRenew: true });
        return;
      }

      setLoading(true);
      import('react-native-purchases').then(({ default: Purchases }) =>
        Purchases.getCustomerInfo()
          .then((ci) => setInfo(parseSubscriptionInfo(ci)))
          .catch(() => setInfo(null))
          .finally(() => setLoading(false))
      );
    } else {
      slideAnim.setValue(0);
      setInfo(null);
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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.root, { opacity, transform: [{ translateY }] }]}>

        {/* Hero */}
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
            <TouchableOpacity
              style={[styles.closeBtn, { top: insets.top + 12 }]}
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
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
              <View style={styles.activePill}>
                <View style={styles.activeDot} />
                <Text style={styles.activePillText}>Active</Text>
              </View>
            </View>
          </SafeAreaView>
        </View>

        {/* Card */}
        <View style={styles.card}>
          {loading ? (
            <ActivityIndicator color={colors.green} style={{ marginVertical: spacing.xl }} />
          ) : (
            <>
              <View style={styles.infoRows}>
                <InfoRow label="Plan" value={info?.planLabel ?? 'Pro'} />
                <View style={styles.divider} />
                <InfoRow
                  label={info?.willRenew ? 'Renews' : 'Expires'}
                  value={info?.renewalDate ?? 'Active'}
                />
                <View style={styles.divider} />
                <InfoRow label="Scans" value="Unlimited" valueColor={colors.green} />
              </View>

              <TouchableOpacity
                style={styles.manageBtn}
                onPress={() => Linking.openURL('https://apps.apple.com/account/subscriptions')}
                activeOpacity={0.8}
              >
                <Ionicons name="settings-outline" size={16} color={colors.black} style={{ marginRight: 6 }} />
                <Text style={styles.manageBtnText}>Manage Subscription</Text>
              </TouchableOpacity>

              <Text style={styles.hint}>
                To cancel or change your plan, visit your Apple ID subscription settings.
              </Text>
            </>
          )}
        </View>

      </Animated.View>
    </Modal>
  );
}

function InfoRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, valueColor ? { color: valueColor } : undefined]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.black,
  },

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
    marginBottom: 12,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,195,127,0.15)',
    borderRadius: radii.full,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,195,127,0.3)',
  },
  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.green,
  },
  activePillText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.sm,
    color: colors.green,
  },

  card: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 40 : spacing.xl,
    marginTop: -radii.xl,
  },

  infoRows: {
    backgroundColor: colors.gray100,
    borderRadius: radii.md,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray200,
    marginHorizontal: spacing.md,
  },
  infoLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.gray500,
  },
  infoValue: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.sm,
    color: colors.black,
  },

  manageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.gray200,
    borderRadius: radii.md,
    paddingVertical: 14,
    marginBottom: spacing.md,
  },
  manageBtnText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.sm,
    color: colors.black,
  },

  hint: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.gray400,
    textAlign: 'center',
    lineHeight: 17,
  },
});
