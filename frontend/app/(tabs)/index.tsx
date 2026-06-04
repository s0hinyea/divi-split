import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { useFocusEffect } from 'expo-router';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import Svg, { Circle, Rect } from 'react-native-svg';
import { fonts, fontSizes, spacing, colors, radii } from '@/styles/theme';
import { useThemeColors } from '@/utils/ThemeContext';
import ReceiptCard from '@/components/ReceiptCard';
import { useHistory } from '@/utils/HistoryContext';
import { useProfile } from '@/utils/ProfileContext';
import { useSession } from '@/utils/SessionContext';
import { DashboardSkeleton } from '@/components/SkeletonLoader';
import { useSplitStore } from '@/stores/splitStore';
import { useCustomAlert } from '@/components/CustomAlert';
import { supabase } from '@/lib/supabase';

type Debtor = { name: string; total: number };

function DiviLogo({ size = 32 }: { size?: number }) {
    const C = useThemeColors();
    const scale = size / 160;
    return (
        <Svg width={120 * scale} height={160 * scale} viewBox="0 0 120 160" fill="none">
            <Circle cx="20" cy="80" r="8" fill={C.green} />
            <Rect x="40" y="30" width="10" height="100" rx="5" fill={C.green} />
            <Rect x="70" y="30" width="10" height="100" rx="5" fill={C.black} />
            <Circle cx="100" cy="80" r="8" fill={C.black} />
        </Svg>
    );
}


function ReceiptLines({ color }: { color: string }) {
    return (
        <View style={styles.receiptLines}>
            <View style={[styles.receiptLine, { width: '70%', backgroundColor: color }]} />
            <View style={[styles.receiptLine, { width: '45%', backgroundColor: color }]} />
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
            padding: spacing.md,
            paddingBottom: 100,
        },

        greeting: {
            fontFamily: fonts.body,
            fontSize: fontSizes.sm,
            color: C.gray500,
            marginTop: spacing.sm,
        },
        userName: {
            fontFamily: fonts.bodyBold,
            fontSize: fontSizes.xl,
            color: C.black,
            marginBottom: spacing.md,
            letterSpacing: -0.5,
        },

        // Stat cards row
        statRow: {
            flexDirection: 'row',
            alignItems: 'stretch',
            marginBottom: spacing.md,
        },
        statCard: { flex: 1 },
        statSpacer: { width: spacing.sm },
        flippedCard: { transform: [{ scaleX: -1 }] },
        flippedContent: { transform: [{ scaleX: -1 }] },

        statAmount: {
            fontFamily: fonts.bodySemiBold,
            fontSize: fontSizes.xl,
            color: C.green,
            marginBottom: 2,
        },
        statLabel: {
            fontFamily: fonts.body,
            fontSize: fontSizes.xs,
            color: C.gray600,
            marginBottom: spacing.xs,
        },

        // Recent splits card
        recentCard: { width: '100%' },
        recentHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: spacing.sm,
        },
        recentTitle: {
            fontFamily: fonts.bodyBold,
            fontSize: fontSizes.md,
            color: C.black,
        },
        viewAllText: {
            fontFamily: fonts.bodySemiBold,
            fontSize: fontSizes.xs,
            color: C.green,
        },

        receiptRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: spacing.sm,
        },
        receiptRowBorder: {
            borderBottomWidth: 1,
            borderBottomColor: C.gray200,
        },
        receiptRowLeft: { flex: 1 },
        receiptName: {
            fontFamily: fonts.bodySemiBold,
            fontSize: fontSizes.sm,
            color: C.black,
        },
        receiptDate: {
            fontFamily: fonts.body,
            fontSize: fontSizes.xs,
            color: C.gray600,
            marginTop: 1,
        },
        receiptAmount: {
            fontFamily: fonts.bodySemiBold,
            fontSize: fontSizes.md,
            color: C.green,
        },

        emptyState: {
            alignItems: 'center',
            paddingVertical: spacing.md,
            gap: spacing.xs,
        },
        emptyTitle: {
            fontFamily: fonts.bodySemiBold,
            fontSize: fontSizes.sm,
            color: C.gray600,
        },
        emptySubtitle: {
            fontFamily: fonts.body,
            fontSize: fontSizes.xs,
            color: C.gray400,
        },
    });
}

