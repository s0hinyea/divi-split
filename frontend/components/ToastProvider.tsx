import React, { createContext, useContext, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fonts, fontSizes, spacing, radii } from '@/styles/theme';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<ToastType>('info');
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string, toastType: ToastType = 'info') => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setMessage(msg);
    setType(toastType);
    setVisible(true);
    translateY.setValue(-120);
    opacity.setValue(0);

    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 80, friction: 12 }),
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();

    timeoutRef.current = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, { toValue: -120, duration: 300, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => setVisible(false));
    }, 3000);
  }, [translateY, opacity]);

  const iconMap: Record<ToastType, string> = {
    success: 'check-circle',
    error: 'error',
    warning: 'warning',
    info: 'info-outline',
  };

  const accentColor: Record<ToastType, string> = {
    success: colors.success,
    error: colors.error,
    warning: colors.warning,
    info: colors.gray500,
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {visible && (
        <Animated.View
          pointerEvents="none"
          style={[styles.toast, { transform: [{ translateY }], opacity }]}
        >
          <MaterialIcons name={iconMap[type] as any} size={18} color={accentColor[type]} />
          <Text style={styles.toastText} numberOfLines={2}>{message}</Text>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: 56,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: radii.full,
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 12,
    zIndex: 9999,
  },
  toastText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.sm,
    color: colors.black,
    flex: 1,
  },
});
