import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, radii } from '@/styles/theme';

type Props = {
  isRecording: boolean;
  isDisabled: boolean;
  onPress: () => void;
};

export default function AgentButton({ isRecording, isDisabled, onPress }: Props) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isRecording) {
      // Start pulsing glow
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(pulseAnim, { toValue: 1.6, duration: 800, useNativeDriver: true }),
            Animated.timing(glowOpacity, { toValue: 0.5, duration: 200, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
            Animated.timing(glowOpacity, { toValue: 0, duration: 600, useNativeDriver: true }),
          ]),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      // Reset
      pulseAnim.setValue(1);
      glowOpacity.setValue(0);
    }
  }, [isRecording]);

  return (
    <View style={styles.wrapper}>
      {/* Pulsing glow ring — behind the button */}
      <Animated.View
        style={[
          styles.glowRing,
          {
            transform: [{ scale: pulseAnim }],
            opacity: glowOpacity,
          },
        ]}
      />
      {/* Actual button */}
      <TouchableOpacity
        style={[styles.button, isRecording && styles.buttonRecording]}
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.8}
      >
        <MaterialIcons
          name={isRecording ? 'stop' : 'auto-awesome'}
          size={18}
          color={isRecording ? colors.white : colors.green}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowRing: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: radii.full,
    backgroundColor: colors.error,
  },
  button: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    backgroundColor: `${colors.green}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonRecording: {
    backgroundColor: colors.error,
  },
});
