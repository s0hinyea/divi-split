import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSequence,
    withDelay,
    runOnJS,
} from 'react-native-reanimated';
import { colors, fonts, fontSizes } from '@/styles/theme';
import { useSplitStore } from '@/stores/splitStore';

/**
 * Global completion overlay — rendered in _layout.tsx so it sits above
 * every route.  Uses an absolute-positioned View (not a Modal) to avoid
 * native-window timing glitches that cause black flashes.
 */
export default function CompletionOverlay() {
    const visible = useSplitStore((s) => s.showCompletion);
    const clearCompletion = useSplitStore((s) => s.clearCompletion);

    const containerOpacity = useSharedValue(0);
    const contentScale = useSharedValue(0.5);

    useEffect(() => {
        if (visible) {
            // Blur background fades in instantly
            containerOpacity.value = withTiming(1, { duration: 150 });

            // Checkmark pops in, holds, then everything fades out together
            contentScale.value = withSequence(
                withTiming(1, { duration: 250 }),                          // pop in
                withDelay(1200, withTiming(0.8, { duration: 200 }))        // subtle shrink before fade
            );

            // Container holds, then fades out and clears state
            containerOpacity.value = withSequence(
                withTiming(1, { duration: 150 }),                          // ensure fully visible
                withDelay(1300, withTiming(0, { duration: 300 }, () => {   // fade everything out
                    runOnJS(clearCompletion)();
                }))
            );
        } else {
            // Reset for next use
            containerOpacity.value = 0;
            contentScale.value = 0.5;
        }
    }, [visible]);

    const containerStyle = useAnimatedStyle(() => ({
        opacity: containerOpacity.value,
        pointerEvents: containerOpacity.value > 0 ? 'auto' as const : 'none' as const,
    }));

    const contentStyle = useAnimatedStyle(() => ({
        transform: [{ scale: contentScale.value }],
    }));

    return (
        <Animated.View style={[styles.overlay, containerStyle]}>
            {/* Immediate light fallback to prevent black frame while blur initializes */}
            <View style={styles.fallbackLight} />
            <BlurView intensity={50} tint="light" style={StyleSheet.absoluteFill} />
            <View style={styles.center}>
                <Animated.View style={[styles.content, contentStyle]}>
                    <MaterialIcons name="check-circle" size={80} color={colors.green} />
                    <Text style={styles.text}>Completed!</Text>
                </Animated.View>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 9999,
        elevation: 9999,
    },
    fallbackLight: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.16)',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    text: {
        fontFamily: fonts.bodyBold,
        fontSize: fontSizes.xl,
        color: colors.gray800,
    },
});
