import React, { createContext, useContext, useState, ReactNode } from "react";
import { ReceiptItem, useSplitStore } from "../stores/splitStore";

export type Change = {
	type: string;
	id: string;
	previous: ReceiptItem;
	splitChildIds?: string[];
	index?: number;
	previousAmount?: number; // used by SET_TAX and SET_TIP
};

type ChangeContextType = {
	changes: Change[];
	addChange: (change: Change) => void;
	undoChange: () => void;
	clearChanges: () => void;
};

const ChangeContext = createContext<ChangeContextType | undefined>(undefined);

export function ChangeProvider({ children }: { children: ReactNode }) {
	const [changes, setChanges] = useState<Change[]>([]);
	const updateItem = useSplitStore((state) => state.updateItem);
	const removeItem = useSplitStore((state) => state.removeItem);
	const addItem = useSplitStore((state) => state.addItem);
	const insertItemAt = useSplitStore((state) => state.insertItemAt);
	const updateReceiptData = useSplitStore((state) => state.updateReceiptData);
	const receiptData = useSplitStore((state) => state.receiptData);

	const addChange = (change: Change) => {
		setChanges((prevChanges) => [...prevChanges, change]);
	};

	const undoChange = () => {
		const items = "items" in receiptData ? receiptData.items : [];
		if (changes) {
			setChanges((prevChanges) => {
				const newChanges = [...prevChanges];
				const lastChange = newChanges.pop();
				if (lastChange) {
					switch (lastChange.type) {
						case "EDIT_NAME": {
							const item = items.find(
								(it) => it.id === lastChange.id
							);
							if (item)
								updateItem(lastChange.id, {
									...item,
									name: lastChange.previous.name,
								});
							break;
						}
						case "EDIT_PRICE": {
							const item = items.find(
								(it) => it.id === lastChange.id
							);
							if (item)
								updateItem(lastChange.id, {
									...item,
									price: lastChange.previous.price,
								});
							break;
						}
						case "DELETE":
							if (lastChange.index !== undefined) {
								insertItemAt(lastChange.index, lastChange.previous);
							} else {
								addItem(lastChange.previous);
							}
							break;
						case "ADD":
							removeItem(lastChange.id);
							break;
						case "SET_TAX": {
							if (lastChange.previousAmount !== undefined) {
								updateReceiptData({ tax: lastChange.previousAmount });
							}
							break;
						}
						case "SET_TIP": {
							if (lastChange.previousAmount !== undefined) {
								updateReceiptData({ tip: lastChange.previousAmount });
							}
							break;
						}
						case "SPLIT": {
							// Find position of first child before removing
							const currentItems = useSplitStore.getState().receiptData.items;
							const firstChildIndex = lastChange.splitChildIds
								? currentItems.findIndex((it) => it.id === lastChange.splitChildIds![0])
								: -1;
							const restoreIndex = firstChildIndex !== -1 ? firstChildIndex : (lastChange.index ?? currentItems.length);

							// Remove the two split children
							if (lastChange.splitChildIds) {
								lastChange.splitChildIds.forEach((childId) => removeItem(childId));
							}
							// Re-insert the original item at its original position
							insertItemAt(restoreIndex, lastChange.previous);
							break;
						}
					}
				}

				return newChanges;
			});
		} else {
			return;
		}
	};

	const clearChanges = () => {
		setChanges([]);
	};

	const value = {
		changes,
		addChange,
		undoChange,
		clearChanges,
	};

	return (
		<ChangeContext.Provider value={value}>
			{children}
		</ChangeContext.Provider>
	);
}

export function useChange() {
	const context = useContext(ChangeContext);
	if (context === undefined) {
		throw new Error("useChange must be used within a ChangeProvider");
	}
	return context;
}
