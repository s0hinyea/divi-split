import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { fonts, fontSizes, spacing } from '@/styles/theme';
import { useThemeColors } from '@/utils/ThemeContext';
import ReceiptCard from '@/components/ReceiptCard';
import { useHistory } from '@/utils/HistoryContext';
import { useProfile } from '@/utils/ProfileContext';
import { useSession } from '@/utils/SessionContext';
import { DashboardSkeleton } from '@/components/SkeletonLoader';

function ReceiptLines({ color }: { color: string }) {
    return (
        <View style={styles.receiptLines}>
            <View style={[styles.receiptLine, { width: '70%', backgroundColor: color }]} />
            <View style={[styles.receiptLine, { width: '50%', backgroundColor: color }]} />
            <View style={[styles.receiptLine, { width: '60%', backgroundColor: color }]} />
        </View>
    );
}

function createStyles(C: ReturnType<typeof useThemeColors>) {
    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: C.gray100,
        },
        scrollContent: {
            padding: spacing.lg,
            paddingBottom: spacing.xxxl,
        },
        greeting: {
            fontFamily: fonts.body,
            fontSize: fontSizes.lg,
            color: C.black,
            marginTop: spacing.md,
        },
        userName: {
            fontFamily: fonts.bodyBold,
            fontSize: fontSizes.xxl,
            color: C.black,
            marginBottom: spacing.xl,
        },
        statRow: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: spacing.lg,
        },
        statCard: {
            flex: 1,
        },
        statSpacer: {
            width: spacing.md,
        },
        flippedCard: {
            transform: [{ scaleX: -1 }],
        },
        flippedContent: {
            transform: [{ scaleX: -1 }],
        },
        statAmount: {
            fontFamily: fonts.bodySemiBold,
            fontSize: fontSizes.xxl,
            color: C.green,
            marginBottom: spacing.xs,
        },
        statLabel: {
            fontFamily: fonts.body,
            fontSize: fontSizes.sm,
            color: C.gray600,
            marginBottom: spacing.sm,
        },
        recentContainer: {
            width: '100%',
        },
        recentTitle: {
            fontFamily: fonts.bodyBold,
            fontSize: fontSizes.lg,
            color: C.black,
            marginBottom: spacing.md,
        },
        recentItem: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: spacing.md,
        },
        recentItemBorder: {
            borderBottomWidth: 1,
            borderBottomColor: C.gray200,
        },
        recentItemLeft: {
            flex: 1,
        },
        recentItemName: {
            fontFamily: fonts.bodySemiBold,
            fontSize: fontSizes.md,
            color: C.black,
        },
        recentItemDate: {
            fontFamily: fonts.body,
            fontSize: fontSizes.xs,
            color: C.gray600,
            marginTop: 2,
        },
        recentItemAmount: {
            fontFamily: fonts.bodySemiBold,
            fontSize: fontSizes.lg,
            color: C.green,
        },
        viewAllButton: {
            marginTop: spacing.md,
            marginBottom: spacing.md,
            alignItems: 'center',
        },
        viewAllText: {
            fontFamily: fonts.bodySemiBold,
            fontSize: fontSizes.sm,
            color: C.green,
        },
        emptyState: {
            alignItems: 'center',
            paddingVertical: spacing.xl,
        },
        emptyTitle: {
            fontFamily: fonts.bodySemiBold,
            fontSize: fontSizes.md,
            color: C.gray600,
        },
        emptySubtitle: {
            fontFamily: fonts.body,
            fontSize: fontSizes.sm,
            color: C.gray400,
            marginTop: spacing.xs,
        },
    });
}

// Static styles that never change with theme
const styles = StyleSheet.create({
    receiptLines: {
        gap: 6,
        marginTop: spacing.sm,
    },
    receiptLine: {
        height: 2,
        borderRadius: 1,
    },
});

export default function Dashboard() {
    const router = useRouter();
    const { session } = useSession();
    const { receipts, loading, refreshReceipts, monthlyTotal, totalCount } = useHistory();
    const { profile, loading: profileLoading, refreshProfile } = useProfile();
    const [refreshing, setRefreshing] = useState(false);
    const C = useThemeColors();
    const themed = useMemo(() => createStyles(C), [C]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await Promise.all([refreshReceipts(), refreshProfile()]);
        setRefreshing(false);
    }, []);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    const getUserName = () => {
        if (profileLoading) return '...';
        if (profile?.username) return profile.username;
        if (profile?.full_name) return profile.full_name.split(' ')[0];

        const email = session?.user?.email || '';
        const name = email.split('@')[0];

        return name.charAt(0).toUpperCase() + name.slice(1);
    };

    const recentTwo = receipts.slice(0, 2);

    // Dynamic sizing
    const totalString = monthlyTotal.toFixed(0);
    const totalFontSize = totalString.length > 5 ? fontSizes.lg : fontSizes.xxl;

    return (
        <SafeAreaView style={themed.container}>
            <ScrollView
                contentContainerStyle={themed.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={C.green}
                    />
                }
            >
                {/* Greeting */}
                <Text style={themed.greeting}>{getGreeting()},</Text>
                <Text style={themed.userName}>{getUserName()}.</Text>

                <View style={themed.statRow}>
                    <ReceiptCard style={themed.statCard} showTopZigzag={false} showBottomZigzag={true}>
                        <Text style={[themed.statAmount, { fontSize: totalFontSize }]}>${totalString}</Text>
                        <Text style={themed.statLabel}>split this month</Text>
                        <ReceiptLines color={C.gray200} />
                    </ReceiptCard>

                    <View style={themed.statSpacer} />

                    <ReceiptCard style={[themed.statCard, themed.flippedCard]} showTopZigzag={false} showBottomZigzag={true}>
                        <View style={themed.flippedContent}>
                            <Text style={themed.statAmount}>{totalCount}</Text>
                            <Text style={themed.statLabel}>receipts scanned</Text>
                            <ReceiptLines color={C.gray200} />
                        </View>
                    </ReceiptCard>
                </View>

                <ReceiptCard style={themed.recentContainer} showTopZigzag={true} showBottomZigzag={true}>
                    <Text style={themed.recentTitle}>Recent Splits</Text>

                    {loading ? (
                        <DashboardSkeleton />
                    ) : recentTwo.length === 0 ? (
                        <View style={themed.emptyState}>
                            <Text style={themed.emptyTitle}>No receipts yet</Text>
                            <Text style={themed.emptySubtitle}>Tap the logo to scan your first one!</Text>
                        </View>
                    ) : (
                        recentTwo.map((receipt, i) => (
                            <View
                                key={receipt.id}
                                style={[
                                    themed.recentItem,
                                    i < recentTwo.length - 1 && themed.recentItemBorder,
                                ]}
                            >
                                <View style={themed.recentItemLeft}>
                                    <Text style={themed.recentItemName}>{receipt.receipt_name}</Text>
                                    <Text style={themed.recentItemDate}>
                                        {new Date(receipt.created_at).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                        })}
                                        {receipt.receipt_items && ` · ${receipt.receipt_items.length} items`}
                                    </Text>
                                </View>
                                <Text style={themed.recentItemAmount}>
                                    ${(receipt.total_amount || 0).toFixed(2)}
                                </Text>
                            </View>
                        ))
                    )}

                    {recentTwo.length > 0 && (
                        <TouchableOpacity
                            onPress={() => router.push('/(tabs)/history')}
                            style={themed.viewAllButton}
                        >
                            <Text style={themed.viewAllText}>View all →</Text>
                        </TouchableOpacity>
                    )}
                </ReceiptCard>
            </ScrollView>
        </SafeAreaView>
    );
}
