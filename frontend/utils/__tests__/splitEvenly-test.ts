import { splitItemsEvenly } from '../splitEvenly';

describe('splitItemsEvenly', () => {
  it('creates persistable assignments while preserving the exact subtotal', () => {
    const result = splitItemsEvenly([
      { id: 'pizza', name: 'Pizza', price: 10, category: 'entree' },
      { id: 'drinks', name: 'Drinks', price: 5.01, category: 'drink' },
    ], 3);

    const savedIds = new Set(result.items.map((item) => item.id));
    const assignedItems = result.participantItems.flat();
    const savedCents = result.items.reduce((sum, item) => sum + Math.round(item.price * 100), 0);
    const participantCents = result.participantItems.map((items) =>
      items.reduce((sum, item) => sum + Math.round(item.price * 100), 0),
    );

    expect(savedCents).toBe(1501);
    expect(savedIds.size).toBe(result.items.length);
    expect(
      result.items
        .filter((item) => item.name === 'Pizza')
        .reduce((sum, item) => sum + Math.round(item.price * 100), 0),
    ).toBe(1000);
    expect(
      result.items
        .filter((item) => item.name === 'Drinks')
        .reduce((sum, item) => sum + Math.round(item.price * 100), 0),
    ).toBe(501);
    expect(assignedItems).toHaveLength(result.items.length);
    expect(assignedItems.every((item) => savedIds.has(item.id))).toBe(true);
    expect(Math.max(...participantCents) - Math.min(...participantCents)).toBeLessThanOrEqual(1);
  });

  it('does not create zero-dollar rows when an item costs less than the participant count', () => {
    const result = splitItemsEvenly([
      { id: 'small', name: 'Small charge', price: 0.02 },
    ], 3);

    expect(result.items).toHaveLength(2);
    expect(result.items.every((item) => item.price === 0.01)).toBe(true);
    expect(result.participantItems.map((items) => items.length)).toEqual([1, 1, 0]);
  });

  it('rejects an invalid participant count', () => {
    expect(() => splitItemsEvenly([], 0)).toThrow('participantCount must be a positive integer');
  });
});
