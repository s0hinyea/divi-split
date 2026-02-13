/**
 * ErrorOverlay — A full-screen error display.
 * Shows a centered error message over a blurred background,
 * with a subtle screen shake. Auto-dismisses after 3 seconds with fade-out.
 *
 * Usage:
 *   const [error, setError] = useState<string | null>(null);
 *   <ErrorOverlay message={error} onDismiss={() => setError(null)} />
 */

import React, { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSequence,
    withDelay,
    runOnJS,
    Easing,
} from 'react-native-reanimated';
import { colors, fonts, fontSizes, spacing, radii, animation } from '@/styles/theme';

const DISPLAY_DURATION = 3000; // show for 3 seconds
const SHAKE_MAGNITUDE = 8;

interface Props {
    message: string | null;
    onDismiss: () => void;
}

export default function ErrorOverlay({ message, onDismiss }: Props) {
    const opacity = useSharedValue(0);
    const shakeX = useSharedValue(0);

    useEffect(() => {
        if (message) {
            // Fade in
            opacity.value = withTiming(1, { duration: animation.normal });

            // Quick shake sequence
            shakeX.value = withSequence(
                withTiming(SHAKE_MAGNITUDE, { duration: 50 }),
                withTiming(-SHAKE_MAGNITUDE, { duration: 50 }),
                withTiming(SHAKE_MAGNITUDE * 0.6, { duration: 50 }),
                withTiming(-SHAKE_MAGNITUDE * 0.6, { duration: 50 }),
                withTiming(0, { duration: 50 }),
            );

            // Auto-dismiss: fade out after DISPLAY_DURATION, then call onDismiss
            opacity.value = withDelay(
                DISPLAY_DURATION,
                withTiming(0, { duration: animation.slow, easing: Easing.out(Easing.cubic) }, (finished) => {
                    if (finished) {
                        runOnJS(onDismiss)();
                    }
                }),
            );
        }
    }, [message]);

    const containerStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    const cardStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: shakeX.value }],
    }));

    if (!message) return null;

    return (
        <Animated.View style={[styles.overlay, containerStyle]} pointerEvents="none">
            <BlurView intensity={40} tint="dark" style={styles.blur}>
                <Animated.View style={[styles.card, cardStyle]}>
                    <Text style={styles.errorText}>{message}</Text>
                </Animated.View>
            </BlurView>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 9999,
        justifyContent: 'center',
        alignItems: 'center',
    },
    blur: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        backgroundColor: colors.white,
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing.xl,
        borderRadius: radii.md,
        maxWidth: '80%',
        alignItems: 'center',
    },
    errorText: {
        fontFamily: fonts.body,
        fontSize: fontSizes.md,
        color: colors.error,
        textAlign: 'center',
        lineHeight: 22,
    },
});
