import * as ImagePicker from 'expo-image-picker';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Alert, View, Text } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';

type OCRResponse = {
  text: string; 
} | {
  error?: string;
};

export default function Scan() {
  const router = useRouter();
  let cameraOpen = useRef<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const openCamera = async () => {
    if (cameraOpen.current) return;

    cameraOpen.current = true;

    try {
      const permissionRes = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionRes.granted) {
        Alert.alert("Camera permission required to scan receipts");
        cameraOpen.current = false;
        router.back(); // Optional: auto-navigate back if denied
        return;
      } 

      const res = await ImagePicker.launchCameraAsync({
        quality: 1,
        allowsEditing: false,
        mediaTypes: ['images'],
        base64: true
      });

      if (res.canceled) {
        cameraOpen.current = false;

        router.back(); // Optional: go back if canceled
        return;
      }

      const asset = res.assets[0];
      const base64DataUrl = `data:image/jpeg;base64,${asset.base64}`;
      console.log("✅ Photo taken");
      
      await handleOCR(base64DataUrl);

    } catch (error) {
      console.error("🔥 Camera error:", error);
      Alert.alert("Error", "There was a problem opening the camera");
      cameraOpen.current = false;
      router.back(); // Optional failover
    } finally {
      cameraOpen.current = false;
      router.back();
    }
  };

  const handleOCR = async (base64DataUrl: any) => {
    setLoading(true); 
    try { 
      const data = await fetch('https://divi-backend-krh1.onrender.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64DataUrl }),
      });
      
      const extractedData: OCRResponse = await data.json(); 
      console.log(extractedData);
    } catch (error) {
      console.error("OCR Failed:", error);
      return;
    } finally {
      setLoading(false);
    }
  };

  
  // When returning to this screen (after cancel, etc.)
  useFocusEffect(
    useCallback(() => {
      const timer = setTimeout(() => {
      openCamera();}, 500);
      return () => clearTimeout(timer);
     }, [])
  );

  return (
    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
      {loading ? (
        <>
          <ActivityIndicator size="large" color="blue" />
          <Text>Processing...</Text>
        </>
      ) : (
        <Text> </Text>
      )}
    </View>
  );
}