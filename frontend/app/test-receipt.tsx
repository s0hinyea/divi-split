import { useCallback } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { View, Text } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { Asset } from 'expo-asset';
import { handleOCR } from '../utils/ocrUtil';
import { useSplitStore } from '../stores/splitStore';
import { useOCR } from '../utils/OCRContext';
import { colors } from '@/styles/theme';

export default function TestReceipt() {
  const router = useRouter();
  const updateReceiptData = useSplitStore((state) => state.updateReceiptData);
  const { setIsProcessing, setStatus, setError } = useOCR();

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      const run = async () => {
        try {
          const asset = Asset.fromModule(require('../assets/test-receipt.png'));
          await asset.downloadAsync();
          if (cancelled || !asset.localUri) return;
          await handleOCR(asset.localUri, updateReceiptData, setIsProcessing, setStatus, setError, router);
        } catch (err) {
          console.error('[TestReceipt] error:', err);
          if (!cancelled) router.back();
        }
      };

      run();
      return () => { cancelled = true; };
    }, [])
  );

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 }}>
      <ActivityIndicator size="large" color={colors.green} />
      <Text style={{ color: colors.gray500, fontSize: 14 }}>Loading test receipt...</Text>
    </View>
  );
}
