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

interface CompletionOverlayProps {
    visible: boolean;
    onAnimationComplete: () => void;
}

export default function CompletionOverlay({ visible, onAnimationComplete }: CompletionOverlayProps) {
    const opacity = useSharedValue(0);

    useEffect(() => {
        if (visible) {
            // Pop in, stay visible briefly, then fade out.
            opacity.value = 0;
            opacity.value = withTiming(1, { duration: 200 }, () => {
                opacity.value = withDelay(900, withTiming(0, { duration: 240 }, () => {
                    runOnJS(onAnimationComplete)();
                }));
            });
        }
    }, [visible]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            opacity: opacity.value,
        };
    });

    if (!visible) return null;

    return (
        <Modal transparent visible={visible} animationType="fade">
            <BlurView intensity={28} style={styles.container} tint="light">
                <Animated.View style={[styles.content, animatedStyle]}>
                    <MaterialIcons name="check" size={72} color={colors.green} />
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
        gap: 10,
    },
    text: {
        fontFamily: fonts.bodyBold,
        fontSize: fontSizes.xl,
        color: colors.gray800,
    }
});
