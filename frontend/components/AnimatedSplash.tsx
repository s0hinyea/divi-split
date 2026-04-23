import React, { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    runOnJS,
} from 'react-native-reanimated';
import DiviLogoAnimated from './DiviLogoAnimated';

const MIN_DISPLAY_MS = 2000;
const FADE_DURATION_MS = 600;

interface Props {
    appReady: boolean;
    onComplete: () => void;
}

export default function AnimatedSplash({ appReady, onComplete }: Props) {
    const opacity = useSharedValue(1);
    const mountTime = useRef(Date.now());

    // Fade out when app is ready (after minimum display time)
    useEffect(() => {
        if (appReady) {
            const elapsed = Date.now() - mountTime.current;
            const remaining = Math.max(0, MIN_DISPLAY_MS - elapsed);

            const timer = setTimeout(() => {
                opacity.value = withTiming(0, { duration: FADE_DURATION_MS }, (finished) => {
                    if (finished) {
                        runOnJS(onComplete)();
                    }
                });
            }, remaining);

            return () => clearTimeout(timer);
        }
    }, [appReady]);

    const fadeStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    return (
        <Animated.View style={[styles.container, fadeStyle]}>
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
