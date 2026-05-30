import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect, useCallback, useMemo } from 'react';
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
import { useHistory } from '@/utils/HistoryContext';
import { useProfile } from '@/utils/ProfileContext';
import { useSession } from '@/utils/SessionContext';
import { useSplitStore, ReceiptItem, Contact } from '@/stores/splitStore';
import { allocateAmount } from '@/utils/mathUtil';
import { getUserFacingErrorMessage } from '@/utils/network';
import { colors, fonts, fontSizes, spacing, radii } from '@/styles/theme';
import { useToast } from '@/components/ToastProvider';
import { useCustomAlert } from '@/components/CustomAlert';

type DbItem = { id: string; item_name: string; item_price: number };

type ContactBreakdown = {
    id: string;
    dbId: string;
    name: string;
    phoneNumber: string;
    items: DbItem[];
};

type PaymentStatus = 'unpaid' | 'requested' | 'pending' | 'settled';

type PaymentRequest = {
    id: string;
    status: PaymentStatus;
    settled_at: string | null;
    amount: number;
    token: string;
};

// Constructs the pay page URL using the same Supabase project as the app.
// Phase 4 will host the Edge Function at this path.
const buildPayUrl = (token: string) => {
    const base = (process.env.EXPO_PUBLIC_PAY_BASE_URL ?? '').replace(/\/$/, '');
    return `${base}?token=${token}`;
};

const STATUS_CONFIG: Record<PaymentStatus, { dot: string; label: string; labelColor: string }> = {
    unpaid:    { dot: colors.gray300,   label: 'Unpaid',   labelColor: colors.gray400   },
    requested: { dot: colors.gray400,   label: 'Requested', labelColor: colors.gray500  },
    pending:   { dot: colors.warning,   label: 'Pending',  labelColor: colors.warning   },
    settled:   { dot: colors.green,     label: 'Paid',     labelColor: colors.green     },
};