const styles = StyleSheet.create({
    receiptLines: { gap: 4, marginTop: spacing.xs },
    receiptLine: { height: 2, borderRadius: 1 },

    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    logoLockup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    logoText: {
        fontFamily: fonts.bodyBold,
        fontSize: fontSizes.xl,
        letterSpacing: -0.5,
    },
    sectionUnderline: {
        height: 2,
        backgroundColor: colors.green,
        borderRadius: 1,
        marginTop: 2,
    },
    debtorAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: `${colors.green}20`,
        justifyContent: 'center',
        alignItems: 'center',
    },
    debtorAvatarText: {
        fontFamily: fonts.bodyBold,
        fontSize: fontSizes.xs,
        color: colors.green,
    },
    resumeBanner: {
        flexDirection: 'row',
        backgroundColor: colors.white,
        borderRadius: radii.md,
        marginBottom: spacing.lg,
        overflow: 'hidden',
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 8,
        elevation: 3,
    },
    resumeBannerAccent: {
        width: 4,
        backgroundColor: colors.green,
    },
    placeholderAvatar: {
        backgroundColor: colors.gray200,
    },
    placeholderBar: {
        height: 10,
        width: 120,
        borderRadius: 5,
        backgroundColor: colors.gray200,
    },
    resumeBannerBody: {
        flex: 1,
        padding: spacing.md,
        gap: spacing.xs,
    },
    resumeBannerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    resumeBannerTitle: {
        fontFamily: fonts.bodyBold,
        fontSize: fontSizes.sm,
        color: colors.black,
        flex: 1,
    },
    resumeStepPill: {
        backgroundColor: colors.gray100,
        borderRadius: radii.full,
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
    },
    resumeStepText: {
        fontFamily: fonts.body,
        fontSize: fontSizes.xs,
        color: colors.gray500,
    },
    resumeBannerSubtitle: {
        fontFamily: fonts.body,
        fontSize: fontSizes.xs,
        color: colors.gray500,
        marginBottom: spacing.xs,
    },
    resumeBannerActions: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginTop: spacing.xs,
    },
    resumeButton: {
        flex: 1,
        backgroundColor: colors.black,
        borderRadius: radii.full,
        paddingVertical: spacing.sm,
        alignItems: 'center',
    },
    resumeButtonText: {
        fontFamily: fonts.bodySemiBold,
        fontSize: fontSizes.sm,
        color: colors.white,
    },
    discardButton: {
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: radii.full,
        borderWidth: 1,
        borderColor: colors.gray300,
        alignItems: 'center',
    },
    discardButtonText: {
        fontFamily: fonts.bodySemiBold,
        fontSize: fontSizes.sm,
        color: colors.gray500,
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

    const currentStep = useSplitStore((state) => state.currentStep);
    const resumeContactIndex = useSplitStore((state) => state.resumeContactIndex);
    const receiptItems = useSplitStore((state) => state.receiptData.items);
    const resetStore = useSplitStore((state) => state.resetStore);
    const { showAlert } = useCustomAlert();

    const splitInProgress = currentStep !== null && receiptItems.length > 0;

    const [topDebtors, setTopDebtors] = useState<Debtor[]>([]);

    const fetchTopDebtors = useCallback(async () => {
        if (!session?.user?.id) return;
        const { data, error } = await supabase
            .from('payment_requests')
            .select('amount, contacts(contact_name)')
            .eq('owner_id', session.user.id)
            .in('status', ['unpaid', 'requested', 'pending']);
        if (error || !data) return;
        const totals: Record<string, number> = {};
        for (const row of data as any[]) {
            const c = Array.isArray(row.contacts) ? row.contacts[0] : row.contacts;
            const name = c?.contact_name;
            if (!name) continue;
            totals[name] = (totals[name] ?? 0) + Number(row.amount);
        }
        const sorted = Object.entries(totals)
            .map(([name, total]) => ({ name, total }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 3);
        setTopDebtors(sorted);
    }, [session?.user?.id]);

    useFocusEffect(useCallback(() => { fetchTopDebtors(); }, [fetchTopDebtors]));

    const STEP_LABELS: Record<string, string> = {
        contacts: 'Selecting contacts',
        result: 'Editing items',
        assign: 'Assigning items',
        review: 'Reviewing',
    };

    const resumeSplit = () => {
        if (!currentStep) return;
        if (currentStep === 'assign') {
            router.push({ pathname: '/assign', params: { initialIndex: resumeContactIndex } });
        } else {
            router.push(`/${currentStep}` as any);
        }
    };

    const discardSplit = () => {
        showAlert({
            title: 'Discard split?',
            message: 'Your in-progress split will be lost.',
            buttons: [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Discard', style: 'destructive', onPress: resetStore },
            ],
        });
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await Promise.all([refreshReceipts(), refreshProfile(), fetchTopDebtors()]);
        setRefreshing(false);
    }, [fetchTopDebtors]);

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

    const recentTwo = receipts.slice(0, 3);
    const totalString = monthlyTotal.toFixed(0);
    const totalFontSize = totalString.length > 5 ? fontSizes.lg : fontSizes.xxl;

    return (
        <SafeAreaView style={themed.container}>
            <ScrollView
                contentContainerStyle={themed.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.green} />
                }
            >
                <View style={styles.headerRow}>
                    <View>
                        <Text style={themed.greeting}>{getGreeting()},</Text>
                        <Text style={themed.userName}>{getUserName()}.</Text>
                    </View>
                    <View style={styles.logoLockup}>
                        <DiviLogo size={32} />
                        <Text style={styles.logoText}>
                            <Text style={{ color: C.black }}>D</Text>
                            <Text style={{ color: C.green }}>i</Text>
                            <Text style={{ color: C.black }}>v</Text>
                            <Text style={{ color: C.green }}>i</Text>
                        </Text>
                    </View>
                </View>

                {/* Resume in-progress split banner */}
                {splitInProgress && (
                    <View style={styles.resumeBanner}>
                        <View style={styles.resumeBannerAccent} />
                        <View style={styles.resumeBannerBody}>
                            <View style={styles.resumeBannerTop}>
                                <MaterialIcons name="schedule" size={18} color={colors.green} />
                                <Text style={styles.resumeBannerTitle}>Split in progress</Text>
                                <View style={styles.resumeStepPill}>
                                    <Text style={styles.resumeStepText}>
                                        {currentStep ? STEP_LABELS[currentStep] : ''}
                                    </Text>
                                </View>
                            </View>
                            <Text style={styles.resumeBannerSubtitle}>
                                Tap Resume to pick up where you left off.
                            </Text>
                            <View style={styles.resumeBannerActions}>
                                <TouchableOpacity
                                    style={styles.resumeButton}
                                    onPress={resumeSplit}
                                    activeOpacity={0.85}
                                >
                                    <Text style={styles.resumeButtonText}>Resume</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.discardButton}
                                    onPress={discardSplit}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.discardButtonText}>Discard</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}

                {/* Stat cards */}
                <View style={[themed.statRow, { marginTop: spacing.md }]}>
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

                {/* Pending balances */}
                <ReceiptCard style={themed.recentCard} showTopZigzag={true} showBottomZigzag={false}>
                    <View style={themed.recentHeader}>
                        <View>
                            <Text style={themed.recentTitle}>Most Owed</Text>
                            <View style={styles.sectionUnderline} />
                        </View>
                        {topDebtors.length > 0 && (
                            <TouchableOpacity onPress={() => router.push('/(tabs)/history')}>
                                <Text style={themed.viewAllText}>View all →</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    {Array.from({ length: 3 }).map((_, i) => {
                        const d = topDebtors[i];
                        return d ? (
                            <View
                                key={d.name}
                                style={[themed.receiptRow, i < 2 && themed.receiptRowBorder]}
                            >
                                <View style={styles.debtorAvatar}>
                                    <Text style={styles.debtorAvatarText}>{d.name.charAt(0).toUpperCase()}</Text>
                                </View>
                                <Text style={[themed.receiptName, { flex: 1, marginLeft: spacing.md }]}>{d.name}</Text>
                                <Text style={themed.receiptAmount}>${d.total.toFixed(2)}</Text>
                            </View>
                        ) : (
                            <View key={`empty-debtor-${i}`} style={[themed.receiptRow, i < 2 && themed.receiptRowBorder]}>
                                <View style={[styles.debtorAvatar, styles.placeholderAvatar]} />
                                <View style={[styles.placeholderBar, { marginLeft: spacing.md }]} />
                            </View>
                        );
                    })}
                </ReceiptCard>

                {/* Recent splits */}
                <ReceiptCard style={[themed.recentCard, { marginTop: spacing.md }]} showTopZigzag={false} showBottomZigzag={true}>
                    <View style={themed.recentHeader}>
                        <View>
                            <Text style={themed.recentTitle}>Recent Splits</Text>
                            <View style={styles.sectionUnderline} />
                        </View>
                        {recentTwo.length > 0 && (
                            <TouchableOpacity onPress={() => router.push('/(tabs)/history')}>
                                <Text style={themed.viewAllText}>View all →</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {loading ? (
                        <DashboardSkeleton />
                    ) : (
                        Array.from({ length: 3 }).map((_, i) => {
                            const receipt = recentTwo[i];
                            return receipt ? (
                                <TouchableOpacity
                                    key={receipt.id}
                                    style={[themed.receiptRow, i < 2 && themed.receiptRowBorder]}
                                    onPress={() => router.push(`/receipt/${receipt.id}`)}
                                    activeOpacity={0.7}
                                >
                                    <View style={themed.receiptRowLeft}>
                                        <Text style={themed.receiptName}>{receipt.receipt_name}</Text>
                                        <Text style={themed.receiptDate}>
                                            {new Date(receipt.created_at).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                            })}
                                            {receipt.receipt_items && ` · ${receipt.receipt_items.length} items`}
                                        </Text>
                                    </View>
                                    <Text style={themed.receiptAmount}>
                                        ${(receipt.total_amount || 0).toFixed(2)}
                                    </Text>
                                </TouchableOpacity>
                            ) : (
                                <View key={`empty-receipt-${i}`} style={[themed.receiptRow, i < 2 && themed.receiptRowBorder]}>
                                    <View style={themed.receiptRowLeft}>
                                        <View style={styles.placeholderBar} />
                                        <View style={[styles.placeholderBar, { width: 80, marginTop: 5 }]} />
                                    </View>
                                </View>
                            );
                        })
                    )}
                </ReceiptCard>
            </ScrollView>
        </SafeAreaView>
    );
}
