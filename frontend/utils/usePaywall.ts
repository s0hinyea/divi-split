import { useEffect, useState, useCallback } from 'react';
import type Purchases from 'react-native-purchases';
import type { CustomerInfo, PurchasesPackage } from 'react-native-purchases';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/utils/SessionContext';
import { getSubscriptionPackages, hasProEntitlement } from '@/utils/subscription';

const RC_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY ?? '';
const SCAN_COUNT_KEY = '@divi_scan_count';
const MOCK_SUBSCRIBED_KEY = '@divi_mock_subscribed';
export const FREE_SCAN_LIMIT = 5;

const isExpoGo = Constants.appOwnership === 'expo';
let purchasesPromise: Promise<typeof Purchases> | null = null;
let identitySync: Promise<void> = Promise.resolve();

// Load native purchases after the app has mounted. A missing configuration or
// native module should produce a paywall error, never a launch-time JS error.
async function getPurchases(): Promise<typeof Purchases> {
  if (Platform.OS !== 'ios') {
    throw new Error('Subscriptions are not configured for this platform yet.');
  }
  if (!RC_API_KEY) {
    throw new Error('Subscriptions are not configured in this build.');
  }
  if (!purchasesPromise) {
    purchasesPromise = import('react-native-purchases')
      .then(({ default: sdk, LOG_LEVEL }) => {
        sdk.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.ERROR);
        sdk.configure({ apiKey: RC_API_KEY });
        return sdk;
      })
      .catch((error) => {
        purchasesPromise = null;
        throw error;
      });
  }
  return purchasesPromise;
}

async function getPurchasesForUser(userId: string | null): Promise<typeof Purchases> {
  const sdk = await getPurchases();
  // Several screens use this hook. Serialize identity changes so a purchase
  // cannot accidentally run under the previous signed-in account.
  identitySync = identitySync.catch(() => {}).then(async () => {
    const currentId = await sdk.getAppUserID();
    if (userId && currentId !== userId) {
      await sdk.logIn(userId);
    } else if (!userId && !currentId.startsWith('$RCAnonymousID:')) {
      await sdk.logOut();
    }
  });
  await identitySync;
  return sdk;
}

const MOCK_MONTHLY: PurchasesPackage = {
  identifier: '$rc_monthly',
  packageType: 'MONTHLY',
  product: {
    identifier: 'com.sohi.divi.pro.monthly',
    description: 'Divi Pro Monthly',
    title: 'Divi Pro',
    price: 4.99,
    priceString: '$4.99',
    currencyCode: 'USD',
  },
} as PurchasesPackage;

const MOCK_YEARLY: PurchasesPackage = {
  identifier: '$rc_annual',
  packageType: 'ANNUAL',
  product: {
    identifier: 'com.sohi.divi.pro.yearly',
    description: 'Divi Pro Yearly',
    title: 'Divi Pro',
    price: 29.99,
    priceString: '$29.99',
    currencyCode: 'USD',
  },
} as PurchasesPackage;

async function fetchServerScanCount(userId: string): Promise<number> {
  const { data } = await supabase
    .from('profiles')
    .select('ai_scan_count')
    .eq('id', userId)
    .single();
  return data?.ai_scan_count ?? 0;
}

async function incrementServerScanCount(userId: string, newCount: number): Promise<void> {
  await supabase
    .from('profiles')
    .update({ ai_scan_count: newCount })
    .eq('id', userId);
}

