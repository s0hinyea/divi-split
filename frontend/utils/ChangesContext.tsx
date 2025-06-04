import React, { createContext, useContext, useState, ReactNode } from "react";
import { ReceiptItem } from "./ReceiptContext";
import { useReceipt } from "./ReceiptContext";

export type Change = {
	type: string;
	id: string;
	previous: ReceiptItem;
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
	const { updateItem, removeItem, addItem, receiptData } = useReceipt();

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
							addItem(lastChange.previous);
							break;
						case "ADD":
							removeItem(lastChange.id);
							break;
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
