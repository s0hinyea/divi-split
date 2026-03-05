import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal } from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withTiming, 
    withDelay,
    runOnJS
} from 'react-native-reanimated';
import { colors, fonts, fontSizes } from '@/styles/theme';
import { useSplitStore } from '@/stores/splitStore';

/**
 * Global completion overlay — rendered in _layout.tsx so it sits above
 * every route.  Reads `showCompletion` from the Zustand store and
 * auto-dismisses after the check-mark animation finishes.
 */
export default function CompletionOverlay() {
    const visible = useSplitStore((s) => s.showCompletion);
    const clearCompletion = useSplitStore((s) => s.clearCompletion);

    const opacity = useSharedValue(0);
    const scale = useSharedValue(0.6);

    useEffect(() => {
        if (visible) {
            // Reset values
            opacity.value = 0;
            scale.value = 0.6;

            // Pop in
            opacity.value = withTiming(1, { duration: 200 });
            scale.value = withTiming(1, { duration: 250 });

            // Hold, then fade out and clear global state
            opacity.value = withDelay(
                1400,
                withTiming(0, { duration: 280 }, () => {
                    runOnJS(clearCompletion)();
                })
            );
        }
    }, [visible]);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ scale: scale.value }],
    }));

    if (!visible) return null;

    return (
        <Modal transparent visible={visible} animationType="none">
            <BlurView intensity={40} style={styles.container} tint="light">
                <Animated.View style={[styles.content, animatedStyle]}>
                    <MaterialIcons name="check-circle" size={80} color={colors.green} />
                    <Text style={styles.text}>Completed!</Text>
                </Animated.View>
            </BlurView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
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
