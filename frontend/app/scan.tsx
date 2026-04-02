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
import * as ImagePicker from 'expo-image-picker';

export default function Scan() {
  const router = useRouter();
  const [launching, setLaunching] = useState(false);
  const updateReceiptData = useSplitStore((state) => state.updateReceiptData);
  const { setIsProcessing, setStatus, setError } = useOCR();

  useEffect(() => {
    launchScanner();
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
      // Try the native document scanner first, with a 5-second timeout
      // Some iOS versions cause VisionKit to hang silently
      const scannedUri = await Promise.race([
        tryNativeScanner(),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000)),
      ]);

      if (scannedUri) {
        console.log('🟢 [Scanner] Native scanner succeeded:', scannedUri);
        await handleOCR(scannedUri, updateReceiptData, setIsProcessing, setStatus, setError, router);
        return;
      }

      // Native scanner failed or timed out — fall back to camera capture
      console.log('🟡 [Scanner] Native scanner unavailable, falling back to camera...');
      await launchCameraFallback();
    } finally {
      setLaunching(false);
    }
  };

  /** Try the native VisionKit document scanner. Returns the scanned image URI or null. */
  const tryNativeScanner = async (): Promise<string | null> => {
    try {
      const DocumentScanner = require('react-native-document-scanner-plugin').default;
      const result = await DocumentScanner.scanDocument({ maxNumDocuments: 1 });
      if (result?.scannedImages?.length > 0) {
        return result.scannedImages[0];
      }
      return null; // User cancelled
    } catch (err) {
      console.warn('🟡 [Scanner] Native scanner error:', err);
      return null;
    }
  };

  /** Fallback: open the camera via expo-image-picker and take a photo of the receipt. */
  const launchCameraFallback = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        console.log('🟢 [Camera] Photo captured:', result.assets[0].uri);
        await handleOCR(result.assets[0].uri, updateReceiptData, setIsProcessing, setStatus, setError, router);
      } else {
        console.log('🟡 [Camera] User cancelled');
        if (router.canGoBack()) router.back();
        else router.replace('/(tabs)');
      }
    } catch (error: any) {
      console.error('🔴 [Camera] Error:', error);
      Alert.alert('Camera Error', error?.message || 'Could not open camera.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }
  };

  /** Let user pick from their photo library instead. */
  const launchGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        await handleOCR(result.assets[0].uri, updateReceiptData, setIsProcessing, setStatus, setError, router);
      }
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Could not open photo library.');
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.centered}>
        {launching ? (
          <>
            <ActivityIndicator size="large" color="#205237" />
            <Text style={s.loadingText}>Opening scanner...</Text>
          </>
        ) : (
          <>
            <Text style={s.loadingText}>Scanner ready</Text>
          </>
        )}
      </View>

      {!launching && (
        <View style={s.bottomBar}>
          <TouchableOpacity style={s.retryButton} onPress={launchScanner} activeOpacity={0.7}>
            <MaterialIcons name="document-scanner" size={24} color="#fff" />
            <Text style={s.retryText}>Open Scanner</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.secondaryButton} onPress={launchCameraFallback} activeOpacity={0.7}>
            <MaterialIcons name="camera-alt" size={24} color="#fff" />
            <Text style={s.retryText}>Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.secondaryButton} onPress={launchGallery} activeOpacity={0.7}>
            <MaterialIcons name="photo-library" size={24} color="#fff" />
            <Text style={s.retryText}>From Gallery</Text>
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
    alignItems: 'center', gap: 8, width: 220, justifyContent: 'center',
  },
  secondaryButton: {
    flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 14, paddingHorizontal: 28, borderRadius: 14,
    alignItems: 'center', gap: 8, width: 220, justifyContent: 'center',
  },
  retryText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  backButton: { padding: 8 },
  backText: { color: 'rgba(255,255,255,0.5)', fontSize: 14 },
});