import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors, fonts, fontSizes, spacing, radii, animation } from '@/styles/theme';

const DISPLAY_DURATION = 3000;
const SHAKE_MAGNITUDE = 8;

interface Props {
    message: string | null;
    onDismiss: () => void;
}

export default function ErrorOverlay({ message, onDismiss }: Props) {
    const opacity = useRef(new Animated.Value(0)).current;
    const shakeX = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (message) {
            opacity.setValue(0);
            shakeX.setValue(0);

            // Fade in → hold → fade out, then call onDismiss
            Animated.sequence([
                Animated.timing(opacity, { toValue: 1, duration: animation.normal, useNativeDriver: true }),
                Animated.delay(DISPLAY_DURATION),
                Animated.timing(opacity, { toValue: 0, duration: animation.slow, useNativeDriver: true }),
            ]).start(({ finished }) => {
                if (finished) onDismiss();
            });

            // Screen shake runs independently
            Animated.sequence([
                Animated.timing(shakeX, { toValue: SHAKE_MAGNITUDE, duration: 50, useNativeDriver: true }),
                Animated.timing(shakeX, { toValue: -SHAKE_MAGNITUDE, duration: 50, useNativeDriver: true }),
                Animated.timing(shakeX, { toValue: SHAKE_MAGNITUDE * 0.6, duration: 50, useNativeDriver: true }),
                Animated.timing(shakeX, { toValue: -SHAKE_MAGNITUDE * 0.6, duration: 50, useNativeDriver: true }),
                Animated.timing(shakeX, { toValue: 0, duration: 50, useNativeDriver: true }),
            ]).start();
        }
    }, [message]);

    if (!message) return null;

    return (
        <Animated.View
            style={[styles.overlay, { opacity }]}
            pointerEvents="none"
        >
            <BlurView intensity={40} tint="dark" style={styles.blur}>
                <Animated.View style={[styles.card, { transform: [{ translateX: shakeX }] }]}>
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
