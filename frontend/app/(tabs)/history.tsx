import {
    View,
    StyleSheet,
    TouchableOpacity,
    RefreshControl,
    Alert,
} from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'expo-router';

import { TouchableOpacity as GHTouchableOpacity, ScrollView } from 'react-native-gesture-handler';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { MaterialIcons } from '@expo/vector-icons';
import { fonts, fontSizes, spacing, radii } from '@/styles/theme';
import { useThemeColors } from '@/utils/ThemeContext';

import { useHistory, Receipt } from '@/utils/HistoryContext';
import { getUserFacingErrorMessage } from '@/utils/network';
import { HistorySkeleton } from '@/components/SkeletonLoader';

function createStyles(C: ReturnType<typeof useThemeColors>) {
    return StyleSheet.create({
        container: { flex: 1, backgroundColor: C.gray100 },
        header: { padding: spacing.lg, paddingBottom: spacing.md },
        title: {
            fontFamily: fonts.bodyBold,
            fontSize: fontSizes.xxl,
            color: C.black,
        },
        scrollContainer: { flex: 1 },
        scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },

        emptyState: { alignItems: 'center', paddingVertical: spacing.xxl },
        emptyTitle: { fontFamily: fonts.body, fontSize: fontSizes.md, color: C.gray600, fontWeight: '600' },
        emptySubtitle: { fontFamily: fonts.body, fontSize: fontSizes.sm, color: C.gray400, marginTop: spacing.xs },

        swipeHint: { fontSize: fontSizes.sm, color: C.gray400, marginBottom: spacing.md, fontStyle: 'italic', fontFamily: fonts.body },

        receiptCard: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: C.white,
            padding: spacing.md,
            borderRadius: radii.md,
            marginBottom: spacing.sm,
        },
        receiptInfo: { flex: 1 },
        receiptName: { fontFamily: fonts.bodySemiBold, fontSize: fontSizes.md, color: C.black },
        receiptDate: { fontFamily: fonts.body, fontSize: fontSizes.xs, color: C.gray600, marginTop: 2 },
        receiptTotal: { fontFamily: fonts.bodySemiBold, fontSize: fontSizes.lg, color: C.green },

        deleteAction: {
            backgroundColor: C.error,
            justifyContent: 'center',
            alignItems: 'center',
            width: 80,
            borderRadius: radii.md,
            marginBottom: spacing.sm,
        },
        viewAction: {
            backgroundColor: C.green,
            justifyContent: 'center',
            alignItems: 'center',
            width: 80,
            borderRadius: radii.md,
            marginBottom: spacing.sm,
        },

        loadMoreButton: { padding: spacing.md, alignItems: 'center', marginVertical: spacing.sm },
        loadMoreText: { color: C.green, fontSize: fontSizes.md, fontFamily: fonts.body },
    });
}

export default function History() {
    const C = useThemeColors();
    const styles = useMemo(() => createStyles(C), [C]);
    const router = useRouter();

    const { receipts, loading, hasMore, fetchReceipts, deleteReceipt: contextDeleteReceipt, refreshReceipts } = useHistory();
    const [loadingMore, setLoadingMore] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

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
            Alert.alert('Delete failed', getUserFacingErrorMessage(error, 'We could not delete that receipt right now.'));
        }
    };

    const renderLeftActions = (receipt: Receipt) => (
        <TouchableOpacity
            style={styles.viewAction}
            onPress={() => router.push(`/receipt/${receipt.id}`)}
        >
            <MaterialIcons name="open-in-new" size={28} color="#FFFFFF" />
        </TouchableOpacity>
    );

    const renderRightActions = (receipt: Receipt) => (
        <TouchableOpacity
            style={styles.deleteAction}
            onPress={() => handleDelete(receipt.id)}
        >
            <MaterialIcons name="delete" size={28} color="#FFFFFF" />
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
                        tintColor={C.green}
                    />
                }
            >
                {loading ? (
                    <HistorySkeleton />
                ) : receipts.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyTitle}>No receipts yet</Text>
                        <Text style={styles.emptySubtitle}>Tap the logo to scan your first one!</Text>
                    </View>
                ) : (
                    <>
                        <Text style={styles.swipeHint}>Swipe right to view, left to delete</Text>
                        {receipts.map((receipt) => (
                            <Swipeable
                                key={receipt.id}
                                renderLeftActions={() => renderLeftActions(receipt)}
                                renderRightActions={() => renderRightActions(receipt)}
                                leftThreshold={40}
                                rightThreshold={40}
                            >
                                <GHTouchableOpacity
                                    style={styles.receiptCard}
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

        </SafeAreaView>
    );
}
