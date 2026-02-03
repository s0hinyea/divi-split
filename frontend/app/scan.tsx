import * as ImagePicker from 'expo-image-picker';
import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Alert, View, Text } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { handleOCR } from '../utils/ocrUtil';
import { useReceipt } from '../utils/ReceiptContext';
import { useOCR } from '../utils/OCRContext';

type OCRResponse = {
  text: string;
} | {
  error?: string;
};

export default function Scan() {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const cameraActive = useRef<boolean>(false);
  const { updateReceiptData } = useReceipt();
  const { setIsProcessing } = useOCR();

  const openCamera = async () => {
    if (cameraActive.current) {
      console.log("Camera already active, skipping");
      return;
    }

    console.log("Opening camera...");
    cameraActive.current = true;

    try {
      const permissionRes = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionRes.granted) {
        Alert.alert("Camera permission required to scan receipts");
        cameraActive.current = false;
        router.back();
        return;
      }

      const res = await ImagePicker.launchCameraAsync({
        quality: 0.8,
        allowsEditing: false,
        mediaTypes: ['images'],
        base64: true
      });

      if (res.canceled) {
        cameraActive.current = false;
        return;
      }

      const asset = res.assets[0];
      const base64DataUrl = `data:image/jpeg;base64,${asset.base64}`;
      console.log("Photo taken successfully");

      setLoading(true);
      await handleOCR(base64DataUrl, updateReceiptData, setIsProcessing, router);
      setLoading(false);
    } catch (error) {
      console.error("Camera error:", error);
      Alert.alert("Error", "There was a problem opening the camera");
    } finally {
      cameraActive.current = false;
      if (!loading) {
        router.back();
      }
    }
  };

  useFocusEffect(
    useCallback(() => {
      console.log("Screen focused, camera active:", cameraActive.current);

      const timer = setTimeout(() => {
        openCamera();
      }, 1000);

      return () => {
        clearTimeout(timer);
        console.log("Screen unfocused, resetting camera state");
        cameraActive.current = false;
      };
    }, [])
  );

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10 }}>Processing receipt...</Text>
      </View>
    );
  }

  return null;
}