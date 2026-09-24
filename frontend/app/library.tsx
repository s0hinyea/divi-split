import * as ImagePicker from 'expo-image-picker';
import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { View, Text } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { handleOCR } from '../utils/ocrUtil';
import { useSplitStore } from '../stores/splitStore';
import { useOCR } from '../utils/OCRContext';
import { colors } from '@/styles/theme';
import { useToast } from '@/components/ToastProvider';
import { useCustomAlert } from '@/components/CustomAlert';

export default function PickPhoto() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const galleryActive = useRef<boolean>(false);
  const updateReceiptData = useSplitStore((state) => state.updateReceiptData);
  const { setIsProcessing, setStatus, setError, startOCR } = useOCR();
  const { showToast } = useToast();
  const { showAlert } = useCustomAlert();

  const pickFromGallery = async () => {
    if (galleryActive.current) return;
    galleryActive.current = true;

    try {
      const permissionRes = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionRes.granted) {
        showAlert({
          title: 'Photo Access Required',
          message: 'Divi needs photo library access to scan receipts. Please enable it in Settings.',
          buttons: [{ text: 'OK', onPress: () => router.back() }],
        });
        return;
      }

      const res = await ImagePicker.launchImageLibraryAsync({
        quality: 0.8,
        allowsEditing: false,
        mediaTypes: ["images"],
      });

      if (res.canceled) {
        router.back();
        return;
      }

      const asset = res.assets[0];
      setLoading(true);
      const signal = startOCR();
      await handleOCR(asset.uri, updateReceiptData, setIsProcessing, setStatus, setError, router, showToast, signal);
      setLoading(false);
    } catch (error) {
      if (__DEV__) console.error('[Library] Gallery picker error:', error);
      showAlert({
        title: 'Gallery Error',
        message: 'There was a problem accessing your photo library.',
        buttons: [{ text: 'OK', onPress: () => router.back() }],
      });
    } finally {
      galleryActive.current = false;
    }
  };

  useFocusEffect(
    useCallback(() => {
      const timer = setTimeout(pickFromGallery, 700);

      return () => {
        clearTimeout(timer);
        galleryActive.current = false;
      };
    }, [])
  );

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      {loading ? (
        <>
          <ActivityIndicator size="large" color={colors.green} />
          <Text>Processing...</Text>
        </>
      ) : (
        <Text> </Text>
      )}
    </View>
  );
}