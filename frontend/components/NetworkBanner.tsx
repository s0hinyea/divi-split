import React, { useEffect, useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withDelay,
    runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, fontSizes } from '@/styles/theme';
import { MaterialIcons } from '@expo/vector-icons';

type BannerState = 'hidden' | 'offline' | 'back-online';

/**
 * Slim banner that slides down from the top when network is lost.
 * Shows "Back online" briefly when reconnected, then auto-dismisses.
 * Rendered in the tabs _layout so it covers all 3 main tabs.
 */
export default function NetworkBanner() {
    const insets = useSafeAreaInsets();
    const [bannerState, setBannerState] = useState<BannerState>('hidden');
    const translateY = useSharedValue(-60);

    useEffect(() => {
        // Skip the first emission (initial state) to avoid a false "offline" flash
        let isFirstEmission = true;

        const unsubscribe = NetInfo.addEventListener((state) => {
            if (isFirstEmission) {
                isFirstEmission = false;
                // If we boot up offline, show the banner
                if (!state.isConnected) {
                    setBannerState('offline');
                    translateY.value = withTiming(0, { duration: 300 });
                }
                return;
            }

            if (!state.isConnected) {
                // Lost connection
                setBannerState('offline');
                translateY.value = withTiming(0, { duration: 300 });
            } else if (bannerState === 'offline' || bannerState === 'back-online') {
                // Regained connection
                setBannerState('back-online');
                translateY.value = withDelay(
                    2000,  // show "Back online" for 2s
                    withTiming(-60, { duration: 300 }, () => {
                        runOnJS(setBannerState)('hidden');
                    })
                );
            }
        });

        return () => unsubscribe();
    }, [bannerState]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    if (bannerState === 'hidden') return null;

    const isOffline = bannerState === 'offline';

    return (
        <Animated.View
            style={[
                styles.banner,
                { paddingTop: insets.top + 4 },
                isOffline ? styles.offlineBg : styles.onlineBg,
                animatedStyle,
            ]}
        >
            <MaterialIcons
                name={isOffline ? 'wifi-off' : 'wifi'}
                size={16}
                color={colors.white}
            />
            <Text style={styles.text}>
                {isOffline ? 'No internet connection' : 'Back online'}
            </Text>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    banner: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9998,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingBottom: 8,
    },
    offlineBg: {
        backgroundColor: '#D32F2F',
    },
    onlineBg: {
        backgroundColor: colors.green,
    },
    text: {
        fontFamily: fonts.bodySemiBold,
        fontSize: fontSizes.sm,
        color: colors.white,
    },
});
