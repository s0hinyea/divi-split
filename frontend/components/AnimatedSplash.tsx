import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import DiviLogoAnimated from './DiviLogoAnimated';

const MIN_DISPLAY_MS = 1200;
const FADE_DURATION_MS = 600;

interface Props {
    appReady: boolean;
    onComplete: () => void;
}

export default function AnimatedSplash({ appReady, onComplete }: Props) {
    const opacity = useRef(new Animated.Value(1)).current;
    const mountTime = useRef(Date.now());

    useEffect(() => {
        if (appReady) {
            const elapsed = Date.now() - mountTime.current;
            const remaining = Math.max(0, MIN_DISPLAY_MS - elapsed);

            const timer = setTimeout(() => {
                Animated.timing(opacity, {
                    toValue: 0,
                    duration: FADE_DURATION_MS,
                    useNativeDriver: true,
                }).start(({ finished }) => {
                    if (finished) onComplete();
                });
            }, remaining);

            return () => clearTimeout(timer);
        }
    }, [appReady]);

    return (
        <Animated.View style={[styles.container, { opacity }]}>
            <DiviLogoAnimated size={240} />
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
