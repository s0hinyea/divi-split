import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { handleOCR } from '../utils/ocrUtil';
import { useSplitStore } from '../stores/splitStore';
import { useOCR } from '../utils/OCRContext';
import { ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useToast } from '@/components/ToastProvider';

export default function Scan() {
  const router = useRouter();
  const [launching, setLaunching] = useState(false);
  const updateReceiptData = useSplitStore((state) => state.updateReceiptData);
  const { setIsProcessing, setStatus, setError, startOCR } = useOCR();
  const { showToast } = useToast();

  useEffect(() => {
    const timer = setTimeout(() => launchCamera(), 100);
    return () => clearTimeout(timer);
  }, []);

  const launchCamera = async () => {
    setLaunching(true);

    // Check camera permissions first
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      setLaunching(false);
      Alert.alert(
        'Camera Access Required',
        'Divi needs camera access to scan receipts. Please enable it in Settings.',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => router.back() },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false, // Set to true if you want default crop UI
        quality: 1, // High quality for OCR
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const scannedUri = result.assets[0].uri;
        console.log('🟢 [Scanner] Photo taken:', scannedUri);
        // Pass to OCR pipeline natively handles image paths
        const signal = startOCR();
        await handleOCR(scannedUri, updateReceiptData, setIsProcessing, setStatus, setError, router, showToast, signal);
      } else {
        // User cancelled
        if (router.canGoBack()) router.back();
        else router.replace('/(tabs)');
      }
    } catch (error: any) {
      console.error('🔴 [Scanner] Error:', error?.message);
      Alert.alert('Scanner Error', error?.message || 'Something went wrong.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } finally {
      setLaunching(false);
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.centered}>
        <ActivityIndicator size="large" color="#00C37F" />
        <Text style={s.loadingText}>Opening camera...</Text>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  loadingText: { color: 'rgba(255,255,255,0.7)', fontSize: 16, fontWeight: '500' },
});