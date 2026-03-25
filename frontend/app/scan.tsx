import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { handleOCR } from '../utils/ocrUtil';
import { useSplitStore } from '../stores/splitStore';
import { useOCR } from '../utils/OCRContext';
import { ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import DocumentScanner from 'react-native-document-scanner-plugin';

export default function Scan() {
  const router = useRouter();
  const [launching, setLaunching] = useState(false);
  const updateReceiptData = useSplitStore((state) => state.updateReceiptData);
  const { setIsProcessing, setStatus, setError } = useOCR();

  // Launch the native document scanner automatically when screen loads
  useEffect(() => {
    launchScanner();
  }, []);

  const launchScanner = async () => {
    if (launching) return;
    setLaunching(true);

    try {
      // Open Apple VisionKit's native document scanner
      // It handles: edge detection, auto-capture, perspective correction, cropping
      const result = await DocumentScanner.scanDocument({
        // Max 1 page per scan session (one receipt)
        maxNumDocuments: 1,
      });

      if (result?.scannedImages && result.scannedImages.length > 0) {
        const scannedUri = result.scannedImages[0];
        console.log('Document scanned successfully:', scannedUri);

        // Feed the cropped, perspective-corrected image into our existing OCR pipeline
        await handleOCR(scannedUri, updateReceiptData, setIsProcessing, setStatus, setError, router);
      } else {
        // User cancelled the scanner — go back
        console.log('Scanner cancelled by user');
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/(tabs)');
        }
      }
    } catch (error: any) {
      console.error('Document scanner error:', error);

      // If the scanner plugin isn't available (e.g. running in Expo Go), fall back
      if (error?.message?.includes('not available') || error?.message?.includes('null')) {
        Alert.alert(
          'Scanner Not Available',
          'The document scanner requires a custom build. Please run "npx expo run:ios" to build the app with native modules.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        Alert.alert('Scanner Error', error?.message || 'Something went wrong.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } finally {
      setLaunching(false);
    }
  };

  // This screen is mostly a passthrough — the native scanner UI covers the screen.
  // This fallback UI shows briefly while the scanner is launching.
  return (
    <SafeAreaView style={s.container}>
      <View style={s.centered}>
        <ActivityIndicator size="large" color="#205237" />
        <Text style={s.loadingText}>Opening scanner...</Text>
      </View>

      {/* Manual re-launch button in case user returns without scanning */}
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
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    fontWeight: '500',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 12,
  },
  retryButton: {
    flexDirection: 'row',
    backgroundColor: '#205237',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
    alignItems: 'center',
    gap: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    padding: 8,
  },
  backText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
  },
});