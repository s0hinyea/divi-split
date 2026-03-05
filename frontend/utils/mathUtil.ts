
export function allocateAmount(
    totalAmountToAllocate: number,
    shares: { id: string; share: number }[],
): Record<string, number> {
    if (totalAmountToAllocate <= 0 || shares.length === 0) {
        return {};
    }

    const totalCents = Math.round(totalAmountToAllocate * 100);
    const sumOfShares = shares.reduce((sum, s) => sum + s.share, 0);

    if (sumOfShares <= 0) {
        const evenShare = 1 / shares.length;
        shares = shares.map((s) => ({ ...s, share: evenShare }));
    } else {
        shares = shares.map((s) => ({ ...s, share: s.share / sumOfShares }));
    }

    const unroundedDistributions = shares.map((s) => {
        const exactCents = totalCents * s.share;
        return {
            id: s.id,
            exactCents: exactCents,
            floorCents: Math.floor(exactCents), 
            remainder: exactCents - Math.floor(exactCents), 
        };
    });

    let totalDistributedCents = unroundedDistributions.reduce(
        (sum, d) => sum + d.floorCents,
        0,
    );

    let missingPennies = totalCents - totalDistributedCents;

    unroundedDistributions.sort((a, b) => b.remainder - a.remainder);

    const finalAllocations: Record<string, number> = {};
    for (const dist of unroundedDistributions) {
        let finalCents = dist.floorCents;
        if (missingPennies > 0) {
            finalCents += 1; 
            missingPennies -= 1;
        }
        finalAllocations[dist.id] = finalCents / 100;
    }

    return finalAllocations;
}
