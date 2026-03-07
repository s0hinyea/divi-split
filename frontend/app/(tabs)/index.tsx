import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useContext, useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { colors, fonts, fontSizes, spacing } from '@/styles/theme';
import { SessionContext } from '@/app/_layout';
import ReceiptCard from '@/components/ReceiptCard';
import { useHistory } from '@/utils/HistoryContext';
import { useProfile } from '@/utils/ProfileContext';

function ReceiptLines() {
    return (
        <View style={styles.receiptLines}>
            <View style={[styles.receiptLine, { width: '70%' }]} />
            <View style={[styles.receiptLine, { width: '50%' }]} />
            <View style={[styles.receiptLine, { width: '60%' }]} />
        </View>
    );
}

export default function Dashboard() {
    const router = useRouter();
    const { session } = useContext(SessionContext);
    const { receipts, loading, refreshReceipts } = useHistory();
    const { profile, loading: profileLoading, refreshProfile } = useProfile();
    const [refreshing, setRefreshing] = useState(false);

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
        if (profile?.full_name) return profile.full_name.split(' ')[0]; // Use first name if full name exists

        const email = session?.user?.email || '';
        const name = email.split('@')[0];

        return name.charAt(0).toUpperCase() + name.slice(1);
    };


    const now = new Date();
    const monthlyReceipts = receipts.filter(r => {
        const d = new Date(r.created_at);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    const monthlyTotal = monthlyReceipts.reduce((sum, r) => sum + (r.total_amount || 0), 0);
    const totalScanned = receipts.length;
    const recentTwo = receipts.slice(0, 2);

    // Dynamic sizing
    const totalString = monthlyTotal.toFixed(0);
    const totalFontSize = totalString.length > 5 ? fontSizes.lg : fontSizes.xxl;

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.green}
                    />
                }
            >
                {/* Greeting */}
                <Text style={styles.greeting}>{getGreeting()},</Text>
                <Text style={styles.userName}>{getUserName()}.</Text>

                <View style={styles.statRow}>
                    <ReceiptCard style={styles.statCard} showTopZigzag={false} showBottomZigzag={true}>
                        <Text style={[styles.statAmount, { fontSize: totalFontSize }]}>${totalString}</Text>
                        <Text style={styles.statLabel}>split this month</Text>
                        <ReceiptLines />
                    </ReceiptCard>

                    <View style={styles.statSpacer} />

                    <ReceiptCard style={[styles.statCard, styles.flippedCard]} showTopZigzag={false} showBottomZigzag={true}>
                        <View style={styles.flippedContent}>
                            <Text style={styles.statAmount}>{totalScanned}</Text>
                            <Text style={styles.statLabel}>receipts scanned</Text>
                            <ReceiptLines />
                        </View>
                    </ReceiptCard>
                </View>

                <ReceiptCard style={styles.recentContainer} showTopZigzag={true} showBottomZigzag={true}>
                    <Text style={styles.recentTitle}>Recent Splits</Text>

                    {loading ? (
                        <Text style={styles.loadingText}>Loading...</Text>
                    ) : recentTwo.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyTitle}>No receipts yet</Text>
                            <Text style={styles.emptySubtitle}>Tap the logo to scan your first one!</Text>
                        </View>
                    ) : (
                        recentTwo.map((receipt, i) => (
                            <View
                                key={receipt.id}
                                style={[
                                    styles.recentItem,
                                    i < recentTwo.length - 1 && styles.recentItemBorder,
                                ]}
                            >
                                <View style={styles.recentItemLeft}>
                                    <Text style={styles.recentItemName}>{receipt.receipt_name}</Text>
                                    <Text style={styles.recentItemDate}>
                                        {new Date(receipt.created_at).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                        })}
                                        {receipt.receipt_items && ` · ${receipt.receipt_items.length} items`}
                                    </Text>
                                </View>
                                <Text style={styles.recentItemAmount}>
                                    ${(receipt.total_amount || 0).toFixed(2)}
                                </Text>
                            </View>
                        ))
                    )}

                    {recentTwo.length > 0 && (
                        <TouchableOpacity
                            onPress={() => router.push('/(tabs)/history')}
                            style={styles.viewAllButton}
                        >
                            <Text style={styles.viewAllText}>View all →</Text>
                        </TouchableOpacity>
                    )}
                </ReceiptCard>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.gray100,
    },
    scrollContent: {
        padding: spacing.lg,
        paddingBottom: spacing.xxxl,
    },


    greeting: {
        fontFamily: fonts.body,
        fontSize: fontSizes.lg,
        color: colors.black,
        marginTop: spacing.md,
    },
    userName: {
        fontFamily: fonts.bodyBold,
        fontSize: fontSizes.xxl,
        color: colors.black,
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
        color: colors.green,
        marginBottom: spacing.xs,
    },
    statLabel: {
        fontFamily: fonts.body,
        fontSize: fontSizes.sm,
        color: colors.gray600,
        marginBottom: spacing.sm,
    },


    receiptLines: {
        gap: 6,
        marginTop: spacing.sm,
    },
    receiptLine: {
        height: 2,
        backgroundColor: colors.gray200,
        borderRadius: 1,
    },





    recentContainer: {
        width: '100%',
    },
    recentTitle: {
        fontFamily: fonts.bodyBold,
        fontSize: fontSizes.lg,
        color: colors.black,
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
        borderBottomColor: colors.gray200,
    },
    recentItemLeft: {
        flex: 1,
    },
    recentItemName: {
        fontFamily: fonts.bodySemiBold,
        fontSize: fontSizes.md,
        color: colors.black,
    },
    recentItemDate: {
        fontFamily: fonts.body,
        fontSize: fontSizes.xs,
        color: colors.gray600,
        marginTop: 2,
    },
    recentItemAmount: {
        fontFamily: fonts.bodySemiBold,
        fontSize: fontSizes.lg,
        color: colors.green,
    },


    viewAllButton: {
        marginTop: spacing.md,
        marginBottom: spacing.md,
        alignItems: 'center',
    },
    viewAllText: {
        fontFamily: fonts.bodySemiBold,
        fontSize: fontSizes.sm,
        color: colors.green,
    },


    emptyState: {
        alignItems: 'center',
        paddingVertical: spacing.xl,
    },
    emptyTitle: {
        fontFamily: fonts.bodySemiBold,
        fontSize: fontSizes.md,
        color: colors.gray600,
    },
    emptySubtitle: {
        fontFamily: fonts.body,
        fontSize: fontSizes.sm,
        color: colors.gray400,
        marginTop: spacing.xs,
    },


    loadingText: {
        fontFamily: fonts.body,
        fontSize: fontSizes.sm,
        color: colors.gray400,
        textAlign: 'center',
        paddingVertical: spacing.xl,
    },
});
