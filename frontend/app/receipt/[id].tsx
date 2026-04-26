import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    Modal,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as SMS from 'expo-sms';

import { supabase } from '@/lib/supabase';
import { useHistory } from '@/utils/HistoryContext';
import { useProfile } from '@/utils/ProfileContext';
import { useSplitStore, ReceiptItem, Contact } from '@/stores/splitStore';
import { allocateAmount } from '@/utils/mathUtil';
import { getUserFacingErrorMessage } from '@/utils/network';
import { colors, fonts, fontSizes, spacing, radii } from '@/styles/theme';
import { useReviewAgent, ReviewState, ReviewCallbacks } from '@/utils/useReviewAgent';
import ReviewAgentPanel from '@/components/ReviewAgentPanel';

type DbItem = { id: string; item_name: string; item_price: number };

type ContactBreakdown = {
    id: string;       // original phone/frontend ID (used for store hydration + matching)
    dbId: string;     // DB UUID (used for allocation key)
    name: string;
    phoneNumber: string;
    items: DbItem[];
};

export default function ReceiptDetail() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { receipts } = useHistory();
    const { profile } = useProfile();
    const resetStore = useSplitStore((s) => s.resetStore);
    const hydrateForEdit = useSplitStore((s) => s.hydrateForEdit);

    const receipt = receipts.find((r) => r.id === id) ?? null;

    const [contacts, setContacts] = useState<ContactBreakdown[]>([]);
    const [unassignedItems, setUnassignedItems] = useState<DbItem[]>([]);
    const [loadingAssignments, setLoadingAssignments] = useState(true);
    const [editLoading, setEditLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [agentVisible, setAgentVisible] = useState(false);

    const reviewStateRef = useRef<ReviewState>({
        receiptName: '',
        receiptDate: new Date().toISOString(),
        contacts: [],
        userItems: [],
        tax: 0,
        tip: 0,
        total: 0,
    });
    const reviewCallbacksRef = useRef<ReviewCallbacks>({
        setReceiptName: () => {},
        setReceiptDate: () => {},
        updateContactName: () => {},
        setTax: () => {},
        setTip: () => {},
        moveItem: () => {},
        triggerDispatch: () => setAgentVisible(false),
    });
    const agent = useReviewAgent(reviewStateRef, reviewCallbacksRef);

    const fetchAssignments = useCallback(async () => {
        if (!receipt) return;
        const itemIds = receipt.receipt_items.map((i) => i.id);
        if (itemIds.length === 0) {
            setLoadingAssignments(false);
            return;
        }
        try {
            const { data, error } = await supabase
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
                .in('item_id', itemIds);

            if (error) throw error;

            const contactMap = new Map<string, ContactBreakdown>();
            const assignedIds = new Set<string>();

            for (const row of (data as any[]) || []) {
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
        } catch (err) {
            console.error('Failed to fetch assignments:', err);
        } finally {
            setLoadingAssignments(false);
        }
    }, [receipt]);

    useEffect(() => {
        fetchAssignments();
    }, [fetchAssignments]);

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
            Alert.alert('Error', getUserFacingErrorMessage(err, 'Could not load receipt for editing.'));
        } finally {
            setEditLoading(false);
        }
    };

    const handleEditSplit = () => {
        if (!receipt) return;
        const inProgress = useSplitStore.getState().receiptData.items.length > 0;
        if (inProgress) {
            Alert.alert(
                'Discard In-Progress Split?',
                'You have an unfinished split in progress. Editing this receipt will discard it.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Discard & Edit', style: 'destructive', onPress: performEdit },
                ]
            );
            return;
        }
        performEdit();
    };

    const handleResendSMS = async () => {
        if (!receipt) return;
        setResending(true);
        try {
            const isAvailable = await SMS.isAvailableAsync();
            if (!isAvailable) {
                Alert.alert('SMS Not Available', 'This device cannot send text messages.');
                return;
            }

            if (contacts.length === 0) {
                Alert.alert('No Assignments', 'No item assignments found for this receipt.');
                return;
            }

            const phoneNumbers = contacts
                .map((c) => c.phoneNumber)
                .filter((p) => !!p && p !== 'no-phone');

            if (phoneNumbers.length === 0) {
                Alert.alert('No Phone Numbers', 'None of the assigned contacts have phone numbers.');
                return;
            }

            const shares = contacts.map((c) => ({
                id: c.dbId,
                share: c.items.reduce((s, i) => s + i.item_price, 0),
            }));
            if (unassignedItems.length > 0) {
                shares.push({ id: 'user', share: unassignedItems.reduce((s, i) => s + i.item_price, 0) });
            }

            const individualTaxes = allocateAmount(receipt.tax_amount || 0, shares);
            const individualTips = (receipt.tip_amount || 0) > 0
                ? allocateAmount(receipt.tip_amount, shares.map((s) => ({ ...s, share: 1 })))
                : {} as Record<string, number>;

            const name = receipt.receipt_name.trim() || 'Split';
            const dateStr = new Date(receipt.created_at).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric',
            });

            let message = `🧾 Divi — ${name}\n📅 ${dateStr}\n\n`;

            contacts.forEach((c) => {
                const mealTotal = c.items.reduce((s, i) => s + i.item_price, 0);
                const tax = individualTaxes[c.dbId] || 0;
                const tip = individualTips[c.dbId] || 0;
                const total = mealTotal + tax + tip;

                message += `• ${c.name}: $${total.toFixed(2)}`;
                const details: string[] = [`meal $${mealTotal.toFixed(2)}`];
                if (tax > 0) details.push(`tax $${tax.toFixed(2)}`);
                if (tip > 0) details.push(`tip $${tip.toFixed(2)}`);
                message += ` (${details.join(' + ')})\n`;
            });

            if (unassignedItems.length > 0) {
                const userMealTotal = unassignedItems.reduce((s, i) => s + i.item_price, 0);
                const userTax = individualTaxes['user'] || 0;
                const userTip = individualTips['user'] || 0;
                const userTotal = userMealTotal + userTax + userTip;

                message += `• ${profile?.full_name || 'You'}: $${userTotal.toFixed(2)}`;
                const details: string[] = [`meal $${userMealTotal.toFixed(2)}`];
                if (userTax > 0) details.push(`tax $${userTax.toFixed(2)}`);
                if (userTip > 0) details.push(`tip $${userTip.toFixed(2)}`);
                message += ` (${details.join(' + ')})\n`;
            }

            message += `\nTotal: $${(receipt.total_amount || 0).toFixed(2)}`;

            if (profile?.venmo_handle) {
                message += `\n\nPay me on Venmo:\nhttps://venmo.com/u/${profile.venmo_handle.replace('@', '')}`;
            }
            if (profile?.cashapp_handle) {
                message += `\n\nPay me on Cash App:\nhttps://cash.app/$${profile.cashapp_handle.replace('$', '')}`;
            }
            if (profile?.zelle_number) {
                message += `\n\nPay me on Zelle:\n${profile.zelle_number}`;
            }

            await SMS.sendSMSAsync(phoneNumbers, message);
        } catch (err) {
            Alert.alert('Error', getUserFacingErrorMessage(err, 'Failed to send SMS.'));
        } finally {
            setResending(false);
        }
    };

    if (receipt) {
        reviewStateRef.current = {
            receiptName: receipt.receipt_name,
            receiptDate: receipt.created_at,
            contacts: contacts.map((c) => ({
                id: c.id,
                name: c.name,
                items: c.items.map((i) => ({ id: i.id, name: i.item_name, price: i.item_price })),
            })),
            userItems: unassignedItems.map((i) => ({ id: i.id, name: i.item_name, price: i.item_price })),
            tax: receipt.tax_amount || 0,
            tip: receipt.tip_amount || 0,
            total: receipt.total_amount || 0,
        };
        reviewCallbacksRef.current.triggerDispatch = () => setAgentVisible(false);
    }

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
                            weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
                        })}
                    </Text>
                </View>
                <TouchableOpacity
                    style={styles.agentButton}
                    onPress={() => setAgentVisible(true)}
                    activeOpacity={0.8}
                >
                    <MaterialIcons name="auto-awesome" size={18} color={colors.green} />
                </TouchableOpacity>
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
                            <Text style={styles.rowLabel} numberOfLines={1}>{item.item_name}</Text>
                            <Text style={styles.rowValue}>${item.item_price.toFixed(2)}</Text>
                        </View>
                    ))}
                </View>

                {/* Split Breakdown */}
                <Text style={styles.sectionTitle}>Split Breakdown</Text>
                {loadingAssignments ? (
                    <ActivityIndicator color={colors.green} style={{ marginVertical: spacing.lg }} />
                ) : contacts.length === 0 ? (
                    <View style={styles.card}>
                        <Text style={styles.emptyText}>No assignments saved for this receipt.</Text>
                    </View>
                ) : (
                    contacts.map((c) => {
                        const mealTotal = c.items.reduce((s, i) => s + i.item_price, 0);
                        return (
                            <View key={c.dbId} style={styles.card}>
                                <Text style={styles.contactName}>{c.name}</Text>
                                <View style={styles.divider} />
                                {c.items.map((item) => (
                                    <View key={item.id} style={styles.row}>
                                        <Text style={styles.rowLabel} numberOfLines={1}>{item.item_name}</Text>
                                        <Text style={styles.rowValue}>${item.item_price.toFixed(2)}</Text>
                                    </View>
                                ))}
                                <View style={[styles.row, { marginTop: spacing.xs }]}>
                                    <Text style={styles.totalLabel}>Subtotal</Text>
                                    <Text style={styles.totalValue}>${mealTotal.toFixed(2)}</Text>
                                </View>
                            </View>
                        );
                    })
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
                            <Text style={styles.secondaryButtonText}>Resend SMS</Text>
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
            <Modal
                animationType="slide"
                transparent={true}
                visible={agentVisible}
                onRequestClose={() => setAgentVisible(false)}
            >
                <View style={styles.agentModalOverlay}>
                    <TouchableOpacity
                        style={styles.agentModalDismiss}
                        activeOpacity={1}
                        onPress={() => setAgentVisible(false)}
                    />
                    <View style={styles.agentModalSheet}>
                        <View style={styles.agentHandle} />
                        <ReviewAgentPanel {...agent} />
                    </View>
                </View>
            </Modal>
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

    sectionTitle: {
        fontFamily: fonts.bodySemiBold,
        fontSize: fontSizes.xs,
        color: colors.gray500,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        marginTop: spacing.lg,
        marginBottom: spacing.xs,
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
        fontSize: fontSizes.sm,
        color: colors.gray800,
        flex: 1,
        marginRight: spacing.sm,
    },
    rowValue: {
        fontFamily: fonts.mono,
        fontSize: fontSizes.sm,
        color: colors.gray600,
    },
    totalLabel: {
        fontFamily: fonts.bodyBold,
        fontSize: fontSizes.sm,
        color: colors.black,
    },
    totalValue: {
        fontFamily: fonts.mono,
        fontSize: fontSizes.sm,
        color: colors.green,
    },
    contactName: {
        fontFamily: fonts.bodySemiBold,
        fontSize: fontSizes.sm,
        color: colors.black,
        marginBottom: 2,
        marginTop: spacing.xs,
    },
    emptyText: {
        fontFamily: fonts.body,
        fontSize: fontSizes.sm,
        color: colors.gray400,
        textAlign: 'center',
        paddingVertical: spacing.md,
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
    },
    secondaryButtonText: {
        fontFamily: fonts.bodySemiBold,
        fontSize: fontSizes.md,
        color: colors.black,
    },
    primaryButton: {
        flex: 2,
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

    agentButton: {
        width: 36,
        height: 36,
        borderRadius: radii.full,
        backgroundColor: `${colors.green}15`,
        justifyContent: 'center',
        alignItems: 'center',
    },
    agentModalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    agentModalDismiss: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.35)',
    },
    agentModalSheet: {
        height: Dimensions.get('window').height * 0.72,
        backgroundColor: colors.white,
        borderTopLeftRadius: radii.xl,
        borderTopRightRadius: radii.xl,
        overflow: 'hidden',
    },
    agentHandle: {
        width: 36,
        height: 4,
        borderRadius: 2,
        backgroundColor: colors.gray300,
        alignSelf: 'center',
        marginTop: spacing.md,
    },
});
