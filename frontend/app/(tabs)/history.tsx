import {
    View,
    StyleSheet,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { ScrollView, Pressable } from 'react-native-gesture-handler';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { MaterialIcons } from '@expo/vector-icons';
import { fonts, fontSizes, spacing, radii, shadows, colors } from '@/styles/theme';
import { useThemeColors } from '@/utils/ThemeContext';
import { useHistory, Receipt } from '@/utils/HistoryContext';
import { useSession } from '@/utils/SessionContext';
import { getUserFacingErrorMessage } from '@/utils/network';
import { HistorySkeleton } from '@/components/SkeletonLoader';
import { useToast } from '@/components/ToastProvider';
import { supabase } from '@/lib/supabase';

type DebtorSummary = {
    contactDbId: string;
    name: string;
    phone: string | null;
    total: number;
    receiptCount: number;
};

function createStyles(C: ReturnType<typeof useThemeColors>) {
    return StyleSheet.create({
        container: { flex: 1, backgroundColor: C.gray100 },

        header: {
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.md,
            paddingBottom: spacing.sm,
        },
        title: {
            fontFamily: fonts.bodyBold,
            fontSize: 30,
            color: C.black,
            letterSpacing: -0.5,
        },
        subtitle: {
            fontFamily: fonts.body,
            fontSize: fontSizes.sm,
            color: C.gray500,
            marginTop: 2,
        },

        // Segmented control
        segmentWrapper: {
            paddingHorizontal: spacing.lg,
            paddingBottom: spacing.md,
        },
        segmentedControl: {
            flexDirection: 'row',
            backgroundColor: C.gray200,
            borderRadius: radii.full,
            padding: 3,
        },
        segmentButton: {
            flex: 1,
            paddingVertical: spacing.sm,
            borderRadius: radii.full,
            alignItems: 'center',
        },
        segmentButtonActive: {
            backgroundColor: C.white,
            shadowColor: C.black,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.08,
            shadowRadius: 4,
            elevation: 2,
        },
        segmentText: {
            fontFamily: fonts.bodySemiBold,
            fontSize: fontSizes.sm,
            color: C.gray400,
        },
        segmentTextActive: {
            color: C.black,
        },

        scrollContent: {
            paddingHorizontal: spacing.lg,
            paddingBottom: 140,
        },

        // Receipt card
        cardWrapper: {
            marginBottom: spacing.sm,
        },
        receiptCard: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: C.white,
            borderRadius: radii.md,
            overflow: 'hidden',
            gap: spacing.md,
            ...shadows.sm,
        },
        receiptCardPressed: {
            backgroundColor: C.gray100,
        },
        accentBar: {
            width: 4,
            alignSelf: 'stretch',
            backgroundColor: C.green,
            borderTopLeftRadius: radii.md,
            borderBottomLeftRadius: radii.md,
        },
        receiptContent: {
            flex: 1,
            paddingVertical: spacing.md,
            paddingRight: spacing.md,
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
        },
        receiptIcon: {
            width: 38,
            height: 38,
            borderRadius: radii.sm,
            backgroundColor: C.gray100,
            justifyContent: 'center',
            alignItems: 'center',
        },
        receiptInfo: { flex: 1 },
        receiptName: {
            fontFamily: fonts.bodySemiBold,
            fontSize: fontSizes.md,
            color: C.black,
        },
        receiptMeta: {
            fontFamily: fonts.body,
            fontSize: fontSizes.xs,
            color: C.gray500,
            marginTop: 2,
        },
        receiptAmount: {
            fontFamily: fonts.bodyBold,
            fontSize: fontSizes.md,
            color: C.black,
        },
        settlementPill: {
            flexDirection: 'row' as const,
            alignItems: 'center' as const,
            gap: 4,
            marginTop: 3,
        },
        settlementDot: {
            width: 6,
            height: 6,
            borderRadius: 3,
        },
        settlementText: {
            fontFamily: fonts.bodyMedium,
            fontSize: 11,
        },

        deleteAction: {
            backgroundColor: C.error,
            justifyContent: 'center',
            alignItems: 'center',
            width: 74,
            borderRadius: radii.md,
            marginBottom: spacing.sm,
        },

        // Debtor card
        debtorCard: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: C.white,
            borderRadius: radii.md,
            padding: spacing.md,
            marginBottom: spacing.sm,
            gap: spacing.md,
            ...shadows.sm,
        },
        debtorAvatar: {
            width: 42,
            height: 42,
            borderRadius: 21,
            backgroundColor: `${colors.green}20`,
            justifyContent: 'center',
            alignItems: 'center',
        },
        debtorAvatarText: {
            fontFamily: fonts.bodyBold,
            fontSize: fontSizes.md,
            color: colors.green,
        },
        debtorInfo: { flex: 1 },
        debtorName: {
            fontFamily: fonts.bodySemiBold,
            fontSize: fontSizes.md,
            color: C.black,
        },
        debtorMeta: {
            fontFamily: fonts.body,
            fontSize: fontSizes.xs,
            color: C.gray500,
            marginTop: 2,
        },
        debtorAmount: {
            fontFamily: fonts.bodyBold,
            fontSize: fontSizes.md,
            color: colors.green,
        },

        loadMoreButton: {
            paddingVertical: spacing.md,
            alignItems: 'center',
            marginTop: spacing.xs,
        },
        loadMoreText: {
            color: C.green,
            fontSize: fontSizes.sm,
            fontFamily: fonts.bodySemiBold,
        },

        emptyState: {
            alignItems: 'center',
            paddingVertical: spacing.xxxl,
            gap: spacing.sm,
        },
        emptyIconWrap: {
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: C.gray200,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: spacing.sm,
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

export default function History() {
    const C = useThemeColors();
    const styles = useMemo(() => createStyles(C), [C]);
    const router = useRouter();
    const { session } = useSession();

    const { receipts, loading, hasMore, fetchReceipts, deleteReceipt: contextDeleteReceipt, refreshReceipts } = useHistory();
    const { showToast } = useToast();
    const [loadingMore, setLoadingMore] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedTab, setSelectedTab] = useState<'receipts' | 'owes'>('receipts');
    const [debtors, setDebtors] = useState<DebtorSummary[]>([]);
    const [debtorsLoading, setDebtorsLoading] = useState(false);

    // Maps receipt_id -> { settled: number; total: number }
    const [settlementMap, setSettlementMap] = useState<Map<string, { settled: number; total: number }>>(new Map());

    useEffect(() => {
        if (receipts.length === 0) return;
        const ids = receipts.map((r) => r.id);
        supabase
            .from('payment_requests')
            .select('receipt_id, status')
            .in('receipt_id', ids)
            .then(({ data }) => {
                if (!data) return;
                const map = new Map<string, { settled: number; total: number }>();
                for (const pr of data) {
                    if (!map.has(pr.receipt_id)) map.set(pr.receipt_id, { settled: 0, total: 0 });
                    const entry = map.get(pr.receipt_id)!;
                    entry.total++;
                    if (pr.status === 'settled') entry.settled++;
                }
                setSettlementMap(map);
            });
    }, [receipts]);

    const fetchDebtors = useCallback(async () => {
        if (!session?.user?.id) return;
        setDebtorsLoading(true);
        const { data, error } = await supabase
            .from('payment_requests')
            .select('amount, contact_id, contacts(contact_name, phone_number)')
            .eq('owner_id', session.user.id)
            .in('status', ['unpaid', 'requested', 'pending'])
            .limit(500);

        if (error || !data) { setDebtorsLoading(false); return; }

        const map = new Map<string, DebtorSummary>();
        for (const row of data as any[]) {
            const c = Array.isArray(row.contacts) ? row.contacts[0] : row.contacts;
            if (!c?.contact_name) continue;
            const existing = map.get(row.contact_id);
            if (existing) {
                existing.total += Number(row.amount);
                existing.receiptCount++;
            } else {
                map.set(row.contact_id, {
                    contactDbId: row.contact_id,
                    name: c.contact_name,
                    phone: c.phone_number || null,
                    total: Number(row.amount),
                    receiptCount: 1,
                });
            }
        }

        setDebtors(Array.from(map.values()).sort((a, b) => b.total - a.total));
        setDebtorsLoading(false);
    }, [session?.user?.id]);

    useFocusEffect(useCallback(() => { fetchDebtors(); }, [fetchDebtors]));

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await Promise.all([refreshReceipts(), fetchDebtors()]);
        setRefreshing(false);
    }, [fetchDebtors]);

    const handleLoadMore = async () => {
        if (!hasMore || loadingMore) return;
        setLoadingMore(true);
        await fetchReceipts(true);
        setLoadingMore(false);
    };

    const handleDelete = async (receiptId: string) => {
        try {
            await contextDeleteReceipt(receiptId);
        } catch (error) {
            showToast(getUserFacingErrorMessage(error, 'We could not delete that receipt right now.'), 'error');
        }
    };

    const renderRightActions = (receipt: Receipt) => (
        <TouchableOpacity
            style={styles.deleteAction}
            onPress={() => handleDelete(receipt.id)}
        >
            <MaterialIcons name="delete-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>History</Text>
            </View>

            <View style={styles.segmentWrapper}>
                <View style={styles.segmentedControl}>
                    <TouchableOpacity
                        style={[styles.segmentButton, selectedTab === 'receipts' && styles.segmentButtonActive]}
                        onPress={() => setSelectedTab('receipts')}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.segmentText, selectedTab === 'receipts' && styles.segmentTextActive]}>
                            Receipts
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.segmentButton, selectedTab === 'owes' && styles.segmentButtonActive]}
                        onPress={() => setSelectedTab('owes')}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.segmentText, selectedTab === 'owes' && styles.segmentTextActive]}>
                            Who Owes You
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

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
                {selectedTab === 'receipts' ? (
                    loading ? (
                        <HistorySkeleton />
                    ) : receipts.length === 0 ? (
                        <View style={styles.emptyState}>
                            <View style={styles.emptyIconWrap}>
                                <MaterialIcons name="receipt-long" size={28} color={C.gray400} />
                            </View>
                            <Text style={styles.emptyTitle}>No receipts yet</Text>
                            <Text style={styles.emptySubtitle}>Tap + to scan your first one</Text>
                        </View>
                    ) : (
                        <>
                            {receipts.map((receipt) => (
                                <Swipeable
                                    key={receipt.id}
                                    renderRightActions={() => renderRightActions(receipt)}
                                    rightThreshold={40}
                                >
                                    <View style={styles.cardWrapper}>
                                        <Pressable
                                            onPress={() => router.push(`/receipt/${receipt.id}`)}
                                            style={({ pressed }) => [
                                                styles.receiptCard,
                                                pressed && styles.receiptCardPressed,
                                            ]}
                                        >
                                            <View style={styles.accentBar} />
                                            <View style={styles.receiptContent}>
                                                <View style={styles.receiptIcon}>
                                                    <MaterialIcons name="receipt" size={18} color={C.green} />
                                                </View>
                                                <View style={styles.receiptInfo}>
                                                    <Text style={styles.receiptName} numberOfLines={1}>
                                                        {receipt.receipt_name}
                                                    </Text>
                                                    <Text style={styles.receiptMeta}>
                                                        {new Date(receipt.created_at).toLocaleDateString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            year: 'numeric',
                                                        })}
                                                    </Text>
                                                    {(() => {
                                                        const s = settlementMap.get(receipt.id);
                                                        if (!s || s.total === 0) return null;
                                                        const allPaid = s.settled === s.total;
                                                        const hasPending = s.settled > 0 && !allPaid;
                                                        return (
                                                            <View style={styles.settlementPill}>
                                                                <View style={[
                                                                    styles.settlementDot,
                                                                    { backgroundColor: allPaid ? C.green : hasPending ? colors.warning : C.gray300 },
                                                                ]} />
                                                                <Text style={[
                                                                    styles.settlementText,
                                                                    { color: allPaid ? C.green : C.gray400 },
                                                                ]}>
                                                                    {allPaid ? 'All paid' : `${s.settled}/${s.total} paid`}
                                                                </Text>
                                                            </View>
                                                        );
                                                    })()}
                                                </View>
                                                <Text style={styles.receiptAmount}>
                                                    ${(receipt.total_amount || 0).toFixed(2)}
                                                </Text>
                                            </View>
                                        </Pressable>
                                    </View>
                                </Swipeable>
                            ))}

                            {hasMore && (
                                <TouchableOpacity
                                    style={styles.loadMoreButton}
                                    onPress={handleLoadMore}
                                    disabled={loadingMore}
                                >
                                    <Text style={styles.loadMoreText}>
                                        {loadingMore ? 'Loading...' : 'Load more'}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </>
                    )
                ) : (
                    debtorsLoading ? (
                        <ActivityIndicator color={C.green} style={{ marginTop: spacing.xl }} />
                    ) : debtors.length === 0 ? (
                        <View style={styles.emptyState}>
                            <View style={styles.emptyIconWrap}>
                                <MaterialIcons name="check-circle-outline" size={28} color={C.gray400} />
                            </View>
                            <Text style={styles.emptyTitle}>All settled up</Text>
                            <Text style={styles.emptySubtitle}>No one owes you anything right now</Text>
                        </View>
                    ) : (
                        debtors.map((d) => (
                            <TouchableOpacity
                                key={d.contactDbId}
                                style={styles.debtorCard}
                                onPress={() => router.push({
                                    pathname: '/contact-debt/[contactDbId]' as any,
                                    params: {
                                        contactDbId: d.contactDbId,
                                        contactName: d.name,
                                        contactPhone: d.phone ?? '',
                                    },
                                })}
                                activeOpacity={0.7}
                            >
                                <View style={styles.debtorAvatar}>
                                    <Text style={styles.debtorAvatarText}>{d.name.charAt(0).toUpperCase()}</Text>
                                </View>
                                <View style={styles.debtorInfo}>
                                    <Text style={styles.debtorName}>{d.name}</Text>
                                    <Text style={styles.debtorMeta}>
                                        {d.receiptCount} receipt{d.receiptCount !== 1 ? 's' : ''}
                                    </Text>
                                </View>
                                <Text style={styles.debtorAmount}>${d.total.toFixed(2)}</Text>
                                <MaterialIcons name="chevron-right" size={20} color={C.gray400} />
                            </TouchableOpacity>
                        ))
                    )
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
