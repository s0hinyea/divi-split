import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import { useThemeColors } from '@/utils/ThemeContext';
import { spacing, radii } from '@/styles/theme';

function SkeletonRect({
    width,
    height,
    style,
}: {
    width?: number | string;
    height: number;
    style?: object;
}) {
    const C = useThemeColors();
    const opacity = useSharedValue(0.4);

    useEffect(() => {
        opacity.value = withRepeat(
            withSequence(
                withTiming(0.85, { duration: 800 }),
                withTiming(0.4, { duration: 800 }),
            ),
            -1,
        );
    }, []);

    const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

    return (
        <Animated.View
            style={[
                {
                    width: width ?? '100%',
                    height,
                    borderRadius: radii.sm,
                    backgroundColor: C.gray200,
                },
                animStyle,
                style,
            ]}
        />
    );
}

export function HistorySkeleton() {
    const C = useThemeColors();
    return (
        <>
            {Array.from({ length: 5 }).map((_, i) => (
                <View
                    key={i}
                    style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        backgroundColor: C.white,
                        padding: spacing.md,
                        borderRadius: radii.md,
                        marginBottom: spacing.sm,
                    }}
                >
                    <View style={{ flex: 1, gap: 8 }}>
                        <SkeletonRect width="60%" height={16} />
                        <SkeletonRect width="35%" height={12} />
                    </View>
                    <SkeletonRect width={60} height={20} />
                </View>
            ))}
        </>
    );
}

export function DashboardSkeleton() {
    return (
        <>
            {[0, 1].map((i) => (
                <View
                    key={i}
                    style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingVertical: spacing.md,
                    }}
                >
                    <View style={{ flex: 1, gap: 8 }}>
                        <SkeletonRect width="55%" height={16} />
                        <SkeletonRect width="35%" height={12} />
                    </View>
                    <SkeletonRect width={56} height={20} />
                </View>
            ))}
        </>
    );
}
