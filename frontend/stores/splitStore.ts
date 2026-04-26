import { create } from "zustand";
import { supabase } from "../lib/supabase";

export type ItemCategory = 'drink' | 'appetizer' | 'entree' | 'dessert' | 'side' | 'other';

export type ReceiptItem = {
    name: string;
    price: number;
    id: string;
    category?: ItemCategory;
};

export type OCRResponse = {
    text: string;
    items: ReceiptItem[];
    total?: number;
    tax?: number;
    tip?: number;
    userItems?: ReceiptItem[];
    confidence?: 'high' | 'low';
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
    insertItemAt: (index: number, item: ReceiptItem) => void;
    removeItem: (id: string) => void;
    splitItem: (id: string) => string[];
    setUserItems: (items: ReceiptItem[]) => void;
    saveReceipt: (receiptName: string, receiptDate?: Date) => Promise<boolean>;
    calculateTotal: (items: any[]) => number;

    selected: Contact[];
    updateContactName: (id: string, newName: string) => void;
    manageContacts: (newContact: Contact) => void;
    manageItems: (newItem: ReceiptItem, currentContact: Contact) => void;
    clearItems: () => void;
    clearSelected: () => void;

    // Edit-mode state
    editingReceiptId: string | null;
    editingReceiptName: string;
    editingReceiptCreatedAt: string;
    hydrateForEdit: (
        receiptId: string,
        receiptData: OCRResponse,
        contacts: Contact[],
        receiptName: string,
        createdAt: string,
    ) => void;
    updateReceipt: (receiptId: string, receiptName: string, receiptDate?: Date) => Promise<boolean>;

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
    editingReceiptId: null,
    editingReceiptName: '',
    editingReceiptCreatedAt: '',

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

    insertItemAt: (index, item) =>
        set((state) => {
            const newItems = [...state.receiptData.items];
            const safeIndex = Math.min(index, newItems.length);
            newItems.splice(safeIndex, 0, item);
            return { receiptData: { ...state.receiptData, items: newItems } };
        }),

    removeItem: (id) =>
        set((state) => {
            const newItems = state.receiptData.items.filter((it) => it.id !== id);
            const newUserItems = (state.receiptData.userItems ?? []).filter((it) => it.id !== id);
            const newSelected = state.selected.map((contact) => ({
                ...contact,
                items: contact.items.filter((it) => it.id !== id),
            }));
            return {
                receiptData: { ...state.receiptData, items: newItems, userItems: newUserItems },
                selected: newSelected,
            };
        }),

    splitItem: (id) => {
            const state = get();
            const index = state.receiptData.items.findIndex((it) => it.id === id);
            if (index === -1) return [];

            const originalItem = state.receiptData.items[index];
            if (originalItem.price <= 0.01) return [];

            const rawHalf = originalItem.price / 2;
            const half1 = Math.ceil(rawHalf * 100) / 100;
            const half2 = Math.floor(rawHalf * 100) / 100;

            const getId = () => 
                typeof crypto !== 'undefined' && crypto.randomUUID 
                    ? crypto.randomUUID() 
                    : Math.random().toString(36).substring(2, 10);

            const item1: ReceiptItem = {
                id: getId(),
                name: originalItem.name,
                price: half1,
            };

            const item2: ReceiptItem = {
                id: getId(),
                name: originalItem.name,
                price: half2,
            };

            const newItems = [...state.receiptData.items];
            newItems.splice(index, 1, item1, item2);

            set({ receiptData: { ...state.receiptData, items: newItems } });
            return [item1.id, item2.id];
        },

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

    hydrateForEdit: (receiptId, receiptData, contacts, receiptName, createdAt) =>
        set({
            editingReceiptId: receiptId,
            editingReceiptName: receiptName,
            editingReceiptCreatedAt: createdAt,
            receiptData,
            selected: contacts,
        }),

    updateReceipt: async (receiptId: string, receiptName: string, receiptDate?: Date) => {
        const state = get();
        try {
            const payload = {
                receipt_id: receiptId,
                receipt_name: receiptName || "Untitled Receipt",
                total_amount: state.receiptData.total || 0,
                tax_amount: state.receiptData.tax || 0,
                tip_amount: state.receiptData.tip || 0,
                created_at: receiptDate?.toISOString() || new Date().toISOString(),
                items: (state.receiptData.items || []).map((item) => ({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                })),
                contacts: (state.selected || []).map((contact) => ({
                    frontend_id: contact.id,
                    name: contact.name,
                    phone_number: contact.phoneNumber || "no-phone",
                    item_ids: (contact.items || []).map((item) => item.id),
                })),
            };

            const { data, error } = await supabase.rpc("update_receipt_split", { payload });
            if (error) throw error;
            console.log("Receipt updated atomically:", data);
            return true;
        } catch (error) {
            console.error("Update receipt error:", error);
            return false;
        }
    },

    resetStore: () => set({
        receiptData: initialReceiptData,
        selected: [],
        editingReceiptId: null,
        editingReceiptName: '',
        editingReceiptCreatedAt: '',
    }),

    // Completion overlay actions
    triggerCompletion: () => set({ showCompletion: true }),
    clearCompletion: () => set({ showCompletion: false }),
}));
