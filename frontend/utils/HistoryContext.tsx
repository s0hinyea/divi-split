import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { SessionContext } from '../app/_layout';
import { Config } from '@/constants/Config';

export interface Receipt {
    id: string;
    receipt_name: string;
    total_amount: number;
    created_at: string;
    receipt_items: { id: string; item_name: string; item_price: number }[];
}

type HistoryContextType = {
    receipts: Receipt[];
    loading: boolean;
    hasMore: boolean;
    fetchReceipts: (loadMore?: boolean) => Promise<void>;
    addReceipt: (receipt: Receipt) => void;
    deleteReceipt: (id: string) => Promise<void>;
    refreshReceipts: () => Promise<void>;
};

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

export function HistoryProvider({ children }: { children: ReactNode }) {
    const { session } = useContext(SessionContext);
    const [receipts, setReceipts] = useState<Receipt[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    const fetchReceipts = async (loadMore = false) => {
        if (!session?.access_token) return;

        try {
            if (!loadMore) setLoading(true);

            const offset = loadMore ? receipts.length : 0;
            // Fetch a good chunk initially (50) to make stats reasonably accurate
            // History screen can load more as user scrolls
            const limit = 50;

            const response = await fetch(`${Config.BACKEND_URL}/receipts?limit=${limit}&offset=${offset}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${session.access_token}` },
            });

            if (response.ok) {
                const data = await response.json();
                const newReceipts = data.receipts || [];

                if (loadMore) {
                    // Filter out duplicates just in case
                    setReceipts(prev => {
                        const existingIds = new Set(prev.map(r => r.id));
                        const uniqueNew = newReceipts.filter((r: Receipt) => !existingIds.has(r.id));
                        return [...prev, ...uniqueNew];
                    });
                } else {
                    setReceipts(newReceipts);
                }

                setHasMore(data.hasMore || newReceipts.length === limit);
            }
        } catch (error) {
            console.error('Error fetching receipts:', error);
        } finally {
            setLoading(false);
        }
    };

    const refreshReceipts = async () => {
        await fetchReceipts(false);
    };

    const addReceipt = (newReceipt: Receipt) => {
        setReceipts(prev => [newReceipt, ...prev]);
        // Ideally we would also verify with backend or re-fetch, but optimistic update is faster
    };

    const deleteReceipt = async (id: string) => {
        // Optimistic update
        const originalReceipts = [...receipts];
        setReceipts(prev => prev.filter(r => r.id !== id));

        try {
            if (!session?.access_token) throw new Error("No session");

            const response = await fetch(`${Config.BACKEND_URL}/receipts/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${session.access_token}` },
            });

            if (!response.ok) {
                throw new Error("Failed to delete");
            }
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
        } else {
            setReceipts([]);
        }
    }, [session]);

    return (
        <HistoryContext.Provider value={{
            receipts,
            loading,
            hasMore,
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
