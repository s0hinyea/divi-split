import type { CustomerInfo, PurchasesOfferings, PurchasesPackage } from 'react-native-purchases';
import { getSubscriptionPackages, hasProEntitlement } from '../subscription';

const monthly = { identifier: '$rc_monthly', packageType: 'MONTHLY' } as PurchasesPackage;
const yearly = { identifier: '$rc_annual', packageType: 'ANNUAL' } as PurchasesPackage;

describe('subscription access', () => {
  it('grants access only for the active Divi Pro entitlement', () => {
    expect(hasProEntitlement({ entitlements: { active: {} } } as CustomerInfo)).toBe(false);
    expect(hasProEntitlement({ entitlements: { active: { Other: {} } } } as unknown as CustomerInfo)).toBe(false);
    expect(hasProEntitlement({ entitlements: { active: { 'Divi Pro': {} } } } as unknown as CustomerInfo)).toBe(true);
  });

  it('uses the live monthly and yearly packages from the current offering', () => {
    const offerings = { current: { monthly, annual: yearly, availablePackages: [monthly, yearly] } } as PurchasesOfferings;
    expect(getSubscriptionPackages(offerings)).toEqual({ monthly, yearly });
  });

  it('does not invent plans when the offering is empty', () => {
    expect(getSubscriptionPackages({ current: null } as PurchasesOfferings)).toEqual({ monthly: null, yearly: null });
  });
});
