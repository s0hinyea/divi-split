import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { fonts, fontSizes, spacing, radii, shadows } from '@/styles/theme';
import { useThemeColors } from '@/utils/ThemeContext';
import { useHistory } from '@/utils/HistoryContext';
import { useProfile } from '@/utils/ProfileContext';
import { useSession } from '@/utils/SessionContext';
import { DashboardSkeleton } from '@/components/SkeletonLoader';

function createStyles(C: ReturnType<typeof useThemeColors>) {
    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: C.gray100,
        },
        scrollContent: {
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.lg,
            paddingBottom: 140,
        },

        // Greeting
        greeting: {
            fontFamily: fonts.body,
            fontSize: fontSizes.md,
            color: C.gray500,
            marginTop: spacing.sm,
        },
        userName: {
            fontFamily: fonts.bodyBold,
            fontSize: 30,
            color: C.black,
            marginBottom: spacing.xl,
            letterSpacing: -0.5,
        },

        // Hero card — dark, bold
        heroCard: {
            backgroundColor: C.black,
            borderRadius: radii.xl,
            padding: spacing.xl,
            marginBottom: spacing.md,
            ...shadows.lg,
        },
        heroLabel: {
            fontFamily: fonts.body,
            fontSize: fontSizes.sm,
            color: C.gray400,
            marginBottom: spacing.sm,
            textTransform: 'uppercase',
            letterSpacing: 1,
        },
        heroAmount: {
            fontFamily: fonts.bodyBold,
            fontSize: 56,
            color: C.white,
            letterSpacing: -2,
            lineHeight: 60,
        },
        heroAmountSmall: {
            fontSize: fontSizes.xxl,
        },
        heroFooter: {
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: spacing.lg,
            paddingTop: spacing.md,
            borderTopWidth: 1,
            borderTopColor: 'rgba(255,255,255,0.08)',
        },
        heroStat: {
            flex: 1,
        },
        heroStatValue: {
            fontFamily: fonts.bodySemiBold,
            fontSize: fontSizes.lg,
            color: C.green,
        },
        heroStatLabel: {
            fontFamily: fonts.body,
            fontSize: fontSizes.xs,
            color: C.gray500,
            marginTop: 2,
        },

        // Recent splits card
        recentCard: {
            backgroundColor: C.white,
            borderRadius: radii.xl,
            padding: spacing.lg,
            ...shadows.sm,
        },
        recentHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: spacing.md,
        },
        recentTitle: {
            fontFamily: fonts.bodyBold,
            fontSize: fontSizes.lg,
            color: C.black,
        },
        viewAllText: {
            fontFamily: fonts.bodySemiBold,
            fontSize: fontSizes.sm,
            color: C.green,
        },

        // Receipt row
        receiptRow: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: spacing.md,
            gap: spacing.md,
        },
        receiptRowBorder: {
            borderBottomWidth: 1,
            borderBottomColor: C.gray200,
        },
        receiptIcon: {
            width: 40,
            height: 40,
            borderRadius: radii.sm,
            backgroundColor: C.gray100,
            justifyContent: 'center',
            alignItems: 'center',
        },
        receiptInfo: {
            flex: 1,
        },
        receiptName: {
            fontFamily: fonts.bodySemiBold,
            fontSize: fontSizes.md,
            color: C.black,
        },
        receiptDate: {
            fontFamily: fonts.body,
            fontSize: fontSizes.xs,
            color: C.gray500,
            marginTop: 2,
        },
        receiptAmount: {
            fontFamily: fonts.bodySemiBold,
            fontSize: fontSizes.md,
            color: C.black,
        },

        // Empty state
        emptyState: {
            alignItems: 'center',
            paddingVertical: spacing.xl,
            gap: spacing.sm,
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
        },
    });
}

export default function Dashboard() {
    const router = useRouter();
    const { session } = useSession();
    const { receipts, loading, refreshReceipts, monthlyTotal, totalCount } = useHistory();
    const { profile, loading: profileLoading, refreshProfile } = useProfile();
    const [refreshing, setRefreshing] = useState(false);
    const C = useThemeColors();
    const styles = useMemo(() => createStyles(C), [C]);

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
    const totalString = monthlyTotal.toFixed(2);
    const isLargeAmount = totalString.length > 7;

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
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
                <Text style={styles.greeting}>{getGreeting()},</Text>
                <Text style={styles.userName}>{getUserName()}.</Text>

                {/* Hero card */}
                <View style={styles.heroCard}>
                    <Text style={styles.heroLabel}>This month</Text>
                    <Text style={[styles.heroAmount, isLargeAmount && styles.heroAmountSmall]}>
                        ${totalString}
                    </Text>
                    <View style={styles.heroFooter}>
                        <View style={styles.heroStat}>
                            <Text style={styles.heroStatValue}>{totalCount}</Text>
                            <Text style={styles.heroStatLabel}>receipts scanned</Text>
                        </View>
                    </View>
                </View>

                {/* Recent splits */}
                <View style={styles.recentCard}>
                    <View style={styles.recentHeader}>
                        <Text style={styles.recentTitle}>Recent Splits</Text>
                        {recentTwo.length > 0 && (
                            <TouchableOpacity onPress={() => router.push('/(tabs)/history')}>
                                <Text style={styles.viewAllText}>View all</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {loading ? (
                        <DashboardSkeleton />
                    ) : recentTwo.length === 0 ? (
                        <View style={styles.emptyState}>
                            <MaterialIcons name="receipt-long" size={32} color={C.gray300} />
                            <Text style={styles.emptyTitle}>No receipts yet</Text>
                            <Text style={styles.emptySubtitle}>Tap + to scan your first one</Text>
                        </View>
                    ) : (
                        recentTwo.map((receipt, i) => (
                            <TouchableOpacity
                                key={receipt.id}
                                style={[
                                    styles.receiptRow,
                                    i < recentTwo.length - 1 && styles.receiptRowBorder,
                                ]}
                                onPress={() => router.push(`/receipt/${receipt.id}`)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.receiptIcon}>
                                    <MaterialIcons name="receipt" size={18} color={C.green} />
                                </View>
                                <View style={styles.receiptInfo}>
                                    <Text style={styles.receiptName}>{receipt.receipt_name}</Text>
                                    <Text style={styles.receiptDate}>
                                        {new Date(receipt.created_at).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                        })}
                                        {receipt.receipt_items && ` · ${receipt.receipt_items.length} items`}
                                    </Text>
                                </View>
                                <Text style={styles.receiptAmount}>
                                    ${(receipt.total_amount || 0).toFixed(2)}
                                </Text>
                            </TouchableOpacity>
                        ))
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
