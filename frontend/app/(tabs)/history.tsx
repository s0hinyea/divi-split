import {
    View,
    StyleSheet,
    TouchableOpacity,
    Modal,
    RefreshControl,
    Alert,
    ActivityIndicator
} from 'react-native';
import { Text, Icon } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useCallback } from 'react';
import { BlurView } from 'expo-blur';

import { supabase } from '@/lib/supabase';
import { TouchableOpacity as GHTouchableOpacity, ScrollView } from 'react-native-gesture-handler';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fonts, fontSizes, spacing, radii } from '@/styles/theme';

import { useHistory, Receipt } from '@/utils/HistoryContext';
import { useProfile } from '@/utils/ProfileContext';
import * as SMS from 'expo-sms';
import { allocateAmount } from '@/utils/mathUtil';

export default function History() {
    const { receipts, loading, hasMore, fetchReceipts, deleteReceipt: contextDeleteReceipt, refreshReceipts } = useHistory();
    const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [resending, setResending] = useState(false);
    const { profile } = useProfile();

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await refreshReceipts();
        setRefreshing(false);
    }, []);

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
            console.error('Error deleting receipt:', error);
        }
    };

    const handleResendMessage = async () => {
        if (!selectedReceipt) return;

        try {
            setResending(true);
            const isAvailable = await SMS.isAvailableAsync();
            if (!isAvailable) {
                Alert.alert('SMS Not Available', 'This device cannot send text messages.');
                return;
            }

            const itemIds = selectedReceipt.receipt_items.map(item => item.id);
            if (itemIds.length === 0) {
                Alert.alert('No Items', 'This receipt has no items to split.');
                return;
            }

            const { data: assignments, error: assignError } = await supabase
                .from('assignments')
                .select(`
                    item_id,
                    contact_id,
                    contacts (
                        id,
                        contact_name,
                        phone_number
                    )
                `)
                .in('item_id', itemIds);

            if (assignError) {
                console.error("Assign join error:", assignError);
                throw assignError;
            }

            if (!assignments || assignments.length === 0) {
                Alert.alert('No Assignments', 'No item assignments found for this receipt. The split data may not have been saved.');
                return;
            }

            // Reconstruct who got what
            const contactMap = new Map(); // id -> { name, phoneNumber, items[] }

            for (const assignment of assignments || []) {
                // Supabase joins single relations as an object or array depending on schema constraints.
                let contact = assignment.contacts as any;
                if (Array.isArray(contact)) {
                    contact = contact[0];
                }
                if (!contact) continue;
                
                if (!contactMap.has(contact.id)) {
                    contactMap.set(contact.id, {
                        id: contact.id,
                        name: contact.contact_name,
                        phoneNumber: contact.phone_number,
                        items: []
                    });
                }
                
                const item = selectedReceipt.receipt_items.find(i => i.id === assignment.item_id);
                if (item) {
                    contactMap.get(contact.id).items.push(item);
                }
            }

            const selectedContacts = Array.from(contactMap.values());

            const assignedItemIds = new Set(assignments?.map(a => a.item_id) || []);
            const userItems = selectedReceipt.receipt_items.filter(i => !assignedItemIds.has(i.id));

            const phoneNumbers = selectedContacts
                .map(c => c.phoneNumber)
                .filter((num): num is string => !!num);

            if (phoneNumbers.length === 0) {
                Alert.alert('No Phone Numbers', 'None of the assigned contacts have phone numbers.');
                return;
            }

            const calculateTotal = (items: { item_price: number }[]) => {
                return items.reduce((sum, item) => sum + item.item_price, 0);
            };

            const shares: { id: string; share: number }[] = [];
            selectedContacts.forEach(contact => {
                shares.push({ id: contact.id, share: calculateTotal(contact.items) });
            });
            if (userItems.length > 0) {
                shares.push({ id: 'user', share: calculateTotal(userItems) });
            }

            const taxAmount = selectedReceipt.tax_amount || 0;
            const tipAmount = selectedReceipt.tip_amount || 0;

            const individualTaxes = allocateAmount(taxAmount, shares);

            let individualTips: Record<string, number> = {};
            if (tipAmount > 0) {
                const tipShares: { id: string; share: number }[] = [];
                selectedContacts.forEach(contact => tipShares.push({ id: contact.id, share: 1 }));
                if (userItems.length > 0) tipShares.push({ id: 'user', share: 1 });
                individualTips = allocateAmount(tipAmount, tipShares);
            }

            const name = selectedReceipt.receipt_name.trim() || 'Split';
            const dateStr = new Date(selectedReceipt.created_at).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric'
            });

            let message = `🧾 Divi Split — ${name}\n📅 ${dateStr}\n\n`;

            selectedContacts.forEach(contact => {
                const contactMealTotal = calculateTotal(contact.items);
                const contactTax = individualTaxes[contact.id] || 0;
                const contactTip = individualTips[contact.id] || 0;
                const contactTotal = contactMealTotal + contactTax + contactTip;

                message += `• ${contact.name}: $${contactTotal.toFixed(2)}`;

                const details: string[] = [];
                details.push(`meal $${contactMealTotal.toFixed(2)}`);
                if (contactTax > 0) details.push(`tax $${contactTax.toFixed(2)}`);
                if (contactTip > 0) details.push(`tip $${contactTip.toFixed(2)}`);
                message += ` (${details.join(' + ')})\n`;
            });

            const grandTotal = selectedReceipt.total_amount || 0;
            message += `\nTotal: $${grandTotal.toFixed(2)}`;

            if (profile?.venmo_handle) {
                const handle = profile.venmo_handle.replace('@', '');
                message += `\n\nPay me on Venmo:\nhttps://venmo.com/u/${handle}`;
            }
            if (profile?.cashapp_handle) {
                const handle = profile.cashapp_handle.replace('$', '');
                message += `\n\nPay me on Cash App:\nhttps://cash.app/$${handle}`;
            }
            if (profile?.zelle_number) {
                message += `\n\nPay me on Zelle:\n${profile.zelle_number}`;
            }

            await SMS.sendSMSAsync(phoneNumbers, message);
        } catch (error) {
            console.error('Error resending message:', error);
            Alert.alert('Error', 'Failed to formulate or send message.');
        } finally {
            setResending(false);
        }
    };

    const renderRightActions = (receipt: Receipt) => (
        <TouchableOpacity
            style={styles.deleteAction}
            onPress={() => handleDelete(receipt.id)}
        >
            <MaterialIcons name="delete" size={28} color={colors.white} />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>History</Text>
            </View>

            <ScrollView
                style={styles.scrollContainer}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.green}
                    />
                }
            >
                {loading ? (
                    <Text style={styles.statusText}>Loading receipts...</Text>
                ) : receipts.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyTitle}>No receipts yet</Text>
                        <Text style={styles.emptySubtitle}>Tap the logo to scan your first one!</Text>
                    </View>
                ) : (
                    <>
                        <Text style={styles.swipeHint}>Swipe left to delete</Text>
                        {receipts.map((receipt) => (
                            <Swipeable
                                key={receipt.id}
                                renderRightActions={() => renderRightActions(receipt)}
                                rightThreshold={40}
                            >
                                <GHTouchableOpacity
                                    style={styles.receiptCard}
                                    onPress={() => {
                                        setSelectedReceipt(receipt);
                                        setShowModal(true);
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.receiptInfo}>
                                        <Text style={styles.receiptName}>{receipt.receipt_name}</Text>
                                        <Text style={styles.receiptDate}>
                                            {new Date(receipt.created_at).toLocaleDateString()}
                                        </Text>
                                    </View>
                                    <Text style={styles.receiptTotal}>
                                        ${(receipt.total_amount || 0).toFixed(2)}
                                    </Text>
                                </GHTouchableOpacity>
                            </Swipeable>
                        ))}

                        {hasMore && (
                            <TouchableOpacity
                                style={styles.loadMoreButton}
                                onPress={handleLoadMore}
                                disabled={loadingMore}
                            >
                                <Text style={styles.loadMoreText}>
                                    {loadingMore ? 'Loading...' : 'Load More'}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </>
                )}
            </ScrollView>

            {/* Receipt Details Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={showModal}
                onRequestClose={() => { setShowModal(false); setSelectedReceipt(null); }}
            >
                <BlurView intensity={50} style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {selectedReceipt?.receipt_name || 'Receipt Details'}
                            </Text>
                            <TouchableOpacity
                                onPress={() => { setShowModal(false); setSelectedReceipt(null); }}
                                style={styles.closeButton}
                            >
                                <Icon source="close" size={24} color={colors.gray600} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalContent}>
                            {selectedReceipt && (
                                <>
                                    <Text style={styles.modalDate}>
                                        {new Date(selectedReceipt.created_at).toLocaleDateString('en-US', {
                                            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                                        })}
                                    </Text>

                                    {selectedReceipt.receipt_items?.map((item) => (
                                        <View key={item.id} style={styles.modalItem}>
                                            <Text style={styles.modalItemName}>{item.item_name}</Text>
                                            <Text style={styles.modalItemPrice}>${item.item_price.toFixed(2)}</Text>
                                        </View>
                                    ))}

                                    <View style={styles.modalTotal}>
                                        <Text style={styles.modalTotalLabel}>Total</Text>
                                        <Text style={styles.modalTotalAmount}>
                                            ${(selectedReceipt.total_amount || 0).toFixed(2)}
                                        </Text>
                                    </View>
                                </>
                            )}
                        </ScrollView>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.modalActionButton}
                                onPress={handleResendMessage}
                                disabled={resending}
                                activeOpacity={0.7}
                            >
                                {resending ? (
                                    <ActivityIndicator size="small" color={colors.white} />
                                ) : (
                                    <>
                                        <Icon source="message-text" size={20} color={colors.white} />
                                        <Text style={styles.modalActionText}>Resend SMS</Text>
                                    </>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.modalCloseButton}
                                onPress={() => { setShowModal(false); setSelectedReceipt(null); }}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.modalCloseText}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </BlurView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.gray100 },
    header: { padding: spacing.lg, paddingBottom: spacing.md },
    title: {
        fontFamily: fonts.bodyBold,
        fontSize: fontSizes.xxl,
        color: colors.black,
    },
    scrollContainer: { flex: 1 },
    scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },


    emptyState: { alignItems: 'center', paddingVertical: spacing.xxl },
    emptyTitle: { fontFamily: fonts.body, fontSize: fontSizes.md, color: colors.gray600, fontWeight: '600' },
    emptySubtitle: { fontFamily: fonts.body, fontSize: fontSizes.sm, color: colors.gray400, marginTop: spacing.xs },


    statusText: { fontFamily: fonts.body, fontSize: fontSizes.sm, color: colors.gray400, textAlign: 'center', paddingVertical: spacing.xl },
    swipeHint: { fontSize: fontSizes.sm, color: colors.gray400, marginBottom: spacing.md, fontStyle: 'italic', fontFamily: fonts.body },


    receiptCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: colors.white,
        padding: spacing.md,
        borderRadius: radii.md,
        marginBottom: spacing.sm,
    },
    receiptInfo: { flex: 1 },
    receiptName: { fontFamily: fonts.bodySemiBold, fontSize: fontSizes.md, color: colors.black },
    receiptDate: { fontFamily: fonts.body, fontSize: fontSizes.xs, color: colors.gray600, marginTop: 2 },
    receiptTotal: { fontFamily: fonts.bodySemiBold, fontSize: fontSizes.lg, color: colors.green },


    deleteAction: {
        backgroundColor: colors.error,
        justifyContent: 'center',
        alignItems: 'center',
        width: 80,
        borderRadius: radii.md,
        marginBottom: spacing.sm,
    },


    loadMoreButton: { padding: spacing.md, alignItems: 'center', marginVertical: spacing.sm },
    loadMoreText: { color: colors.green, fontSize: fontSizes.md, fontFamily: fonts.body },


    modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    modalContainer: {
        backgroundColor: colors.white,
        borderRadius: radii.lg,
        width: '85%',
        maxHeight: '70%',
        padding: spacing.lg,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    modalTitle: { fontFamily: fonts.bodyBold, fontSize: fontSizes.xl, color: colors.black, flex: 1 },
    closeButton: { padding: spacing.xs },
    modalContent: { maxHeight: 300 },
    modalDate: { fontSize: fontSizes.sm, color: colors.gray600, marginBottom: spacing.md, fontFamily: fonts.body },
    modalItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray200,
    },
    modalItemName: { fontFamily: fonts.body, fontSize: fontSizes.md, color: colors.black },
    modalItemPrice: { fontFamily: fonts.body, fontSize: fontSizes.md, color: colors.gray800 },
    modalTotal: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: spacing.md,
        marginTop: spacing.sm,
        borderTopWidth: 2,
        borderTopColor: colors.black,
    },
    modalTotalLabel: { fontFamily: fonts.bodySemiBold, fontSize: fontSizes.lg, color: colors.black },
    modalTotalAmount: { fontFamily: fonts.bodyBold, fontSize: fontSizes.lg, color: colors.black },
    modalActions: { gap: spacing.md, marginTop: spacing.xxl },
    modalActionButton: {
        backgroundColor: colors.black,
        flexDirection: 'row',
        paddingVertical: spacing.md,
        borderRadius: radii.md,
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
    },
    modalActionText: {
        fontFamily: fonts.bodySemiBold,
        fontSize: fontSizes.md,
        color: colors.white,
    },
    modalCloseButton: { backgroundColor: colors.gray200, paddingVertical: spacing.md, borderRadius: radii.md, alignItems: 'center' },
    modalCloseText: { fontFamily: fonts.bodySemiBold, fontSize: fontSizes.md, color: colors.black },
});
