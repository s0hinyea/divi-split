import React, { createContext, useContext, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors, fonts, fontSizes, spacing, radii } from '@/styles/theme';

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface ShowAlertOptions {
  title: string;
  message?: string;
  buttons?: AlertButton[];
}

interface CustomAlertContextValue {
  showAlert: (options: ShowAlertOptions) => void;
}

const CustomAlertContext = createContext<CustomAlertContextValue>({ showAlert: () => {} });

export function useCustomAlert() {
  return useContext(CustomAlertContext);
}

export function CustomAlertProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<ShowAlertOptions>({ title: '' });

  const showAlert = useCallback((options: ShowAlertOptions) => {
    setConfig(options);
    setVisible(true);
  }, []);

  const dismiss = useCallback(() => setVisible(false), []);

  const buttons = config.buttons ?? [{ text: 'OK' }];

  return (
    <CustomAlertContext.Provider value={{ showAlert }}>
      {children}
      <Modal visible={visible} transparent animationType="fade" onRequestClose={dismiss}>
        <BlurView intensity={20} style={styles.backdrop}>
          <View style={styles.card}>
            <Text style={styles.title}>{config.title}</Text>
            {config.message ? (
              <Text style={styles.message}>{config.message}</Text>
            ) : null}
            <View style={[styles.buttons, buttons.length === 1 && styles.singleButton]}>
              {buttons.map((btn, i) => (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.button,
                    btn.style === 'cancel' && styles.cancelButton,
                    btn.style === 'destructive' && styles.destructiveButton,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => {
                    dismiss();
                    btn.onPress?.();
                  }}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      btn.style === 'cancel' && styles.cancelText,
                      btn.style === 'destructive' && styles.destructiveText,
                    ]}
                  >
                    {btn.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </BlurView>
      </Modal>
    </CustomAlertContext.Provider>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  card: {
    width: '82%',
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: spacing.xl,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  title: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.lg,
    color: colors.black,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  message: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.gray600,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  buttons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  singleButton: {
    justifyContent: 'center',
  },
  button: {
    flex: 1,
    backgroundColor: colors.black,
    borderRadius: radii.full,
    paddingVertical: spacing.sm + 4,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.gray100,
  },
  destructiveButton: {
    backgroundColor: colors.error,
  },
  buttonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.sm,
    color: colors.white,
  },
  cancelText: {
    color: colors.black,
  },
  destructiveText: {
    color: colors.white,
  },
});
