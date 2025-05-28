import * as ImagePicker from 'expo-image-picker';
import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Alert, View, Text } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { handleOCR } from '../utils/ocrUtil';
import{ loadingOCR } from '../utils/loadingOCR';
import { useReceipt } from '../utils/ReceiptContext'

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
  

  const openCamera = async () => {
    // If camera is already active, don't try to open it again
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
        // Reset state before navigating 
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
        // Reset state before navigating
        cameraActive.current = false;
        
        return;
      }

      const asset = res.assets[0];
      const base64DataUrl = `data:image/jpeg;base64,${asset.base64}`;
      console.log("Photo taken successfully");
      
      setLoading(true);
      loadingOCR(loading);
      await handleOCR(base64DataUrl, updateReceiptData);
      setLoading(false);
    } catch (error) {
      console.error("Camera error:", error);
      Alert.alert("Error", "There was a problem opening the camera");
    } finally {
      // Always reset camera state at the end
      cameraActive.current = false;
      
      // Only navigate back on error - success should show result
      if (!loading) {
        router.back();
      }
    }
  };

  



  // When this screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log("Screen focused, camera active:", cameraActive.current);
      
      // Small delay to let the screen render
      const timer = setTimeout(() => {
        openCamera();
      }, 1000);
      
      // Clean up on unfocus
      return () => {
        clearTimeout(timer);
        console.log("Screen unfocused, resetting camera state");
        cameraActive.current = false;
      };
    }, [])
  );
}