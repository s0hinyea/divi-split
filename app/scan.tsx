import * as ImagePicker from 'expo-image-picker';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Alert, View, Text } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';


type CameraResponse = {
  canceled: boolean;
  assets: Array<{
    base64: string;
    uri: string;
  }>;
};

type OCRResponse = {
  text: string; }
  | {
  error?: string;
};


export default function Scan() {
  const router = useRouter();
  const isMounted = useRef<boolean>(false);
  const [cameraOpened, setCameraOpened] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const cameraAttemptedRef = useRef<boolean>(false);

  const openCamera = async () => {
    console.log("CAM");
    if (cameraOpened || cameraAttemptedRef.current) return;
    
    cameraAttemptedRef.current = true;
    setCameraOpened(true); 

    try {
      const permissionRes = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionRes.granted) {
        Alert.alert("Camera permission required to scan receipts");
        setCameraOpened(false);
        router.back(); 
        return;
      } 
       
      const res = await ImagePicker.launchCameraAsync({
        quality: 1,
        allowsEditing: false,
        mediaTypes: ['images'],
        base64: true
      });

      if (res.canceled) {
        setCameraOpened(false);
        router.back();  
        return; 
      } 
      
      const asset = res.assets[0]
      const base64DataUrl = `data:image/jpeg;base64,${asset.base64}`; 
      await handleOCR(base64DataUrl);
    }
    catch (error) {
      console.error("🔥 Camera error:", error);
      Alert.alert("Error", "There was a problem opening the camera");
      setCameraOpened(false);
      router.back();       
    }
  }; 


  const handleOCR = async (base64DataUrl: any) => {
    setLoading(true); 
    try{
      const data = await fetch('https://divi-backend-krh1.onrender.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64DataUrl }),
    });
    
    setCameraOpened(false);
    
    const extractedData = await data.json(); 
    console.log(extractedData);
    } catch (error){
      console.error("OCR Failed:" , error);
    } finally {
      setLoading(false);
    }
  };

  // On initial screen mount - only run once
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!cameraAttemptedRef.current) {
        openCamera();
      }
      console.log("init")
    }, 500); 
    
    return () => {
      clearTimeout(timer);
      cameraAttemptedRef.current = false;
      setCameraOpened(false);
    };
  }, []);
  
  // When returning to this screen (after cancel, etc.)
  useFocusEffect(
    useCallback(() => {
      if (isMounted.current && !cameraAttemptedRef.current) {
        const timer = setTimeout(() => {
          openCamera();
          console.log("focus")
        }, 500);
        return () => clearTimeout(timer);
      } else {
        isMounted.current = true;
      } 
      
      return () => {
        cameraAttemptedRef.current = false;
      };
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
