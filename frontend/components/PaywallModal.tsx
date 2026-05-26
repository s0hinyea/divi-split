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

type Props = {
  visible: boolean;
  onClose: () => void;
  onSubscribe: () => Promise<void>;
  onRestore: () => Promise<boolean>;
  currentPackage: PurchasesPackage | null;
  purchaseError: string | null;
};

const FEATURES = [
  'Unlimited AI-powered bill splitting',
  'Assign items by voice, instantly',
  'Smart split & assign logic',
];

export default function PaywallModal({
  visible,
  onClose,
  onSubscribe,
  onRestore,
  currentPackage,
  purchaseError,
}: Props) {
  const slideAnim = useRef(new Animated.Value(400)).current;
  const [purchasing, setPurchasing] = React.useState(false);
  const [restoring, setRestoring] = React.useState(false);

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 400,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const priceLabel = currentPackage
    ? `${currentPackage.product.priceString} / ${currentPackage.packageType.toLowerCase()}`
    : null;

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
        <BlurView intensity={20} style={StyleSheet.absoluteFill} />
      </Pressable>

      <Animated.View
        style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}
      >
        {/* Drag handle */}
        <View style={styles.handle} />

        {/* Close */}
        <TouchableOpacity style={styles.closeButton} onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <MaterialIcons name="close" size={20} color={colors.gray400} />
        </TouchableOpacity>

        {/* Icon */}
        <View style={styles.iconRing}>
          <MaterialIcons name="auto-awesome" size={28} color={colors.green} />
        </View>

        {/* Header */}
        <Text style={styles.title}>Divi Pro</Text>
        <Text style={styles.subtitle}>Unlock unlimited AI scans</Text>

        {/* Feature list */}
        <View style={styles.features}>
          {FEATURES.map((f) => (
            <View key={f} style={styles.featureRow}>
              <MaterialIcons name="check-circle-outline" size={16} color={colors.green} />
              <Text style={styles.featureText}>{f}</Text>
            </View>
          ))}
        </View>

        {/* Price */}
        {priceLabel && (
          <Text style={styles.price}>{priceLabel}</Text>
        )}

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
            <Text style={styles.subscribeText}>
              {currentPackage ? `Subscribe: ${currentPackage.product.priceString}` : 'Subscribe'}
            </Text>
          )}
        </TouchableOpacity>

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
    backgroundColor: 'rgba(10,10,10,0.45)',
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
    paddingBottom: Platform.OS === 'ios' ? 40 : spacing.xl,
    alignItems: 'center',
    ...shadows.lg,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: radii.full,
    backgroundColor: colors.gray300,
    marginBottom: spacing.lg,
  },
  closeButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.lg,
  },
  iconRing: {
    width: 64,
    height: 64,
    borderRadius: radii.full,
    backgroundColor: colors.greenLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.xl,
    color: colors.black,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.gray500,
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
  featureText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.black,
  },
  price: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.sm,
    color: colors.gray500,
    marginBottom: spacing.md,
    textTransform: 'capitalize',
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
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  subscribeButtonDisabled: {
    opacity: 0.6,
  },
  subscribeText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.md,
    color: colors.white,
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
