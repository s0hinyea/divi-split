import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as SMS from 'expo-sms';
import * as Haptics from 'expo-haptics';

import { supabase } from '@/lib/supabase';
import { useSession } from '@/utils/SessionContext';
import { useCustomAlert } from '@/components/CustomAlert';
import { useToast } from '@/components/ToastProvider';
import { getUserFacingErrorMessage } from '@/utils/network';
import { colors, fonts, fontSizes, spacing, radii } from '@/styles/theme';

type PaymentStatus = 'unpaid' | 'requested' | 'pending' | 'settled';

type DebtReceipt = {
    prId: string;
    receiptId: string;
    receiptName: string;
    createdAt: string;
    amount: number;
    status: PaymentStatus;
    token: string;
};

const STATUS_CONFIG: Record<PaymentStatus, { dot: string; label: string; labelColor: string }> = {
    unpaid:    { dot: colors.gray300, label: 'Unpaid',    labelColor: colors.gray400 },
    requested: { dot: colors.gray400, label: 'Requested', labelColor: colors.gray500 },
    pending:   { dot: colors.warning, label: 'Pending',   labelColor: colors.warning },
    settled:   { dot: colors.green,   label: 'Paid',      labelColor: colors.green   },
};

const buildPayUrl = (token: string) => {
    const base = (process.env.EXPO_PUBLIC_PAY_BASE_URL ?? '').replace(/\/$/, '');
    return `${base}?token=${token}`;
};

