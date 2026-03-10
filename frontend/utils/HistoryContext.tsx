import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { SessionContext } from '../app/_layout';

export interface Receipt {
    id: string;
    receipt_name: string;
    total_amount: number;
    tax_amount: number;
    tip_amount: number;
    created_at: string;
    receipt_items: { id: string; item_name: string; item_price: number }[];
}

type HistoryContextType = {
    receipts: Receipt[];
    loading: boolean;
    hasMore: boolean;
    monthlyTotal: number;
    totalCount: number;
    fetchReceipts: (loadMore?: boolean) => Promise<void>;
    addReceipt: (receipt: Receipt) => void;
    deleteReceipt: (id: string) => Promise<void>;
    refreshReceipts: () => Promise<void>;
};

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

const PAGE_LIMIT = 5;

export function HistoryProvider({ children }: { children: ReactNode }) {
    const { session } = useContext(SessionContext);
    const [receipts, setReceipts] = useState<Receipt[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [monthlyTotal, setMonthlyTotal] = useState(0);
    const [totalCount, setTotalCount] = useState(0);

    // Lightweight query for Dashboard stats — independent of pagination
    const fetchStats = async () => {
        if (!session?.user) return;
        try {
            // Total count of all receipts
            const { count } = await supabase
                .from('receipts')
                .select('id', { count: 'exact', head: true });
            setTotalCount(count ?? 0);

            // Sum of totals for current month
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
            const { data: monthData } = await supabase
                .from('receipts')
                .select('total_amount')
                .gte('created_at', startOfMonth);
            const sum = (monthData ?? []).reduce((s, r) => s + (r.total_amount || 0), 0);
            setMonthlyTotal(sum);
        } catch (err) {
            console.error('Error fetching stats:', err);
        }
    };

    const fetchReceipts = async (loadMore = false) => {
        if (!session?.user) return;

        try {
            // Only show full loading state on first load (no data yet).
            // On refresh, existing data stays visible while we fetch.
            if (!loadMore && receipts.length === 0) setLoading(true);

            const offset = loadMore ? receipts.length : 0;

            // Query directly via Supabase JS client — RLS ensures user only sees their own data
            const { data, error, count } = await supabase
                .from('receipts')
                .select(`
                    id,
                    receipt_name,
                    total_amount,
                    tax_amount,
                    tip_amount,
                    created_at,
                    receipt_items (
                        id,
                        item_name,
                        item_price
                    )
                `, { count: 'exact' })
                .order('created_at', { ascending: false })
                .range(offset, offset + PAGE_LIMIT - 1);

            if (error) throw error;

            const newReceipts = (data as Receipt[]) || [];

            if (loadMore) {
                setReceipts(prev => {
                    const existingIds = new Set(prev.map(r => r.id));
                    const uniqueNew = newReceipts.filter(r => !existingIds.has(r.id));
                    return [...prev, ...uniqueNew];
                });
            } else {
                setReceipts(newReceipts);
            }

            setHasMore(newReceipts.length === PAGE_LIMIT);
        } catch (error) {
            console.error('Error fetching receipts:', error);
        } finally {
            setLoading(false);
        }
    };

    const refreshReceipts = async () => {
        await Promise.all([fetchReceipts(false), fetchStats()]);
    };

    const addReceipt = (newReceipt: Receipt) => {
        setReceipts(prev => [newReceipt, ...prev]);
    };

    const deleteReceipt = async (id: string) => {
        // Optimistic update
        const originalReceipts = [...receipts];
        setReceipts(prev => prev.filter(r => r.id !== id));

        try {
            if (!session?.user) throw new Error("No session");

            // Delete items first (in case no cascade is set up)
            await supabase
                .from('receipt_items')
                .delete()
                .eq('receipt_id', id);

            // Delete the receipt — RLS ensures user can only delete their own
            const { error } = await supabase
                .from('receipts')
                .delete()
                .eq('id', id);

            if (error) throw error;

        } catch (error) {
            console.error("Error deleting receipt:", error);
            // Revert on error
            setReceipts(originalReceipts);
            throw error;
        }
    };

    useEffect(() => {
        if (session?.user) {
            fetchReceipts();
            fetchStats();
        } else {
            setReceipts([]);
            setMonthlyTotal(0);
            setTotalCount(0);
        }
    }, [session]);

    return (
        <HistoryContext.Provider value={{
            receipts,
            loading,
            hasMore,
            monthlyTotal,
            totalCount,
            fetchReceipts,
            addReceipt,
            deleteReceipt,
            refreshReceipts
        }}>
            {children}
        </HistoryContext.Provider>
    );
}

export function useHistory() {
    const context = useContext(HistoryContext);
    if (context === undefined) {
        throw new Error('useHistory must be used within a HistoryProvider');
    }
    return context;
}
