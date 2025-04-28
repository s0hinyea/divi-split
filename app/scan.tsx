import * as ImagePicker from 'expo-image-picker';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Alert } from 'react-native';

export default function Scan() {
  const router = useRouter();
  const isMounted = useRef(false);
  const [cameraOpened, setCameraOpened] = useState(false);

  const openCamera = async () => {
    if (cameraOpened) return;
    setCameraOpened(true);

    try {
      const permissionRes = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionRes.granted) {
        Alert.alert("Camera permission required to scan receipts");
        setCameraOpened(false);
        router.back(); // Optional: auto-navigate back if denied
        return;
      } 

      const res = await ImagePicker.launchCameraAsync({
        quality: 1,
        allowsEditing: false,
        mediaTypes: ['images'],
      });

      if (res.canceled) {
        setCameraOpened(false);
        router.back(); // Optional: go back if canceled
        return;
      }

      const photoUri = res.assets[0].uri;
      console.log("✅ Photo taken:", photoUri);

      // TODO: Add logic to send photoUri to scanning/preview
      setCameraOpened(false);
    } catch (error) {
      console.error("🔥 Camera error:", error);
      Alert.alert("Error", "There was a problem opening the camera");
      setCameraOpened(false);
      router.back(); // Optional failover
    }
  };

  // On initial screen mount
  useEffect(() => {
    const timer = setTimeout(() => {
      openCamera();
    }, 500);
    return () => clearTimeout(timer);
  }, []);
  
  // When returning to this screen (after cancel, etc.)
  useFocusEffect(
    useCallback(() => {
      if (isMounted.current) {
        const timer = setTimeout(() => {
          setCameraOpened(false);
          openCamera();
        }, 500);
        return () => clearTimeout(timer);
      } else {
        isMounted.current = true;
      }
    }, [])
  );

  return null; // No visible UI — just logic
}
