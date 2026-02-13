import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useContext } from 'react';
import { useRouter } from 'expo-router';
import { colors, fonts, fontSizes, spacing, radii, shadows } from '@/styles/theme';
import { Config } from '@/constants/Config';
import { supabase } from '@/lib/supabase';
import { SessionContext } from '@/app/_layout';

// Receipt type (shared — should move to a types file eventually)
interface Receipt {
    id: string;
    receipt_name: string;
    total_amount: number;
    created_at: string;
    receipt_items: { id: string; item_name: string; item_price: number }[];
}

// ─── Receipt-shaped card with torn/zig-zag edges ───
function ReceiptCard({ children, style }: { children: React.ReactNode; style?: any }) {
    return (
        <View style={[styles.receiptCard, style]}>
            {/* Top zig-zag edge */}
            <View style={styles.zigzagRow}>
                {Array.from({ length: 12 }).map((_, i) => (
                    <View key={`top-${i}`} style={styles.zigzagTriangle} />
                ))}
            </View>

            {/* Card content */}
            <View style={styles.receiptCardContent}>
                {children}
            </View>

            {/* Bottom zig-zag edge */}
            <View style={[styles.zigzagRow, styles.zigzagBottom]}>
                {Array.from({ length: 12 }).map((_, i) => (
                    <View key={`bot-${i}`} style={styles.zigzagTriangle} />
                ))}
            </View>
        </View>
    );
}

// ─── Decorative lines inside receipt card ───
function ReceiptLines() {
    return (
        <View style={styles.receiptLines}>
            <View style={[styles.receiptLine, { width: '70%' }]} />
            <View style={[styles.receiptLine, { width: '50%' }]} />
            <View style={[styles.receiptLine, { width: '60%' }]} />
        </View>
    );
}

// ─── Star connector decoration ───
function StarConnector() {
    return (
        <Text style={styles.star}>✦</Text>
    );
}

