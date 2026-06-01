import { useEffect, useState, useCallback } from 'react';
import Purchases, { LOG_LEVEL, PurchasesPackage } from 'react-native-purchases';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { supabase } from '@/lib/supabase';

const RC_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY ?? '';
const ENTITLEMENT_ID = 'Divi Pro';
const SCAN_COUNT_KEY = '@divi_scan_count';
const MOCK_SUBSCRIBED_KEY = '@divi_mock_subscribed';
export const FREE_SCAN_LIMIT = 3;

const isExpoGo = Constants.appOwnership === 'expo';
let rcConfigured = false;

const MOCK_PACKAGE = {
  identifier: 'monthly_pro',
  packageType: 'MONTHLY',
  product: {
    identifier: 'com.sohi.divi.pro.monthly',
    description: 'Divi Pro Monthly',
    title: 'Divi Pro',
    price: 4.99,
    priceString: '$4.99',
    currencyCode: 'USD',
  },
} as any;

function configureRC() {
  if (rcConfigured || !RC_API_KEY || isExpoGo) return;
  Purchases.setLogLevel(LOG_LEVEL.ERROR);
  Purchases.configure({ apiKey: RC_API_KEY });
  rcConfigured = true;
}

async function getUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

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
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [currentPackage, setCurrentPackage] = useState<PurchasesPackage | null>(null);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [scanCount, setScanCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

  const scansRemaining = Math.max(0, FREE_SCAN_LIMIT - scanCount);

  useEffect(() => {
    configureRC();

    const init = async () => {
      try {
        if (isExpoGo) {
          const [storedCount, storedSub] = await Promise.all([
            AsyncStorage.getItem(SCAN_COUNT_KEY),
            AsyncStorage.getItem(MOCK_SUBSCRIBED_KEY),
          ]);
          setScanCount(storedCount ? parseInt(storedCount, 10) : 0);
          setIsSubscribed(storedSub === 'true');
          setCurrentPackage(MOCK_PACKAGE);
          setIsLoading(false);
          return;
        }

        const uid = await getUserId();
        setUserId(uid);

        const [customerInfo, offerings, serverCount] = await Promise.all([
          Purchases.getCustomerInfo(),
          Purchases.getOfferings(),
          uid ? fetchServerScanCount(uid) : Promise.resolve(0),
        ]);

        setIsSubscribed(
          customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined
        );
        setScanCount(serverCount);

        const pkg =
          offerings.current?.monthly ??
          offerings.current?.availablePackages[0] ??
          null;
        setCurrentPackage(pkg);
      } catch (e) {
        console.warn('RevenueCat init error:', e);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

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
    if (!currentPackage) return;
    setPurchaseError(null);

    if (isExpoGo) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setIsSubscribed(true);
      setPaywallVisible(false);
      await AsyncStorage.setItem(MOCK_SUBSCRIBED_KEY, 'true');
      return;
    }

    try {
      const { customerInfo } = await Purchases.purchasePackage(currentPackage);
      if (customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined) {
        setIsSubscribed(true);
        setPaywallVisible(false);
      }
    } catch (e: any) {
      if (!e.userCancelled) {
        setPurchaseError(e.message ?? 'Purchase failed. Please try again.');
      }
    }
  }, [currentPackage]);

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
      const customerInfo = await Purchases.restorePurchases();
      const restored =
        customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
      if (restored) {
        setIsSubscribed(true);
        setPaywallVisible(false);
      } else {
        setPurchaseError('No active subscription found.');
      }
      return restored;
    } catch (e: any) {
      setPurchaseError(e.message ?? 'Restore failed. Please try again.');
      return false;
    }
  }, []);

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
    currentPackage,
    purchaseError,
    attemptAgentUse,
    hidePaywall,
    showPaywall,
    purchaseSubscription,
    restorePurchases,
    clearMockSubscription,
  };
}
