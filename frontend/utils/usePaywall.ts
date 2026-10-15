import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { supabase } from '@/lib/supabase';

const SCAN_COUNT_KEY = '@divi_scan_count';
const MOCK_SUBSCRIBED_KEY = '@divi_mock_subscribed';
export const FREE_SCAN_LIMIT = 5;

const isExpoGo = Constants.appOwnership === 'expo';

type PurchasesPackage = {
  identifier: string;
  packageType: 'MONTHLY' | 'ANNUAL';
  product: {
    identifier: string;
    description: string;
    title: string;
    price: number;
    priceString: string;
    currencyCode: string;
  };
};

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
};

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
};

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
  const [monthlyPackage, setMonthlyPackage] = useState<PurchasesPackage | null>(null);
  const [yearlyPackage, setYearlyPackage] = useState<PurchasesPackage | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [scanCount, setScanCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

  const scansRemaining = Math.max(0, FREE_SCAN_LIMIT - scanCount);

  const currentPackage = selectedPlan === 'yearly' ? yearlyPackage : monthlyPackage;

  useEffect(() => {
    const init = async () => {
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

        const uid = await getUserId();
        setUserId(uid);

        const serverCount = uid ? await fetchServerScanCount(uid) : 0;
        setScanCount(serverCount);
        setMonthlyPackage(MOCK_MONTHLY);
        setYearlyPackage(MOCK_YEARLY);
      } catch (e) {
        if (__DEV__) console.warn('Paywall initialization error:', e);
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

    setPurchaseError('Subscriptions are temporarily unavailable in this test build.');
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

    setPurchaseError('Restore is temporarily unavailable in this test build.');
    return false;
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