export default function ReceiptDetail() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { receipts } = useHistory();
    const { profile } = useProfile();
    const { session } = useSession();
    const { showToast } = useToast();
    const { showAlert } = useCustomAlert();
    const resetStore = useSplitStore((s) => s.resetStore);
    const hydrateForEdit = useSplitStore((s) => s.hydrateForEdit);

    const receipt = receipts.find((r) => r.id === id) ?? null;

    const [contacts, setContacts] = useState<ContactBreakdown[]>([]);
    const [unassignedItems, setUnassignedItems] = useState<DbItem[]>([]);
    const [loadingAssignments, setLoadingAssignments] = useState(true);
    const [editLoading, setEditLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [paymentRequests, setPaymentRequests] = useState<Map<string, PaymentRequest>>(new Map());
    const [markingPaid, setMarkingPaid] = useState<Set<string>>(new Set());

    const fetchAssignments = useCallback(async () => {
        if (!receipt) return;
        const itemIds = receipt.receipt_items.map((i) => i.id);
        if (itemIds.length === 0) {
            setLoadingAssignments(false);
            return;
        }
        try {
            const [assignmentRes, paymentRes] = await Promise.all([
                supabase
                    .from('assignments')
                    .select(`
                        item_id,
                        contacts (
                            id,
                            contact_name,
                            phone_number,
                            contact_id
                        )
                    `)
                    .in('item_id', itemIds),
                supabase
                    .from('payment_requests')
                    .select('id, contact_id, status, settled_at, amount, token')
                    .eq('receipt_id', receipt.id),
            ]);

            if (assignmentRes.error) throw assignmentRes.error;

            const contactMap = new Map<string, ContactBreakdown>();
            const assignedIds = new Set<string>();

            for (const row of (assignmentRes.data as any[]) || []) {
                const c = Array.isArray(row.contacts) ? row.contacts[0] : row.contacts;
                if (!c) continue;

                assignedIds.add(row.item_id);

                if (!contactMap.has(c.id)) {
                    contactMap.set(c.id, {
                        id: c.contact_id || c.id,
                        dbId: c.id,
                        name: c.contact_name,
                        phoneNumber: c.phone_number,
                        items: [],
                    });
                }

                const item = receipt.receipt_items.find((i) => i.id === row.item_id);
                if (item) contactMap.get(c.id)!.items.push(item);
            }

            setContacts(Array.from(contactMap.values()));
            setUnassignedItems(receipt.receipt_items.filter((i) => !assignedIds.has(i.id)));

            const prMap = new Map<string, PaymentRequest>();
            for (const pr of (paymentRes.data || [])) {
                prMap.set(pr.contact_id, {
                    id: pr.id,
                    status: pr.status as PaymentStatus,
                    settled_at: pr.settled_at,
                    amount: pr.amount,
                    token: pr.token,
                });
            }
            setPaymentRequests(prMap);
        } catch (err) {
            console.error('Failed to fetch assignments:', err);
        } finally {
            setLoadingAssignments(false);
        }
    }, [receipt]);

    useEffect(() => {
        fetchAssignments();
    }, [fetchAssignments]);

    // Per-contact totals with tax + tip allocated proportionally
    const { contactTotals, contactTaxes, contactTips } = useMemo(() => {
        if (!receipt || contacts.length === 0) return {
            contactTotals: new Map<string, number>(),
            contactTaxes: {} as Record<string, number>,
            contactTips: {} as Record<string, number>,
        };

        const shares = contacts.map((c) => ({
            id: c.dbId,
            share: c.items.reduce((s, i) => s + i.item_price, 0),
        }));
        if (unassignedItems.length > 0) {
            shares.push({
                id: 'user',
                share: unassignedItems.reduce((s, i) => s + i.item_price, 0),
            });
        }

        const individualTaxes = allocateAmount(receipt.tax_amount || 0, shares);
        const individualTips =
            (receipt.tip_amount || 0) > 0
                ? allocateAmount(receipt.tip_amount, shares.map((s) => ({ ...s, share: 1 })))
                : ({} as Record<string, number>);

        const totals = new Map<string, number>();
        for (const c of contacts) {
            const meal = c.items.reduce((s, i) => s + i.item_price, 0);
            totals.set(c.dbId, meal + (individualTaxes[c.dbId] || 0) + (individualTips[c.dbId] || 0));
        }
        return { contactTotals: totals, contactTaxes: individualTaxes, contactTips: individualTips };
    }, [contacts, unassignedItems, receipt]);

    const settledCount = contacts.filter(
        (c) => paymentRequests.get(c.dbId)?.status === 'settled'
    ).length;
    const allSettled = contacts.length > 0 && settledCount === contacts.length;

    const handleMarkPaid = async (contact: ContactBreakdown) => {
        if (!receipt || !session?.user) return;
        const amount = contactTotals.get(contact.dbId) || 0;

        setMarkingPaid((prev) => new Set(prev).add(contact.dbId));
        try {
            const { data, error } = await supabase
                .from('payment_requests')
                .upsert(
                    {
                        receipt_id: receipt.id,
                        contact_id: contact.dbId,
                        owner_id: session.user.id,
                        amount,
                        items: contact.items.map((i) => ({
                            name: i.item_name,
                            price: i.item_price,
                        })),
                        status: 'settled',
                        settled_at: new Date().toISOString(),
                    },
                    { onConflict: 'receipt_id,contact_id' }
                )
                .select('id, status, settled_at, amount, token')
                .single();

            if (error) throw error;

            setPaymentRequests((prev) => {
                const next = new Map(prev);
                next.set(contact.dbId, {
                    id: data.id,
                    status: 'settled',
                    settled_at: data.settled_at,
                    amount: data.amount,
                    token: data.token,
                });
                return next;
            });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (err) {
            showToast(getUserFacingErrorMessage(err, 'Could not update payment status.'), 'error');
        } finally {
            setMarkingPaid((prev) => {
                const next = new Set(prev);
                next.delete(contact.dbId);
                return next;
            });
        }
    };

    const handleMarkUnpaid = async (contact: ContactBreakdown) => {
        const existing = paymentRequests.get(contact.dbId);
        if (!existing) return;

        setMarkingPaid((prev) => new Set(prev).add(contact.dbId));
        try {
            const { error } = await supabase
                .from('payment_requests')
                .update({ status: 'unpaid', settled_at: null })
                .eq('id', existing.id);

            if (error) throw error;

            setPaymentRequests((prev) => {
                const next = new Map(prev);
                next.set(contact.dbId, { ...existing, status: 'unpaid', settled_at: null });
                return next;
            });
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch (err) {
            showToast(getUserFacingErrorMessage(err, 'Could not update payment status.'), 'error');
        } finally {
            setMarkingPaid((prev) => {
                const next = new Set(prev);
                next.delete(contact.dbId);
                return next;
            });
        }
    };

    const handleMarkAllPaid = () => {
        showAlert({
            title: 'Mark everyone as paid?',
            message: 'This will mark all people on this receipt as settled.',
            buttons: [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Mark All Paid',
                    onPress: () => {
                        const unpaid = contacts.filter(
                            (c) => paymentRequests.get(c.dbId)?.status !== 'settled'
                        );
                        unpaid.forEach((c) => handleMarkPaid(c));
                    },
                },
            ],
        });
    };

    const handleRequestPayment = async (contact: ContactBreakdown) => {
        if (!receipt || !session?.user) return;
        const amount = contactTotals.get(contact.dbId) || 0;

        setMarkingPaid((prev) => new Set(prev).add(contact.dbId));
        try {
            const { data, error } = await supabase
                .from('payment_requests')
                .upsert(
                    {
                        receipt_id: receipt.id,
                        contact_id: contact.dbId,
                        owner_id: session.user.id,
                        amount,
                        items: [
                            ...contact.items.map((i) => ({ name: i.item_name, price: i.item_price })),
                            ...((contactTaxes[contact.dbId] || 0) > 0 ? [{ name: 'Tax', price: contactTaxes[contact.dbId] }] : []),
                            ...((contactTips[contact.dbId] || 0) > 0 ? [{ name: 'Tip', price: contactTips[contact.dbId] }] : []),
                        ],
                        status: 'requested',
                        requested_at: new Date().toISOString(),
                    },
                    { onConflict: 'receipt_id,contact_id' }
                )
                .select('id, status, settled_at, amount, token')
                .single();

            if (error) throw error;

            setPaymentRequests((prev) => {
                const next = new Map(prev);
                next.set(contact.dbId, {
                    id: data.id,
                    status: 'requested',
                    settled_at: null,
                    amount: data.amount,
                    token: data.token,
                });
                return next;
            });

            const url = buildPayUrl(data.token);
            const receiptName = receipt.receipt_name.trim() || 'the bill';
            const message = `Hey ${contact.name}, I covered ${receiptName}. You owe $${amount.toFixed(2)}. Pay me back here: ${url}`;

            const phone = contact.phoneNumber && contact.phoneNumber !== 'no-phone'
                ? contact.phoneNumber
                : null;

            if (phone) {
                await SMS.sendSMSAsync([phone], message);
            } else {
                await Share.share({ message });
            }
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch (err) {
            showToast(getUserFacingErrorMessage(err, 'Could not generate payment link.'), 'error');
        } finally {
            setMarkingPaid((prev) => {
                const next = new Set(prev);
                next.delete(contact.dbId);
                return next;
            });
        }
    };

    // Sends requests sequentially — iOS only allows one share sheet open at a time.
    const handleConfirmPayment = async (contact: ContactBreakdown) => {
        await handleMarkPaid(contact);
    };

    const handleDisputePayment = async (contact: ContactBreakdown) => {
        const existing = paymentRequests.get(contact.dbId);
        if (!existing) return;

        setMarkingPaid((prev) => new Set(prev).add(contact.dbId));
        try {
            const { error } = await supabase
                .from('payment_requests')
                .update({ status: 'unpaid', pending_at: null })
                .eq('id', existing.id);

            if (error) throw error;

            setPaymentRequests((prev) => {
                const next = new Map(prev);
                next.set(contact.dbId, { ...existing, status: 'unpaid' });
                return next;
            });
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch (err) {
            showToast(getUserFacingErrorMessage(err, 'Could not update payment status.'), 'error');
        } finally {
            setMarkingPaid((prev) => {
                const next = new Set(prev);
                next.delete(contact.dbId);
                return next;
            });
        }
    };

    const handleRequestAll = async () => {
        const unrequested = contacts.filter((c) => {
            const s = paymentRequests.get(c.dbId)?.status;
            return !s || s === 'unpaid';
        });
        for (const c of unrequested) {
            await handleRequestPayment(c);
        }
    };

    const performEdit = async () => {
        if (!receipt) return;
        setEditLoading(true);
        try {
            const items: ReceiptItem[] = receipt.receipt_items.map((i) => ({
                id: i.id,
                name: i.item_name,
                price: i.item_price,
            }));

            const storeContacts: Contact[] = contacts.map((c) => ({
                id: c.id,
                name: c.name,
                phoneNumber: c.phoneNumber !== 'no-phone' ? c.phoneNumber : undefined,
                items: c.items.map((i) => ({
                    id: i.id,
                    name: i.item_name,
                    price: i.item_price,
                })),
            }));

            const userItems: ReceiptItem[] = unassignedItems.map((i) => ({
                id: i.id,
                name: i.item_name,
                price: i.item_price,
            }));

            resetStore();
            hydrateForEdit(
                receipt.id,
                {
                    text: '',
                    items,
                    tax: receipt.tax_amount,
                    tip: receipt.tip_amount,
                    total: receipt.total_amount,
                    userItems,
                },
                storeContacts,
                receipt.receipt_name,
                receipt.created_at,
            );

            router.push('/contacts');
        } catch (err) {
            showToast(getUserFacingErrorMessage(err, 'Could not load receipt for editing.'), 'error');
        } finally {
            setEditLoading(false);
        }
    };

    const handleEditSplit = () => {
        if (!receipt) return;
        const inProgress = useSplitStore.getState().receiptData.items.length > 0;
        if (inProgress) {
            showAlert({
                title: 'Discard In-Progress Split?',
                message: 'You have an unfinished split in progress. Editing this receipt will discard it.',
                buttons: [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Discard & Edit', style: 'destructive', onPress: performEdit },
                ],
            });
            return;
        }
        performEdit();
    };

    const handleResendSMS = async () => {
        if (!receipt || !session?.user) return;
        setResending(true);
        try {
            const isAvailable = await SMS.isAvailableAsync();
            if (!isAvailable) {
                showToast('This device cannot send text messages.', 'error');
                return;
            }

            if (contacts.length === 0) {
                showToast('No item assignments found for this receipt.', 'warning');
                return;
            }

            const phoneNumbers = contacts
                .map((c) => c.phoneNumber)
                .filter((p) => !!p && p !== 'no-phone');

            if (phoneNumbers.length === 0) {
                showToast('None of the assigned contacts have phone numbers.', 'warning');
                return;
            }

            // Upsert a payment_request for every contact to ensure tokens exist,
            // then build one group SMS with a unique pay link per person.
            const upsertResults = await Promise.all(
                contacts.map((c) => {
                    const amount = contactTotals.get(c.dbId) || 0;
                    return supabase
                        .from('payment_requests')
                        .upsert(
                            {
                                receipt_id: receipt.id,
                                contact_id: c.dbId,
                                owner_id: session.user.id,
                                amount,
                                items: [
                                    ...c.items.map((i) => ({ name: i.item_name, price: i.item_price })),
                                    ...((contactTaxes[c.dbId] || 0) > 0 ? [{ name: 'Tax', price: contactTaxes[c.dbId] }] : []),
                                    ...((contactTips[c.dbId] || 0) > 0 ? [{ name: 'Tip', price: contactTips[c.dbId] }] : []),
                                ],
                                status: 'requested',
                                requested_at: new Date().toISOString(),
                            },
                            { onConflict: 'receipt_id,contact_id' }
                        )
                        .select('id, contact_id, status, settled_at, amount, token')
                        .single();
                })
            );

            // Update local payment request state
            setPaymentRequests((prev) => {
                const next = new Map(prev);
                upsertResults.forEach(({ data }) => {
                    if (!data) return;
                    next.set(data.contact_id, {
                        id: data.id,
                        status: 'requested',
                        settled_at: null,
                        amount: data.amount,
                        token: data.token,
                    });
                });
                return next;
            });

            const receiptName = receipt.receipt_name.trim() || 'the bill';
            const dateStr = new Date(receipt.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
            });

            let message = `🧾 ${receiptName} — ${dateStr}\n`;

            upsertResults.forEach(({ data }, i) => {
                if (!data) return;
                const c = contacts[i];
                const amount = contactTotals.get(c.dbId) || 0;
                const url = buildPayUrl(data.token);
                message += `\n${c.name} — $${amount.toFixed(2)}\n${url}\n`;
            });

            message += `\nTotal: $${(receipt.total_amount || 0).toFixed(2)}`;

            await SMS.sendSMSAsync(phoneNumbers, message);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch (err) {
            showToast(getUserFacingErrorMessage(err, 'Failed to send SMS.'), 'error');
        } finally {
            setResending(false);
        }
    };

    if (!receipt) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={colors.green} />
                </View>
            </SafeAreaView>
        );
    }

    const subtotal = receipt.receipt_items.reduce((s, i) => s + i.item_price, 0);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.headerContainer}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={28} color={colors.black} />
                </TouchableOpacity>
                <View style={styles.headerText}>
                    <Text style={styles.headerTitle} numberOfLines={1}>
                        {receipt.receipt_name}
                    </Text>
                    <Text style={styles.headerDate}>
                        {new Date(receipt.created_at).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                        })}
                    </Text>
                </View>
            </View>

            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
                {/* Summary */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Summary</Text>
                    <View style={styles.divider} />
                    <View style={styles.row}>
                        <Text style={styles.rowLabel}>Subtotal</Text>
                        <Text style={styles.rowValue}>${subtotal.toFixed(2)}</Text>
                    </View>
                    {(receipt.tax_amount || 0) > 0 && (
                        <View style={styles.row}>
                            <Text style={styles.rowLabel}>Tax</Text>
                            <Text style={styles.rowValue}>${(receipt.tax_amount || 0).toFixed(2)}</Text>
                        </View>
                    )}
                    {(receipt.tip_amount || 0) > 0 && (
                        <View style={styles.row}>
                            <Text style={styles.rowLabel}>Tip</Text>
                            <Text style={styles.rowValue}>${(receipt.tip_amount || 0).toFixed(2)}</Text>
                        </View>
                    )}
                    <View style={styles.divider} />
                    <View style={styles.row}>
                        <Text style={styles.totalLabel}>Total</Text>
                        <Text style={styles.totalValue}>${(receipt.total_amount || 0).toFixed(2)}</Text>
                    </View>
                </View>

                {/* Items */}
                <Text style={styles.sectionTitle}>Items</Text>
                <View style={styles.card}>
                    {receipt.receipt_items.map((item) => (
                        <View key={item.id} style={styles.row}>
                            <Text style={styles.rowLabel} numberOfLines={1}>
                                {item.item_name}
                            </Text>
                            <Text style={styles.rowValue}>${item.item_price.toFixed(2)}</Text>
                        </View>
                    ))}
                </View>

                {/* Who Owes You */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Who Owes You</Text>
                    {contacts.length > 0 && !loadingAssignments && (
                        <Text
                            style={[
                                styles.settlementCount,
                                { color: allSettled ? colors.green : colors.gray400 },
                            ]}
                        >
                            {allSettled ? 'All paid' : `${settledCount}/${contacts.length} paid`}
                        </Text>
                    )}
                </View>

                {loadingAssignments ? (
                    <ActivityIndicator color={colors.green} style={{ marginVertical: spacing.lg }} />
                ) : contacts.length === 0 ? (
                    <View style={styles.card}>
                        <Text style={styles.emptyText}>No assignments saved for this receipt.</Text>
                    </View>
                ) : (
                    <>
                        {contacts.map((c) => {
                            const total = contactTotals.get(c.dbId) ?? 0;
                            const pr = paymentRequests.get(c.dbId);
                            const status: PaymentStatus = pr?.status ?? 'unpaid';
                            const cfg = STATUS_CONFIG[status];
                            const isLoading = markingPaid.has(c.dbId);
                            const isSettled = status === 'settled';
                            const isPending = status === 'pending';

                            return (
                                <View key={c.dbId} style={styles.paymentCard}>
                                    {/* Contact header row */}
                                    <View style={styles.paymentCardHeader}>
                                        <View style={styles.paymentNameRow}>
                                            <View
                                                style={[
                                                    styles.statusDot,
                                                    { backgroundColor: cfg.dot },
                                                ]}
                                            />
                                            <View>
                                                <Text style={styles.paymentContactName}>{c.name}</Text>
                                                <Text style={styles.paymentItemCount}>
                                                    {c.items.length} item
                                                    {c.items.length !== 1 ? 's' : ''}
                                                </Text>
                                            </View>
                                        </View>
                                        <View style={styles.paymentAmountCol}>
                                            <Text style={styles.paymentAmount}>
                                                ${total.toFixed(2)}
                                            </Text>
                                            <Text
                                                style={[
                                                    styles.statusLabel,
                                                    { color: cfg.labelColor },
                                                ]}
                                            >
                                                {cfg.label}
                                                {isSettled ? ' ✓' : ''}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Item breakdown */}
                                    <View style={styles.divider} />
                                    {c.items.map((item) => (
                                        <View key={item.id} style={styles.paymentItemRow}>
                                            <Text
                                                style={styles.paymentItemName}
                                                numberOfLines={1}
                                            >
                                                {item.item_name}
                                            </Text>
                                            <Text style={styles.paymentItemPrice}>
                                                ${item.item_price.toFixed(2)}
                                            </Text>
                                        </View>
                                    ))}

                                    {/* Action row */}
                                    <View style={styles.divider} />
                                    <View style={styles.paymentActionRow}>
                                        {isLoading ? (
                                            <ActivityIndicator
                                                size="small"
                                                color={colors.green}
                                                style={styles.actionLoader}
                                            />
                                        ) : isSettled ? (
                                            <TouchableOpacity
                                                onPress={() => handleMarkUnpaid(c)}
                                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                            >
                                                <Text style={styles.undoText}>Undo</Text>
                                            </TouchableOpacity>
                                        ) : isPending ? (
                                            <View style={styles.actionButtons}>
                                                <TouchableOpacity
                                                    onPress={() => handleDisputePayment(c)}
                                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                                >
                                                    <Text style={styles.disputeText}>Dispute</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={styles.confirmBtn}
                                                    onPress={() => handleConfirmPayment(c)}
                                                    activeOpacity={0.75}
                                                >
                                                    <MaterialIcons name="check" size={13} color={colors.white} />
                                                    <Text style={styles.confirmBtnText}>Confirm</Text>
                                                </TouchableOpacity>
                                            </View>
                                        ) : (
                                            <View style={styles.actionButtons}>
                                                <TouchableOpacity
                                                    onPress={() => handleMarkPaid(c)}
                                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                                >
                                                    <Text style={styles.markPaidLinkText}>Mark Paid</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={styles.requestBtn}
                                                    onPress={() => handleRequestPayment(c)}
                                                    activeOpacity={0.75}
                                                >
                                                    <MaterialIcons
                                                        name="send"
                                                        size={13}
                                                        color={colors.white}
                                                    />
                                                    <Text style={styles.requestBtnText}>
                                                        {status === 'requested' ? 'Resend' : 'Request'}
                                                    </Text>
                                                </TouchableOpacity>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            );
                        })}

                        {/* Bulk actions — only when at least one is not settled */}
                        {!allSettled && contacts.length > 1 && (
                            <View style={styles.bulkActions}>
                                <TouchableOpacity
                                    style={styles.requestAllBtn}
                                    onPress={handleRequestAll}
                                    activeOpacity={0.75}
                                >
                                    <MaterialIcons name="send" size={15} color={colors.white} />
                                    <Text style={styles.requestAllText}>Request All</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.markAllBtn}
                                    onPress={handleMarkAllPaid}
                                    activeOpacity={0.75}
                                >
                                    <Text style={styles.markAllText}>Mark All Paid</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </>
                )}
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={handleResendSMS}
                    disabled={resending}
                    activeOpacity={0.7}
                >
                    {resending ? (
                        <ActivityIndicator size="small" color={colors.black} />
                    ) : (
                        <>
                            <MaterialIcons name="sms" size={18} color={colors.black} />
                            <Text style={styles.secondaryButtonText} numberOfLines={1}>Resend SMS</Text>
                        </>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={handleEditSplit}
                    disabled={editLoading || loadingAssignments}
                    activeOpacity={0.7}
                >
                    {editLoading ? (
                        <ActivityIndicator size="small" color={colors.white} />
                    ) : (
                        <>
                            <MaterialIcons name="edit" size={18} color={colors.white} />
                            <Text style={styles.primaryButtonText}>Edit Split</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.gray100 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

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
    headerDate: {
        fontFamily: fonts.body,
        fontSize: fontSizes.xs,
        color: colors.gray600,
        marginTop: 2,
    },

    scroll: { flex: 1 },
    scrollContent: {
        paddingHorizontal: spacing.lg,
        paddingBottom: 120,
    },

    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: spacing.lg,
        marginBottom: spacing.xs,
    },
    sectionTitle: {
        fontFamily: fonts.bodySemiBold,
        fontSize: fontSizes.xs,
        color: colors.gray500,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
    },
    settlementCount: {
        fontFamily: fonts.bodySemiBold,
        fontSize: fontSizes.xs,
        letterSpacing: 0.4,
    },

    card: {
        backgroundColor: colors.white,
        borderRadius: radii.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        marginBottom: spacing.sm,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    cardTitle: {
        fontFamily: fonts.bodySemiBold,
        fontSize: fontSizes.xs,
        color: colors.gray500,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        marginBottom: spacing.xs,
        marginTop: spacing.xs,
    },
    divider: {
        height: 1,
        backgroundColor: colors.gray200,
        marginVertical: spacing.xs,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 5,
    },
    rowLabel: {
        fontFamily: fonts.body,
        fontSize: fontSizes.md,
        color: colors.black,
        flex: 1,
        marginRight: spacing.sm,
    },
    rowValue: {
        fontFamily: fonts.bodySemiBold,
        fontSize: fontSizes.md,
        color: colors.green,
    },
    totalLabel: {
        fontFamily: fonts.bodyBold,
        fontSize: fontSizes.md,
        color: colors.black,
    },
    totalValue: {
        fontFamily: fonts.bodyBold,
        fontSize: fontSizes.lg,
        color: colors.green,
    },
    emptyText: {
        fontFamily: fonts.body,
        fontSize: fontSizes.sm,
        color: colors.gray400,
        textAlign: 'center',
        paddingVertical: spacing.md,
    },

    // Payment tracking card
    paymentCard: {
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
    paymentCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.xs,
    },
    paymentNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        flex: 1,
    },
    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginTop: 2,
    },
    paymentContactName: {
        fontFamily: fonts.bodySemiBold,
        fontSize: fontSizes.md,
        color: colors.black,
    },
    paymentItemCount: {
        fontFamily: fonts.body,
        fontSize: fontSizes.xs,
        color: colors.gray400,
        marginTop: 1,
    },
    paymentAmountCol: {
        alignItems: 'flex-end',
    },
    paymentAmount: {
        fontFamily: fonts.bodyBold,
        fontSize: fontSizes.md,
        color: colors.green,
    },
    statusLabel: {
        fontFamily: fonts.bodyMedium,
        fontSize: fontSizes.xs,
        marginTop: 2,
    },
    paymentItemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 4,
    },
    paymentItemName: {
        fontFamily: fonts.body,
        fontSize: fontSizes.sm,
        color: colors.gray600,
        flex: 1,
        marginRight: spacing.sm,
    },
    paymentItemPrice: {
        fontFamily: fonts.bodyMedium,
        fontSize: fontSizes.sm,
        color: colors.gray500,
    },
    paymentActionRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingTop: spacing.xs,
    },
    actionLoader: {
        height: 30,
    },
    actionButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    markPaidLinkText: {
        fontFamily: fonts.bodyMedium,
        fontSize: fontSizes.xs,
        color: colors.gray400,
        paddingVertical: 7,
    },
    requestBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: colors.black,
        paddingHorizontal: spacing.md,
        paddingVertical: 7,
        borderRadius: radii.full,
    },
    requestBtnText: {
        fontFamily: fonts.bodySemiBold,
        fontSize: fontSizes.xs,
        color: colors.white,
    },
    undoText: {
        fontFamily: fonts.bodyMedium,
        fontSize: fontSizes.xs,
        color: colors.gray400,
        paddingVertical: 7,
    },
    disputeText: {
        fontFamily: fonts.bodyMedium,
        fontSize: fontSizes.xs,
        color: colors.error,
        paddingVertical: 7,
    },
    confirmBtn: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: 5,
        backgroundColor: colors.green,
        paddingHorizontal: spacing.md,
        paddingVertical: 7,
        borderRadius: radii.full,
    },
    confirmBtnText: {
        fontFamily: fonts.bodySemiBold,
        fontSize: fontSizes.xs,
        color: colors.white,
    },

    // Bulk action buttons
    bulkActions: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginTop: spacing.xs,
        marginBottom: spacing.sm,
    },
    requestAllBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: colors.black,
        borderRadius: radii.xl,
        height: 48,
        shadowColor: colors.green,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 3,
    },
    requestAllText: {
        fontFamily: fonts.bodySemiBold,
        fontSize: fontSizes.sm,
        color: colors.white,
    },
    markAllBtn: {
        flex: 1,
        borderWidth: 1.5,
        borderColor: colors.gray300,
        borderRadius: radii.xl,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
    },
    markAllText: {
        fontFamily: fonts.bodySemiBold,
        fontSize: fontSizes.sm,
        color: colors.gray600,
    },

    footer: {
        flexDirection: 'row',
        padding: spacing.lg,
        gap: spacing.md,
        backgroundColor: colors.white,
        borderTopWidth: 1,
        borderTopColor: colors.gray200,
    },
    secondaryButton: {
        flex: 1,
        flexDirection: 'row',
        height: 52,
        borderRadius: radii.xl,
        justifyContent: 'center',
        alignItems: 'center',
        gap: spacing.xs,
        backgroundColor: colors.gray200,
        overflow: 'hidden',
    },
    secondaryButtonText: {
        fontFamily: fonts.bodySemiBold,
        fontSize: fontSizes.md,
        color: colors.black,
        flexShrink: 1,
    },
    primaryButton: {
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
    primaryButtonText: {
        fontFamily: fonts.bodySemiBold,
        fontSize: fontSizes.md,
        color: colors.white,
    },
});