export function usePaywall() {
  const { session, isLoading: sessionLoading } = useSession();
  const userId = session?.user?.id ?? null;
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [monthlyPackage, setMonthlyPackage] = useState<PurchasesPackage | null>(null);
  const [yearlyPackage, setYearlyPackage] = useState<PurchasesPackage | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [scanCount, setScanCount] = useState(0);

  const scansRemaining = Math.max(0, FREE_SCAN_LIMIT - scanCount);

  const currentPackage = selectedPlan === 'yearly' ? yearlyPackage : monthlyPackage;

  useEffect(() => {
    if (sessionLoading) return;
    let active = true;
    let sdk: typeof Purchases | null = null;
    const onCustomerInfo = (info: CustomerInfo) => {
      if (active) setIsSubscribed(hasProEntitlement(info));
    };

    const init = async () => {
      setIsLoading(true);
      setIsSubscribed(false);
      setMonthlyPackage(null);
      setYearlyPackage(null);
      setPurchaseError(null);
      try {
        if (isExpoGo) {
          const [storedCount, storedSub] = await Promise.all([
            AsyncStorage.getItem(SCAN_COUNT_KEY),
            AsyncStorage.getItem(MOCK_SUBSCRIBED_KEY),
          ]);
          setScanCount(storedCount ? parseInt(storedCount, 10) : 0);
          setIsSubscribed(storedSub === 'true');
          setMonthlyPackage(MOCK_MONTHLY);
          setYearlyPackage(MOCK_YEARLY);
          setIsLoading(false);
          return;
        }

        sdk = await getPurchasesForUser(userId);
        if (!active) return;
        sdk.addCustomerInfoUpdateListener(onCustomerInfo);

        const [customerInfo, serverCount] = await Promise.all([
          sdk.getCustomerInfo(),
          userId ? fetchServerScanCount(userId) : Promise.resolve(0),
        ]);
        if (!active) return;
        onCustomerInfo(customerInfo);
        setScanCount(serverCount);
        try {
          const offerings = await sdk.getOfferings();
          if (!active) return;
          const packages = getSubscriptionPackages(offerings);
          setMonthlyPackage(packages.monthly);
          setYearlyPackage(packages.yearly);
          if (!packages.monthly && !packages.yearly) {
            setPurchaseError('Subscription plans are unavailable. Please try again later.');
          }
        } catch (error) {
          if (active) setPurchaseError('Unable to load subscription plans. Please try again later.');
          if (__DEV__) console.warn('RevenueCat offerings error:', error);
        }
      } catch (e) {
        if (__DEV__) console.warn('Paywall initialization error:', e);
        if (active) setPurchaseError(e instanceof Error ? e.message : 'Unable to load subscriptions. Please try again.');
      } finally {
        if (active) setIsLoading(false);
      }
    };

    init();
    return () => {
      active = false;
      sdk?.removeCustomerInfoUpdateListener(onCustomerInfo);
    };
  }, [sessionLoading, userId]);

  const attemptAgentUse = useCallback(async (): Promise<boolean> => {
    if (isSubscribed) return true;

    const newCount = scanCount + 1;

    if (newCount > FREE_SCAN_LIMIT) {
      setPaywallVisible(true);
      return false;
    }

    setScanCount(newCount);

    if (isExpoGo) {
      await AsyncStorage.setItem(SCAN_COUNT_KEY, String(newCount));
    } else if (userId) {
      await incrementServerScanCount(userId, newCount);
    }

    return true;
  }, [isSubscribed, scanCount, userId]);

  const purchaseSubscription = useCallback(async () => {
    setPurchaseError(null);

    if (isExpoGo) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setIsSubscribed(true);
      setPaywallVisible(false);
      await AsyncStorage.setItem(MOCK_SUBSCRIBED_KEY, 'true');
      return;
    }

    if (!currentPackage) {
      setPurchaseError('This subscription plan is unavailable. Please try again later.');
      return;
    }
    try {
      const sdk = await getPurchasesForUser(userId);
      const { customerInfo } = await sdk.purchasePackage(currentPackage);
      const subscribed = hasProEntitlement(customerInfo);
      setIsSubscribed(subscribed);
      if (subscribed) setPaywallVisible(false);
      else setPurchaseError('Purchase completed, but Pro access is not active yet. Please try Restore Purchases.');
    } catch (e: any) {
      if (!e?.userCancelled) {
        setPurchaseError(e?.message ?? 'Purchase failed. Please try again.');
      }
    }
  }, [currentPackage, userId]);

  const restorePurchases = useCallback(async (): Promise<boolean> => {
    setPurchaseError(null);

    if (isExpoGo) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setIsSubscribed(true);
      setPaywallVisible(false);
      await AsyncStorage.setItem(MOCK_SUBSCRIBED_KEY, 'true');
      return true;
    }

    try {
      const sdk = await getPurchasesForUser(userId);
      const customerInfo = await sdk.restorePurchases();
      const restored = hasProEntitlement(customerInfo);
      setIsSubscribed(restored);
      if (restored) setPaywallVisible(false);
      else setPurchaseError('No active Divi Pro subscription was found for this Apple account.');
      return restored;
    } catch (e: any) {
      setPurchaseError(e?.message ?? 'Restore failed. Please try again.');
      return false;
    }
  }, [userId]);

  const clearMockSubscription = useCallback(async () => {
    if (isExpoGo) {
      setIsSubscribed(false);
      setScanCount(0);
      await AsyncStorage.removeItem(MOCK_SUBSCRIBED_KEY);
      await AsyncStorage.removeItem(SCAN_COUNT_KEY);
    }
  }, []);

  const hidePaywall = useCallback(() => {
    setPaywallVisible(false);
    setPurchaseError(null);
  }, []);

  const showPaywall = useCallback(() => {
    setPaywallVisible(true);
  }, []);

  return {
    scanCount,
    scansRemaining,
    isSubscribed,
    isLoading,
    paywallVisible,
    monthlyPackage,
    yearlyPackage,
    currentPackage,
    selectedPlan,
    setSelectedPlan,
    purchaseError,
    attemptAgentUse,
    hidePaywall,
    showPaywall,
    purchaseSubscription,
    restorePurchases,
    clearMockSubscription,
  };
}
