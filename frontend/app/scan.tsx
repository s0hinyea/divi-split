import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { handleOCR } from '../utils/ocrUtil';
import { useSplitStore } from '../stores/splitStore';
import { useOCR } from '../utils/OCRContext';
import { ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Camera } from 'expo-camera';
import { scanDocument } from '@dariyd/react-native-document-scanner';

export default function Scan() {
  const router = useRouter();
  const [launching, setLaunching] = useState(false);
  const updateReceiptData = useSplitStore((state) => state.updateReceiptData);
  const { setIsProcessing, setStatus, setError } = useOCR();

  useEffect(() => {
    // Small delay to let VisionKit initialize after the screen mounts
    // Without this, scanDocument() hangs on first launch but works after hot reload
    const timer = setTimeout(() => launchScanner(), 500);
    return () => clearTimeout(timer);
  }, []);

  const launchScanner = async () => {
    if (launching) return;
    setLaunching(true);

    // Check camera permissions first
    const { status } = await Camera.requestCameraPermissionsAsync();
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
      const result = await scanDocument({
        maxNumDocuments: 1,
      });

      if (result?.scannedImages && result.scannedImages.length > 0) {
        const scannedUri = result.scannedImages[0];
        console.log('🟢 [Scanner] Document scanned:', scannedUri);
        await handleOCR(scannedUri, updateReceiptData, setIsProcessing, setStatus, setError, router);
      } else {
        // User cancelled the scanner
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
        <ActivityIndicator size="large" color="#205237" />
        <Text style={s.loadingText}>Opening scanner...</Text>
      </View>

      {!launching && (
        <View style={s.bottomBar}>
          <TouchableOpacity style={s.retryButton} onPress={launchScanner} activeOpacity={0.7}>
            <MaterialIcons name="document-scanner" size={24} color="#fff" />
            <Text style={s.retryText}>Open Scanner</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.backButton} onPress={() => router.back()} activeOpacity={0.7}>
            <Text style={s.backText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  loadingText: { color: 'rgba(255,255,255,0.7)', fontSize: 16, fontWeight: '500' },
  bottomBar: { position: 'absolute', bottom: 50, left: 0, right: 0, alignItems: 'center', gap: 12 },
  retryButton: {
    flexDirection: 'row', backgroundColor: '#205237',
    paddingVertical: 14, paddingHorizontal: 28, borderRadius: 14,
    alignItems: 'center', gap: 8,
  },
  retryText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  backButton: { padding: 8 },
  backText: { color: 'rgba(255,255,255,0.5)', fontSize: 14 },
});