import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Purchases, { PurchasesPackage } from 'react-native-purchases';

const FREE_SCANS = 3;
const SCAN_COUNT_KEY = '@divi/agent_scan_count';
const ENTITLEMENT_ID = 'Divi Pro';

export function usePaywall() {
  const [scanCount, setScanCount] = useState(0);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPackage, setCurrentPackage] = useState<PurchasesPackage | null>(null);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const stored = await AsyncStorage.getItem(SCAN_COUNT_KEY);
        setScanCount(stored ? parseInt(stored, 10) : 0);

        const info = await Purchases.getCustomerInfo();
        setIsSubscribed(!!info.entitlements.active[ENTITLEMENT_ID]);

        const offerings = await Purchases.getOfferings();
        const pkg = offerings.current?.availablePackages[0] ?? null;
        setCurrentPackage(pkg);
      } catch {
        // RC not yet configured or network error — default to free tier
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  const scansRemaining = Math.max(0, FREE_SCANS - scanCount);

  // Returns true if the agent use is allowed, false if gated by paywall
  const attemptAgentUse = useCallback(async (): Promise<boolean> => {
    if (isSubscribed) return true;

    if (scanCount < FREE_SCANS) {
      const next = scanCount + 1;
      setScanCount(next);
      await AsyncStorage.setItem(SCAN_COUNT_KEY, String(next));
      return true;
    }

    setPaywallVisible(true);
    return false;
  }, [isSubscribed, scanCount]);

  const hidePaywall = useCallback(() => {
    setPurchaseError(null);
    setPaywallVisible(false);
  }, []);

  const purchaseSubscription = useCallback(async () => {
    if (!currentPackage) return;
    setPurchaseError(null);
    try {
      await Purchases.purchasePackage(currentPackage);
      const info = await Purchases.getCustomerInfo();
      const subscribed = !!info.entitlements.active[ENTITLEMENT_ID];
      setIsSubscribed(subscribed);
      if (subscribed) setPaywallVisible(false);
    } catch (err: unknown) {
      const rcErr = err as { userCancelled?: boolean; message?: string };
      if (!rcErr.userCancelled) {
        setPurchaseError(rcErr.message ?? 'Purchase failed. Please try again.');
      }
    }
  }, [currentPackage]);

  const restorePurchases = useCallback(async () => {
    setPurchaseError(null);
    try {
      const info = await Purchases.restorePurchases();
      const subscribed = !!info.entitlements.active[ENTITLEMENT_ID];
      setIsSubscribed(subscribed);
      if (subscribed) setPaywallVisible(false);
      return subscribed;
    } catch (err: unknown) {
      const rcErr = err as { message?: string };
      setPurchaseError(rcErr.message ?? 'Restore failed. Please try again.');
      return false;
    }
  }, []);

  return {
    scanCount,
    scansRemaining,
    isSubscribed,
    paywallVisible,
    isLoading,
    currentPackage,
    purchaseError,
    attemptAgentUse,
    hidePaywall,
    purchaseSubscription,
    restorePurchases,
  };
}
