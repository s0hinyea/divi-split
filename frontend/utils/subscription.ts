import type { CustomerInfo, PurchasesOfferings, PurchasesPackage } from 'react-native-purchases';

// This identifier must match the entitlement configured in RevenueCat.
export const PRO_ENTITLEMENT_ID = 'Divi Pro';

export function hasProEntitlement(info: CustomerInfo): boolean {
  return info.entitlements.active[PRO_ENTITLEMENT_ID] !== undefined;
}

export function getSubscriptionPackages(offerings: PurchasesOfferings): {
  monthly: PurchasesPackage | null;
  yearly: PurchasesPackage | null;
} {
  const current = offerings.current;
  return {
    monthly: current?.monthly ?? current?.availablePackages.find(p => p.packageType === 'MONTHLY') ?? null,
    yearly: current?.annual ?? current?.availablePackages.find(p => p.packageType === 'ANNUAL') ?? null,
  };
}