export default function Dashboard() {
    const router = useRouter();
    const { session } = useContext(SessionContext);
    const [receipts, setReceipts] = useState<Receipt[]>([]);
    const [loading, setLoading] = useState(true);

    // Get time-based greeting
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    // Get user's first name from email
    const getUserName = () => {
        const email = session?.user?.email || '';
        const name = email.split('@')[0];
        // Capitalize first letter
        return name.charAt(0).toUpperCase() + name.slice(1);
    };

    // Fetch recent receipts
    useEffect(() => {
        fetchReceipts();
    }, []);

    const fetchReceipts = async () => {
        try {
            setLoading(true);
            const { data: { session: currentSession } } = await supabase.auth.getSession();
            const token = currentSession?.access_token;
            if (!token) return;

            const response = await fetch(`${Config.BACKEND_URL}/receipts?limit=5&offset=0`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                setReceipts(data.receipts || []);
            }
        } catch (error) {
            console.error('Error fetching receipts:', error);
        } finally {
            setLoading(false);
        }
    };

    // Compute stats
    const now = new Date();
    const monthlyReceipts = receipts.filter(r => {
        const d = new Date(r.created_at);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const monthlyTotal = monthlyReceipts.reduce((sum, r) => sum + (r.total_amount || 0), 0);
    const totalScanned = receipts.length;
    const recentTwo = receipts.slice(0, 2);

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Greeting */}
                <Text style={styles.greeting}>{getGreeting()},</Text>
                <Text style={styles.userName}>{getUserName()}.</Text>

                {/* Stat cards row */}
                <View style={styles.statRow}>
                    {/* Left stat: $ split this month */}
                    <ReceiptCard style={styles.statCard}>
                        <Text style={styles.statAmount}>${monthlyTotal.toFixed(0)}</Text>
                        <Text style={styles.statLabel}>split this month</Text>
                        <ReceiptLines />
                    </ReceiptCard>

                    {/* Star connector — staggered */}
                    <View style={styles.starColumn}>
                        <StarConnector />
                        <View style={{ height: spacing.lg }} />
                        <StarConnector />
                    </View>

                    {/* Right stat: receipts scanned */}
                    <ReceiptCard style={[styles.statCard, { marginTop: spacing.lg }]}>
                        <Text style={styles.statAmount}>{totalScanned}</Text>
                        <Text style={styles.statLabel}>receipts scanned</Text>
                        <ReceiptLines />
                    </ReceiptCard>
                </View>

                {/* Star between stat row and recent receipts */}
                <View style={styles.centerStar}>
                    <StarConnector />
                </View>

                {/* Recent receipts container */}
                <ReceiptCard style={styles.recentContainer}>
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
        backgroundColor: colors.white,
    },
    scrollContent: {
        padding: spacing.lg,
        paddingBottom: spacing.xxxl,
    },

    // Greeting
    greeting: {
        fontFamily: fonts.body,
        fontSize: fontSizes.lg,
        color: colors.black,
        marginTop: spacing.md,
    },
    userName: {
        fontFamily: fonts.header,
        fontSize: fontSizes.xxl,
        color: colors.black,
        marginBottom: spacing.xl,
    },

    // Receipt card shape
    receiptCard: {
        backgroundColor: colors.white,
        borderWidth: 1.5,
        borderColor: colors.black,
        overflow: 'hidden',
    },
    receiptCardContent: {
        padding: spacing.md,
    },
    zigzagRow: {
        flexDirection: 'row',
        overflow: 'hidden',
        height: 10,
    },
    zigzagBottom: {
        transform: [{ rotate: '180deg' }],
    },
    zigzagTriangle: {
        width: 0,
        height: 0,
        borderLeftWidth: 7,
        borderRightWidth: 7,
        borderBottomWidth: 10,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderBottomColor: colors.gray200,
    },

    // Stat cards
    statRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    statCard: {
        flex: 1,
    },
    statAmount: {
        fontFamily: fonts.header,
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

    // Decorative receipt lines
    receiptLines: {
        gap: 6,
        marginTop: spacing.sm,
    },
    receiptLine: {
        height: 2,
        backgroundColor: colors.gray200,
        borderRadius: 1,
    },

    // Star connectors
    starColumn: {
        alignItems: 'center',
        paddingHorizontal: spacing.sm,
    },
    star: {
        fontSize: 14,
        color: colors.gray400,
    },
    centerStar: {
        alignItems: 'center',
        marginBottom: spacing.sm,
    },

    // Recent receipts
    recentContainer: {
        width: '100%',
    },
    recentTitle: {
        fontFamily: fonts.header,
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
        fontFamily: fonts.body,
        fontSize: fontSizes.md,
        color: colors.black,
        fontWeight: '600',
    },
    recentItemDate: {
        fontFamily: fonts.body,
        fontSize: fontSizes.xs,
        color: colors.gray600,
        marginTop: 2,
    },
    recentItemAmount: {
        fontFamily: fonts.header,
        fontSize: fontSizes.lg,
        color: colors.green,
        fontWeight: 'bold',
    },

    // View all
    viewAllButton: {
        marginTop: spacing.md,
        alignItems: 'center',
    },
    viewAllText: {
        fontFamily: fonts.body,
        fontSize: fontSizes.sm,
        color: colors.green,
        fontWeight: '600',
    },

    // Empty state
    emptyState: {
        alignItems: 'center',
        paddingVertical: spacing.xl,
    },
    emptyTitle: {
        fontFamily: fonts.body,
        fontSize: fontSizes.md,
        color: colors.gray600,
        fontWeight: '600',
    },
    emptySubtitle: {
        fontFamily: fonts.body,
        fontSize: fontSizes.sm,
        color: colors.gray400,
        marginTop: spacing.xs,
    },

    // Loading
    loadingText: {
        fontFamily: fonts.body,
        fontSize: fontSizes.sm,
        color: colors.gray400,
        textAlign: 'center',
        paddingVertical: spacing.xl,
    },
});
