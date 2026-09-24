import type { ReceiptItem } from '@/stores/splitStore';
import { splitAmountIntoCents } from '@/utils/moneySplit';

export type EvenSplitResult = {
  items: ReceiptItem[];
  participantItems: ReceiptItem[][];
};

/**
 * Converts each receipt item into real, persistable child items and assigns
 * one child to each participant. Remainder pennies rotate between people so
 * participant subtotals stay within one cent of each other.
 */
export function splitItemsEvenly(
  items: ReceiptItem[],
  participantCount: number,
): EvenSplitResult {
  if (!Number.isInteger(participantCount) || participantCount < 1) {
    throw new Error('participantCount must be a positive integer');
  }

  const participantItems = Array.from(
    { length: participantCount },
    () => [] as ReceiptItem[],
  );
  const splitItems: ReceiptItem[] = [];
  let remainderCursor = 0;

  items.forEach((item, itemIndex) => {
    const totalCents = Math.round(item.price * 100);
    const remainder = totalCents % participantCount;
    const allocatedCentsByParticipant = splitAmountIntoCents(
      item.price,
      participantCount,
      remainderCursor,
    );

    for (let participantIndex = 0; participantIndex < participantCount; participantIndex += 1) {
      const allocatedCents = allocatedCentsByParticipant[participantIndex];
      if (allocatedCents === 0) continue;

      const child: ReceiptItem = {
        id: `even_${item.id}_${itemIndex}_${participantIndex}`,
        name: item.name,
        price: allocatedCents / 100,
        category: item.category,
      };

      splitItems.push(child);
      participantItems[participantIndex].push(child);
    }

    remainderCursor = (remainderCursor + remainder) % participantCount;
  });

  return { items: splitItems, participantItems };
}
