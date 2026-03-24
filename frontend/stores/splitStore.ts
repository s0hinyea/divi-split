import { create } from "zustand";
import { supabase } from "../lib/supabase";

export type ReceiptItem = {
    name: string;
    price: number;
    id: string;
};

export type OCRResponse = {
    text: string;
    items: ReceiptItem[];
    total?: number;
    tax: number;
    tip?: number;
    userItems?: ReceiptItem[];
};

export type Contact = {
    id: string;
    name: string;
    phoneNumber: string | undefined;
    image?: { uri: string } | undefined;
    items: ReceiptItem[];
};

interface SplitState {
    receiptData: OCRResponse;
    updateReceiptData: (data: Partial<OCRResponse>) => void;
    updateItem: (id: string, item: ReceiptItem) => void;
    addItem: (item: ReceiptItem) => void;
    removeItem: (id: string) => void;
    setUserItems: (items: ReceiptItem[]) => void;
    saveReceipt: (receiptName: string, receiptDate?: Date) => Promise<boolean>;
    calculateTotal: (items: any[]) => number;

    selected: Contact[];
    updateContactName: (id: string, newName: string) => void;
    manageContacts: (newContact: Contact) => void;
    manageItems: (newItem: ReceiptItem, currentContact: Contact) => void;
    clearItems: () => void;
    clearSelected: () => void;

    resetStore: () => void;
    // Completion overlay
    showCompletion: boolean;
    triggerCompletion: () => void;
    clearCompletion: () => void;
}

const initialReceiptData: OCRResponse = {
    text: "",
    items: [],
    tax: 0,
    total: 0,
    tip: 0,
    userItems: [],
};

export const useSplitStore = create<SplitState>((set, get) => ({
    receiptData: initialReceiptData,
    selected: [],
    showCompletion: false,

    updateReceiptData: (data) =>
        set((state) => ({
            receiptData: { ...state.receiptData, ...data },
        })),

    setUserItems: (items) =>
        set((state) => ({
            receiptData: { ...state.receiptData, userItems: items },
        })),

    updateItem: (id, item) =>
        set((state) => {
            const newItems = state.receiptData.items.map((
                it,
            ) => (it.id === id ? item : it));
            return { receiptData: { ...state.receiptData, items: newItems } };
        }),

    addItem: (item) =>
        set((state) => ({
            receiptData: {
                ...state.receiptData,
                items: [...state.receiptData.items, item],
            },
        })),

    removeItem: (id) =>
        set((state) => {
            const newItems = state.receiptData.items.filter((it) =>
                it.id !== id
            );
            return { receiptData: { ...state.receiptData, items: newItems } };
        }),

    calculateTotal: (items: any[]) => {
        return items.reduce((sum, item) => sum + item.price, 0);
    },

    saveReceipt: async (receiptName: string, receiptDate?: Date) => {
        const state = get();
        try {
            // Build the full payload for the server-side transaction
            const payload = {
                receipt_name: receiptName || "Untitled Receipt",
                total_amount: state.receiptData.total || 0,
                tax_amount: state.receiptData.tax || 0,
                tip_amount: state.receiptData.tip || 0,
                created_at: receiptDate?.toISOString() || new Date().toISOString(),

                // All line items
                items: (state.receiptData.items || []).map((item) => ({
                    id: item.id,       // frontend id for mapping
                    name: item.name,
                    price: item.price,
                })),

                // All contacts with their assigned item ids
                contacts: (state.selected || []).map((contact) => ({
                    frontend_id: contact.id,
                    name: contact.name,
                    phone_number: contact.phoneNumber || "no-phone",
                    item_ids: (contact.items || []).map((item) => item.id),
                })),
            };

            // Single atomic RPC call — everything saves or nothing does
            const { data, error } = await supabase.rpc(
                "save_receipt_transaction",
                { payload },
            );

            if (error) throw error;

            console.log("Receipt saved atomically:", data);
            return true;
        } catch (error) {
            console.error("Save receipt error:", error);
            return false;
        }
    },

    // --- Contacts Actions ---
    updateContactName: (id, newName) =>
        set((state) => ({
            selected: state.selected.map((contact) =>
                contact.id === id ? { ...contact, name: newName } : contact
            ),
        })),

    manageContacts: (newContact) =>
        set((state) => {
            const isSelected = state.selected.some((contact) =>
                contact.id === newContact.id
            );
            if (isSelected) {
                return {
                    selected: state.selected.filter((contact) =>
                        contact.id !== newContact.id
                    ),
                };
            } else {
                return { selected: [...state.selected, newContact] };
            }
        }),

    manageItems: (newItem, currentContact) =>
        set((state) => ({
            selected: state.selected.map((contact) => {
                if (contact.id === currentContact.id) {
                    const hasItem = contact.items?.some((it) =>
                        it.id === newItem.id
                    );
                    if (hasItem) {
                        return {
                            ...contact,
                            items: contact.items?.filter((it) =>
                                it.id !== newItem.id
                            ),
                        };
                    }
                    return {
                        ...contact,
                        items: [...(contact.items || []), newItem],
                    };
                }
                return contact;
            }),
        })),

    clearItems: () =>
        set((state) => ({
            selected: state.selected.map((contact) => ({
                ...contact,
                items: [],
            })),
        })),

    clearSelected: () => set({ selected: [] }),

    resetStore: () => set({ receiptData: initialReceiptData, selected: [] }),

    // Completion overlay actions
    triggerCompletion: () => set({ showCompletion: true }),
    clearCompletion: () => set({ showCompletion: false }),
}));
