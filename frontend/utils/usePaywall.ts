// RevenueCat temporarily disabled for debugging
export function usePaywall() {
  return {
    scanCount: 0,
    scansRemaining: 3,
    isSubscribed: false,
    paywallVisible: false,
    isLoading: false,
    currentPackage: null,
    purchaseError: null,
    attemptAgentUse: async () => true,
    hidePaywall: () => {},
    purchaseSubscription: async () => {},
    restorePurchases: async () => false,
  };
}
