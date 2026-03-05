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
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                console.error("No authenticated user");
                return false;
            }

            // 1. Insert receipt
            const { data: receipt, error: receiptError } = await supabase
                .from("receipts")
                .insert({
                    user_id: user.id,
                    receipt_name: receiptName || "Untitled Receipt",
                    total_amount: state.receiptData.total || 0,
                    tax_amount: state.receiptData.tax || 0,
                    tip_amount: state.receiptData.tip || 0,
                    created_at: receiptDate?.toISOString() ||
                        new Date().toISOString(),
                })
                .select()
                .single();

            if (receiptError) throw receiptError;

            let frontendToDbItemMap: Record<string, string> = {};
            if (state.receiptData.items && state.receiptData.items.length > 0) {
                const itemsToInsert = state.receiptData.items.map((item) => ({
                    receipt_id: receipt.id,
                    item_name: item.name,
                    item_price: item.price,
                }));

                const { data: insertedItems, error: itemsError } =
                    await supabase
                        .from("receipt_items")
                        .insert(itemsToInsert)
                        .select();

                if (itemsError) throw itemsError;

                state.receiptData.items.forEach((item, index) => {
                    if (insertedItems?.[index]) {
                        frontendToDbItemMap[item.id] = insertedItems[index].id;
                    }
                });
            }

            if (state.selected && state.selected.length > 0) {
                for (const contact of state.selected) {
                    const { data: insertedContact, error: contactError } =
                        await supabase
                            .from("contacts")
                            .insert({
                                user_id: user.id,
                                contact_name: contact.name,
                                phone_number: contact.phoneNumber,
                                contact_id: contact.id,
                            })
                            .select()
                            .single();

                    if (contactError) {
                        console.error(
                            "Contact insert error:",
                            contactError.message,
                        );
                        continue;
                    }

                    if (contact.items && contact.items.length > 0) {
                        const assignments = contact.items
                            .map((item) => ({
                                item_id: frontendToDbItemMap[item.id],
                                contact_id: insertedContact.id,
                            }))
                            .filter((a) => a.item_id);

                        if (assignments.length > 0) {
                            const { error: assignmentError } = await supabase
                                .from("assignments")
                                .insert(assignments);
                            if (assignmentError) {
                                console.error(
                                    "Assignment error:",
                                    assignmentError.message,
                                );
                            }
                        }
                    }
                }
            }

            console.log("Receipt saved successfully via Zustand state");
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
