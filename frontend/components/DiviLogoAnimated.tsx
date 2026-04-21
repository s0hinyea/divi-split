import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors } from '@/styles/theme';

const BASE = 120; // viewBox width
const ORBIT_DURATION_MS = 1800;

interface Props {
  size?: number; // scales the whole logo, default 160 (full size)
}

export default function DiviLogoAnimated({ size = 160 }: Props) {
  const scale = size / 160;

  const LINE_W   = 10 * scale;
  const LINE_H   = 100 * scale;
  const LINE_R   = 5 * scale;
  const DOT_R    = 8 * scale;

  const GREEN_LINE_X = 40 * scale;
  const BLACK_LINE_X = 70 * scale;
  const LINE_Y       = 30 * scale;

  const ORBIT_CX = 60 * scale;
  const ORBIT_CY = 80 * scale;
  const ORBIT_RX = 40 * scale;
  const ORBIT_RY = 10 * scale;

  const angle = useSharedValue(0);

  useEffect(() => {
    angle.value = withRepeat(
      withTiming(2 * Math.PI, {
        duration: ORBIT_DURATION_MS,
        easing: Easing.inOut(Easing.cubic),
      }),
      -1,
      false,
    );
  }, []);

  const greenDotStyle = useAnimatedStyle(() => {
    'worklet';
    const x = ORBIT_CX + ORBIT_RX * Math.cos(Math.PI + angle.value);
    const y = ORBIT_CY + ORBIT_RY * Math.sin(Math.PI + angle.value);
    return {
      position: 'absolute',
      left: x - DOT_R,
      top: y - DOT_R,
      width: DOT_R * 2,
      height: DOT_R * 2,
      borderRadius: DOT_R,
      backgroundColor: colors.green,
    };
  });

  const blackDotStyle = useAnimatedStyle(() => {
    'worklet';
    const x = ORBIT_CX + ORBIT_RX * Math.cos(angle.value);
    const y = ORBIT_CY + ORBIT_RY * Math.sin(angle.value);
    return {
      position: 'absolute',
      left: x - DOT_R,
      top: y - DOT_R,
      width: DOT_R * 2,
      height: DOT_R * 2,
      borderRadius: DOT_R,
      backgroundColor: colors.black,
    };
  });

  return (
    <View style={{ width: BASE * scale, height: 160 * scale }}>
      <View style={[styles.line, { left: GREEN_LINE_X, top: LINE_Y, width: LINE_W, height: LINE_H, borderRadius: LINE_R, backgroundColor: colors.green }]} />
      <View style={[styles.line, { left: BLACK_LINE_X, top: LINE_Y, width: LINE_W, height: LINE_H, borderRadius: LINE_R, backgroundColor: colors.black }]} />
      <Animated.View style={greenDotStyle} />
      <Animated.View style={blackDotStyle} />
    </View>
  );
}

const styles = StyleSheet.create({
  line: {
    position: 'absolute',
  },
});
