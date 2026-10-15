import React from 'react';
import Svg, { Circle, Rect } from 'react-native-svg';
import { colors } from '@/styles/theme';

interface Props {
  size?: number;
  color?: string;
}

export default function DiviLogo({ size = 80, color }: Props) {
  const scale = size / 160;
  const primaryColor = color ?? colors.green;
  const secondaryColor = color ?? colors.black;
  return (
    <Svg width={120 * scale} height={160 * scale} viewBox="0 0 120 160" fill="none">
      <Circle cx="20" cy="80" r="8" fill={primaryColor} />
      <Rect x="40" y="30" width="10" height="100" rx="5" fill={primaryColor} />
      <Rect x="70" y="30" width="10" height="100" rx="5" fill={secondaryColor} />
      <Circle cx="100" cy="80" r="8" fill={secondaryColor} />
    </Svg>
  );
}
