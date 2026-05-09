import React, { useEffect, useRef } from 'react';
import { Animated, View, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fonts, fontSizes } from '@/styles/theme';
import { useSplitStore } from '@/stores/splitStore';

export default function CompletionOverlay() {
    const visible = useSplitStore((s) => s.showCompletion);
    const clearCompletion = useSplitStore((s) => s.clearCompletion);

    const containerOpacity = useRef(new Animated.Value(0)).current;
    const contentScale = useRef(new Animated.Value(0.5)).current;

    useEffect(() => {
        if (visible) {
            containerOpacity.setValue(0);
            contentScale.setValue(0.5);

            Animated.sequence([
                Animated.timing(containerOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
                Animated.delay(1400),
                Animated.timing(containerOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
            ]).start(({ finished }) => {
                if (finished) clearCompletion();
            });

            Animated.sequence([
                Animated.timing(contentScale, { toValue: 1, duration: 150, useNativeDriver: true }),
                Animated.delay(1200),
                Animated.timing(contentScale, { toValue: 0.9, duration: 200, useNativeDriver: true }),
            ]).start();
        } else {
            containerOpacity.setValue(0);
            contentScale.setValue(0.5);
        }
    }, [visible]);

    if (!visible) return null;

    return (
        <Animated.View style={[styles.overlay, { opacity: containerOpacity }]} pointerEvents="auto">
            <View style={styles.fallbackLight} />
            <BlurView intensity={50} tint="light" style={StyleSheet.absoluteFill} />
            <View style={styles.center}>
                <Animated.View style={[styles.content, { transform: [{ scale: contentScale }] }]}>
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