export default function ContactDebt() {
    const { contactDbId, contactName, contactPhone } = useLocalSearchParams<{
        contactDbId: string;
        contactName: string;
        contactPhone: string;
    }>();
    const router = useRouter();
    const { session } = useSession();
    const { showAlert } = useCustomAlert();
    const { showToast } = useToast();

    const [receipts, setReceipts] = useState<DebtReceipt[]>([]);
    const [loading, setLoading] = useState(true);
    const [actioning, setActioning] = useState<Set<string>>(new Set());
    const [requesting, setRequesting] = useState(false);
    const [markingAll, setMarkingAll] = useState(false);

    const fetchDebts = useCallback(async () => {
        if (!session?.user?.id || !contactDbId) return;
        const { data, error } = await supabase
            .from('payment_requests')
            .select('id, amount, status, token, receipt_id, receipts(receipt_name, created_at)')
            .eq('contact_id', contactDbId)
            .eq('owner_id', session.user.id)
            .order('created_at', { ascending: false });

        if (error || !data) { setLoading(false); return; }

        const items: DebtReceipt[] = (data as any[]).map((row) => {
            const r = Array.isArray(row.receipts) ? row.receipts[0] : row.receipts;
            return {
                prId: row.id,
                receiptId: row.receipt_id,
                receiptName: r?.receipt_name ?? 'Receipt',
                createdAt: r?.created_at ?? '',
                amount: Number(row.amount),
                status: row.status as PaymentStatus,
                token: row.token,
            };
        });

        setReceipts(items);
        setLoading(false);
    }, [contactDbId, session?.user?.id]);

    useEffect(() => { fetchDebts(); }, [fetchDebts]);

    const outstanding = receipts.filter((r) => r.status !== 'settled');
    const total = outstanding.reduce((s, r) => s + r.amount, 0);
    const settledCount = receipts.filter((r) => r.status === 'settled').length;
    const allSettled = receipts.length > 0 && outstanding.length === 0;

    const handleMarkPaid = async (pr: DebtReceipt) => {
        setActioning((prev) => new Set(prev).add(pr.prId));
        try {
            const { error } = await supabase
                .from('payment_requests')
                .update({ status: 'settled', settled_at: new Date().toISOString() })
                .eq('id', pr.prId);
            if (error) throw error;
            setReceipts((prev) => prev.map((r) => r.prId === pr.prId ? { ...r, status: 'settled' as PaymentStatus } : r));
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (err) {
            showToast(getUserFacingErrorMessage(err, 'Could not update payment status.'), 'error');
        } finally {
            setActioning((prev) => { const next = new Set(prev); next.delete(pr.prId); return next; });
        }
    };

    const handleMarkUnpaid = async (pr: DebtReceipt) => {
        setActioning((prev) => new Set(prev).add(pr.prId));
        try {
            const { error } = await supabase
                .from('payment_requests')
                .update({ status: 'unpaid', settled_at: null })
                .eq('id', pr.prId);
            if (error) throw error;
            setReceipts((prev) => prev.map((r) => r.prId === pr.prId ? { ...r, status: 'unpaid' as PaymentStatus } : r));
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch (err) {
            showToast(getUserFacingErrorMessage(err, 'Could not update payment status.'), 'error');
        } finally {
            setActioning((prev) => { const next = new Set(prev); next.delete(pr.prId); return next; });
        }
    };

    const handleMarkAllPaid = () => {
        if (outstanding.length === 0) return;
        showAlert({
            title: 'Mark all as paid?',
            message: `This will mark all ${outstanding.length} receipt${outstanding.length !== 1 ? 's' : ''} as settled for ${contactName}.`,
            buttons: [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Mark All Paid',
                    onPress: async () => {
                        setMarkingAll(true);
                        try {
                            const ids = outstanding.map((r) => r.prId);
                            const { error } = await supabase
                                .from('payment_requests')
                                .update({ status: 'settled', settled_at: new Date().toISOString() })
                                .in('id', ids);
                            if (error) throw error;
                            setReceipts((prev) =>
                                prev.map((r) => ids.includes(r.prId) ? { ...r, status: 'settled' as PaymentStatus } : r)
                            );
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        } catch (err) {
                            showToast(getUserFacingErrorMessage(err, 'Could not update payments.'), 'error');
                        } finally {
                            setMarkingAll(false);
                        }
                    },
                },
            ],
        });
    };

    const handleRequestPayment = async () => {
        if (outstanding.length === 0) return;
        setRequesting(true);
        try {
            const updateResults = await Promise.all(
                outstanding.map((r) =>
                    supabase
                        .from('payment_requests')
                        .update({ status: 'requested', requested_at: new Date().toISOString() })
                        .eq('id', r.prId)
                        .select('id, token')
                        .single()
                )
            );

            setReceipts((prev) =>
                prev.map((r) => {
                    const isOutstanding = outstanding.some((o) => o.prId === r.prId);
                    return isOutstanding ? { ...r, status: 'requested' as PaymentStatus } : r;
                })
            );

            const allTokens = outstanding.map((r, i) => updateResults[i]?.data?.token ?? r.token);
            const base = (process.env.EXPO_PUBLIC_PAY_BASE_URL ?? '').replace(/\/$/, '');
            const aggregateUrl = allTokens.length === 1
                ? `${base}?token=${allTokens[0]}`
                : `${base}?tokens=${allTokens.join(',')}`;

            const message = `Hey ${contactName}, you owe me $${total.toFixed(2)} across ${outstanding.length} receipt${outstanding.length !== 1 ? 's' : ''}. Pay here: ${aggregateUrl}`;

            const phone = contactPhone && contactPhone !== 'no-phone' && contactPhone !== '' ? contactPhone : null;
            if (phone) {
                await SMS.sendSMSAsync([phone], message);
            } else {
                await Share.share({ message });
            }
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch (err) {
            showToast(getUserFacingErrorMessage(err, 'Could not send payment request.'), 'error');
        } finally {
            setRequesting(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.headerContainer}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={28} color={colors.black} />
                </TouchableOpacity>
                <View style={styles.headerText}>
                    <Text style={styles.headerTitle}>{contactName}</Text>
                    {!loading && (
                        <Text style={styles.headerSubtitle}>
                            {allSettled ? 'All settled up' : `$${total.toFixed(2)} outstanding`}
                        </Text>
                    )}
                </View>
                {!loading && !allSettled && (
                    <View style={styles.totalBadge}>
                        <Text style={styles.totalBadgeText}>${total.toFixed(2)}</Text>
                    </View>
                )}
            </View>

            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
                {loading ? (
                    <ActivityIndicator color={colors.green} style={{ marginTop: spacing.xl }} />
                ) : receipts.length === 0 ? (
                    <View style={styles.emptyState}>
                        <MaterialIcons name="check-circle-outline" size={40} color={colors.gray300} />
                        <Text style={styles.emptyTitle}>Nothing owed</Text>
                        <Text style={styles.emptySubtitle}>No payment requests found for {contactName}</Text>
                    </View>
                ) : (
                    <>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Receipts</Text>
                            <Text style={[styles.sectionCount, { color: allSettled ? colors.green : colors.gray400 }]}>
                                {allSettled ? 'All paid' : `${settledCount}/${receipts.length} paid`}
                            </Text>
                        </View>

                        {receipts.map((pr) => {
                            const cfg = STATUS_CONFIG[pr.status];
                            const isLoading = actioning.has(pr.prId);
                            const isSettled = pr.status === 'settled';

                            return (
                                <View key={pr.prId} style={[styles.receiptCard, isSettled && styles.receiptCardSettled]}>
                                    <View style={styles.receiptCardHeader}>
                                        <View style={styles.receiptNameRow}>
                                            <View style={[styles.statusDot, { backgroundColor: cfg.dot }]} />
                                            <View style={{ flex: 1 }}>
                                                <Text style={[styles.receiptName, isSettled && styles.textMuted]} numberOfLines={1}>
                                                    {pr.receiptName}
                                                </Text>
                                                {pr.createdAt ? (
                                                    <Text style={styles.receiptDate}>
                                                        {new Date(pr.createdAt).toLocaleDateString('en-US', {
                                                            month: 'short', day: 'numeric', year: 'numeric',
                                                        })}
                                                    </Text>
                                                ) : null}
                                            </View>
                                        </View>
                                        <View style={styles.amountCol}>
                                            <Text style={[styles.receiptAmount, isSettled && styles.textMuted]}>
                                                ${pr.amount.toFixed(2)}
                                            </Text>
                                            <Text style={[styles.statusLabel, { color: cfg.labelColor }]}>
                                                {cfg.label}{isSettled ? ' ✓' : ''}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.divider} />

                                    <View style={styles.actionRow}>
                                        {isLoading ? (
                                            <ActivityIndicator size="small" color={colors.green} />
                                        ) : isSettled ? (
                                            <TouchableOpacity
                                                onPress={() => handleMarkUnpaid(pr)}
                                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                            >
                                                <Text style={styles.undoText}>Undo</Text>
                                            </TouchableOpacity>
                                        ) : (
                                            <TouchableOpacity
                                                onPress={() => handleMarkPaid(pr)}
                                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                            >
                                                <Text style={styles.markPaidText}>Mark Paid</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>
                            );
                        })}
                    </>
                )}
            </ScrollView>

            {!loading && receipts.length > 0 && !allSettled && (
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={styles.markAllButton}
                        onPress={handleMarkAllPaid}
                        disabled={markingAll}
                        activeOpacity={0.7}
                    >
                        {markingAll ? (
                            <ActivityIndicator size="small" color={colors.black} />
                        ) : (
                            <Text style={styles.markAllButtonText}>Mark All Paid</Text>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.requestButton}
                        onPress={handleRequestPayment}
                        disabled={requesting}
                        activeOpacity={0.7}
                    >
                        {requesting ? (
                            <ActivityIndicator size="small" color={colors.white} />
                        ) : (
                            <>
                                <MaterialIcons name="send" size={18} color={colors.white} />
                                <Text style={styles.requestButtonText}>Request ${total.toFixed(2)}</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.gray100 },

    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
        paddingBottom: spacing.md,
    },
    backButton: { marginRight: spacing.md },
    headerText: { flex: 1 },
    headerTitle: {
        fontFamily: fonts.bodyBold,
        fontSize: fontSizes.xl,
        color: colors.black,
    },
    headerSubtitle: {
        fontFamily: fonts.body,
        fontSize: fontSizes.xs,
        color: colors.gray500,
        marginTop: 2,
    },
    totalBadge: {
        backgroundColor: `${colors.green}18`,
        borderRadius: radii.full,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
    },
    totalBadgeText: {
        fontFamily: fonts.bodyBold,
        fontSize: fontSizes.sm,
        color: colors.green,
    },

    scroll: { flex: 1 },
    scrollContent: {
        paddingHorizontal: spacing.lg,
        paddingBottom: 120,
    },

    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: spacing.md,
        marginBottom: spacing.sm,
    },
    sectionTitle: {
        fontFamily: fonts.bodySemiBold,
        fontSize: fontSizes.xs,
        color: colors.gray500,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
    },
    sectionCount: {
        fontFamily: fonts.bodySemiBold,
        fontSize: fontSizes.xs,
        letterSpacing: 0.4,
    },

    receiptCard: {
        backgroundColor: colors.white,
        borderRadius: radii.md,
        paddingHorizontal: spacing.md,
        paddingTop: spacing.md,
        paddingBottom: spacing.sm,
        marginBottom: spacing.sm,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    receiptCardSettled: {
        opacity: 0.6,
    },
    receiptCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.xs,
    },
    receiptNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        flex: 1,
        marginRight: spacing.md,
    },
    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginTop: 3,
        flexShrink: 0,
    },
    receiptName: {
        fontFamily: fonts.bodySemiBold,
        fontSize: fontSizes.md,
        color: colors.black,
    },
    receiptDate: {
        fontFamily: fonts.body,
        fontSize: fontSizes.xs,
        color: colors.gray400,
        marginTop: 2,
    },
    amountCol: {
        alignItems: 'flex-end',
    },
    receiptAmount: {
        fontFamily: fonts.bodyBold,
        fontSize: fontSizes.md,
        color: colors.green,
    },
    statusLabel: {
        fontFamily: fonts.bodyMedium,
        fontSize: fontSizes.xs,
        marginTop: 2,
    },
    textMuted: {
        color: colors.gray400,
    },
    divider: {
        height: 1,
        backgroundColor: colors.gray200,
        marginVertical: spacing.xs,
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingTop: spacing.xs,
    },
    markPaidText: {
        fontFamily: fonts.bodyMedium,
        fontSize: fontSizes.xs,
        color: colors.gray400,
        paddingVertical: 6,
    },
    undoText: {
        fontFamily: fonts.bodyMedium,
        fontSize: fontSizes.xs,
        color: colors.gray400,
        paddingVertical: 6,
    },

    emptyState: {
        alignItems: 'center',
        paddingVertical: spacing.xxxl,
        gap: spacing.sm,
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
        textAlign: 'center',
    },

    footer: {
        flexDirection: 'row',
        padding: spacing.lg,
        gap: spacing.md,
        backgroundColor: colors.white,
        borderTopWidth: 1,
        borderTopColor: colors.gray200,
    },
    markAllButton: {
        flex: 1,
        height: 52,
        borderRadius: radii.xl,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: colors.gray300,
    },
    markAllButtonText: {
        fontFamily: fonts.bodySemiBold,
        fontSize: fontSizes.md,
        color: colors.gray600,
    },
    requestButton: {
        flex: 1,
        flexDirection: 'row',
        height: 52,
        borderRadius: radii.xl,
        justifyContent: 'center',
        alignItems: 'center',
        gap: spacing.xs,
        backgroundColor: colors.black,
        shadowColor: colors.green,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    requestButtonText: {
        fontFamily: fonts.bodySemiBold,
        fontSize: fontSizes.md,
        color: colors.white,
    },
});
