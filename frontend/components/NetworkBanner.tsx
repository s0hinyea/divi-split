import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, fontSizes } from '@/styles/theme';
import { MaterialIcons } from '@expo/vector-icons';

type BannerState = 'hidden' | 'offline' | 'back-online';

export default function NetworkBanner() {
    const insets = useSafeAreaInsets();
    const [bannerState, setBannerState] = useState<BannerState>('hidden');
    const translateY = useRef(new Animated.Value(-60)).current;
    const animationRef = useRef<Animated.CompositeAnimation | null>(null);

    const slideIn = () => {
        if (animationRef.current) animationRef.current.stop();
        animationRef.current = Animated.timing(translateY, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
        });
        animationRef.current.start();
    };

    const slideOutAfterDelay = () => {
        if (animationRef.current) animationRef.current.stop();
        animationRef.current = Animated.sequence([
            Animated.delay(2000),
            Animated.timing(translateY, {
                toValue: -60,
                duration: 150,
                useNativeDriver: true,
            }),
        ]);
        animationRef.current.start(({ finished }) => {
            if (finished) setBannerState('hidden');
        });
    };

    useEffect(() => {
        let isFirstEmission = true;

        const unsubscribe = NetInfo.addEventListener((state) => {
            if (isFirstEmission) {
                isFirstEmission = false;
                if (!state.isConnected) {
                    setBannerState('offline');
                    slideIn();
                }
                return;
            }

            if (!state.isConnected) {
                setBannerState('offline');
                slideIn();
            } else if (bannerState === 'offline' || bannerState === 'back-online') {
                setBannerState('back-online');
                slideOutAfterDelay();
            }
        });

        return () => unsubscribe();
    }, [bannerState]);

    if (bannerState === 'hidden') return null;

    const isOffline = bannerState === 'offline';

    return (
        <Animated.View
            pointerEvents="box-none"
            style={[
                styles.banner,
                { paddingTop: insets.top + 4 },
                isOffline ? styles.offlineBg : styles.onlineBg,
                { transform: [{ translateY }] },
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
