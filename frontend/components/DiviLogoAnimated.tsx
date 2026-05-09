import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '@/styles/theme';

const BASE = 120;
const ORBIT_DURATION_MS = 1800;

interface Props {
  size?: number;
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

  const [dots, setDots] = useState({
    greenX: ORBIT_CX + ORBIT_RX * Math.cos(Math.PI),
    greenY: ORBIT_CY + ORBIT_RY * Math.sin(Math.PI),
    blackX: ORBIT_CX + ORBIT_RX,
    blackY: ORBIT_CY,
  });

  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    const animate = (timestamp: number) => {
      if (startRef.current === null) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const angle = ((elapsed % ORBIT_DURATION_MS) / ORBIT_DURATION_MS) * 2 * Math.PI;

      setDots({
        greenX: ORBIT_CX + ORBIT_RX * Math.cos(Math.PI + angle),
        greenY: ORBIT_CY + ORBIT_RY * Math.sin(Math.PI + angle),
        blackX: ORBIT_CX + ORBIT_RX * Math.cos(angle),
        blackY: ORBIT_CY + ORBIT_RY * Math.sin(angle),
      });

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [ORBIT_CX, ORBIT_CY, ORBIT_RX, ORBIT_RY]);

  return (
    <View style={{ width: BASE * scale, height: 160 * scale }}>
      <View style={[styles.line, { left: GREEN_LINE_X, top: LINE_Y, width: LINE_W, height: LINE_H, borderRadius: LINE_R, backgroundColor: colors.green }]} />
      <View style={[styles.line, { left: BLACK_LINE_X, top: LINE_Y, width: LINE_W, height: LINE_H, borderRadius: LINE_R, backgroundColor: colors.black }]} />
      <View style={[styles.dot, {
        left: dots.greenX - DOT_R,
        top: dots.greenY - DOT_R,
        width: DOT_R * 2,
        height: DOT_R * 2,
        borderRadius: DOT_R,
        backgroundColor: colors.green,
      }]} />
      <View style={[styles.dot, {
        left: dots.blackX - DOT_R,
        top: dots.blackY - DOT_R,
        width: DOT_R * 2,
        height: DOT_R * 2,
        borderRadius: DOT_R,
        backgroundColor: colors.black,
      }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  line: {
    position: 'absolute',
  },
  dot: {
    position: 'absolute',
  },
});
