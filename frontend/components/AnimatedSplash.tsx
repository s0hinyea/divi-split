import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    Easing,
    runOnJS,
} from 'react-native-reanimated';

// --- Logo geometry (scaled from SVG viewBox 120×160) ---
const SCALE = 1.5;
const LOGO_W = 120 * SCALE;
const LOGO_H = 160 * SCALE;

const LINE_W = 10 * SCALE;
const LINE_H = 100 * SCALE;
const LINE_R = 5 * SCALE;
const DOT_R = 8 * SCALE;

// Positions (from SVG)
const GREEN_LINE_X = 40 * SCALE;
const BLACK_LINE_X = 70 * SCALE;
const LINE_Y = 30 * SCALE;

// Orbit: center between the two lines, dots orbit horizontally
const ORBIT_CX = 60 * SCALE;
const ORBIT_CY = 80 * SCALE;
const ORBIT_RX = 40 * SCALE;  // wide horizontal radius
const ORBIT_RY = 10 * SCALE;  // short vertical radius (flat ellipse)

const GREEN = '#228B22';
const BLACK = '#000000';

// Timing
const MIN_DISPLAY_MS = 2000;
const ORBIT_DURATION_MS = 1800;
const FADE_DURATION_MS = 600;

interface Props {
    appReady: boolean;
    onComplete: () => void;
}

export default function AnimatedSplash({ appReady, onComplete }: Props) {
    const angle = useSharedValue(0);
    const opacity = useSharedValue(1);
    const mountTime = useRef(Date.now());

    // Start infinite clockwise orbit with ease-in-out per revolution
    useEffect(() => {
        angle.value = withRepeat(
            withTiming(2 * Math.PI, {
                duration: ORBIT_DURATION_MS,
                easing: Easing.inOut(Easing.cubic),
            }),
            -1,   // infinite
            false  // no reverse — reset to 0 (invisible since cos/sin(2π) = cos/sin(0))
        );
    }, []);

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

    // Green dot: starts at π (left side), orbits clockwise
    const greenDotStyle = useAnimatedStyle(() => {
        'worklet';
        const x = ORBIT_CX + ORBIT_RX * Math.cos(Math.PI + angle.value);
        const y = ORBIT_CY + ORBIT_RY * Math.sin(Math.PI + angle.value);
        return {
            position: 'absolute',
            left: x - DOT_R,
            top: y - DOT_R,
            width: DOT_R * 2,
            height: DOT_R * 2,
            borderRadius: DOT_R,
            backgroundColor: GREEN,
        };
    });

    // Black dot: starts at 0 (right side), orbits clockwise
    const blackDotStyle = useAnimatedStyle(() => {
        'worklet';
        const x = ORBIT_CX + ORBIT_RX * Math.cos(angle.value);
        const y = ORBIT_CY + ORBIT_RY * Math.sin(angle.value);
        return {
            position: 'absolute',
            left: x - DOT_R,
            top: y - DOT_R,
            width: DOT_R * 2,
            height: DOT_R * 2,
            borderRadius: DOT_R,
            backgroundColor: BLACK,
        };
    });

    const fadeStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    return (
        <Animated.View style={[styles.container, fadeStyle]}>
            <View style={styles.logoContainer}>
                {/* Static vertical lines */}
                <View style={[styles.line, { left: GREEN_LINE_X, top: LINE_Y, backgroundColor: GREEN }]} />
                <View style={[styles.line, { left: BLACK_LINE_X, top: LINE_Y, backgroundColor: BLACK }]} />

                {/* Animated orbiting dots */}
                <Animated.View style={greenDotStyle} />
                <Animated.View style={blackDotStyle} />
            </View>
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
    logoContainer: {
        width: LOGO_W,
        height: LOGO_H,
        position: 'relative',
    },
    line: {
        position: 'absolute',
        width: LINE_W,
        height: LINE_H,
        borderRadius: LINE_R,
    },
});
