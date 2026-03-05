import {
    View,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Modal,
} from 'react-native';
import { Text, Icon } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { BlurView } from 'expo-blur';

import { supabase } from '@/lib/supabase';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fonts, fontSizes, spacing, radii } from '@/styles/theme';

import { useHistory, Receipt } from '@/utils/HistoryContext';

export default function History() {
    const { receipts, loading, hasMore, fetchReceipts, deleteReceipt: contextDeleteReceipt } = useHistory();
    const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [showModal, setShowModal] = useState(false);

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

            <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
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
                                <TouchableOpacity
                                    style={styles.receiptCard}
                                    onPress={() => {
                                        setSelectedReceipt(receipt);
                                        setShowModal(true);
                                    }}
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
                                </TouchableOpacity>
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

                        <TouchableOpacity
                            style={styles.modalCloseButton}
                            onPress={() => { setShowModal(false); setSelectedReceipt(null); }}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.modalCloseText}>Close</Text>
                        </TouchableOpacity>
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
    modalTotalAmount: { fontFamily: fonts.bodySemiBold, fontSize: fontSizes.lg, color: colors.green },
    modalCloseButton: {
        backgroundColor: colors.green,
        paddingVertical: 14,
        borderRadius: radii.md,
        alignItems: 'center',
        marginTop: spacing.lg,
    },
    modalCloseText: { color: colors.white, fontSize: fontSizes.md, fontFamily: fonts.bodySemiBold },
});
