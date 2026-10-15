import {
  getMaxNonZeroSplitCount,
  getSplitPriceRange,
  splitAmountIntoCents,
} from '../moneySplit';

describe('money splitting', () => {
  it('preserves every cent in an uneven three-way split', () => {
    const portions = splitAmountIntoCents(10, 3);

    expect(portions).toEqual([334, 333, 333]);
    expect(portions.reduce((sum, cents) => sum + cents, 0)).toBe(1000);
  });

  it('rotates the recipient of remainder pennies', () => {
    expect(splitAmountIntoCents(5.01, 3, 1)).toEqual([167, 167, 167]);
    expect(splitAmountIntoCents(0.02, 3, 1)).toEqual([0, 1, 1]);
  });

  it('reports the honest price range shown in the split modal', () => {
    expect(getSplitPriceRange(10, 3)).toEqual({
      minimumCents: 333,
      maximumCents: 334,
    });
    expect(getSplitPriceRange(12, 3)).toEqual({
      minimumCents: 400,
      maximumCents: 400,
    });
  });

  it('does not offer more non-zero portions than available pennies', () => {
    expect(getMaxNonZeroSplitCount(0.02, 8)).toBe(2);
    expect(getMaxNonZeroSplitCount(10, 8)).toBe(8);
  });

  it('rejects invalid inputs', () => {
    expect(() => splitAmountIntoCents(10, 0)).toThrow('count must be a positive integer');
    expect(() => splitAmountIntoCents(-1, 2)).toThrow('amount must be a non-negative finite number');
  });
});
