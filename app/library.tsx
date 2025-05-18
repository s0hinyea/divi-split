import * as ImagePicker from 'expo-image-picker';
import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Alert, View, Text } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { handleOCR } from '../utils/ocrUtil';

export default function PickPhoto() {  
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const galleryActive = useRef<boolean>(false);

  const pickFromGallery = async () => {
    if (galleryActive.current) {
      console.log("Gallery picker already active, skipping");
      return;
    }
    
    galleryActive.current = true;
    
    try {
      const permissionRes = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionRes.granted) {
        Alert.alert("Gallery access permission required");
        router.back();
        return;
      }
      
      const res = await ImagePicker.launchImageLibraryAsync({
        quality: 1,
        allowsEditing: false,
        mediaTypes: ["images"],
        base64: true
      });

      if (res.canceled) {
        router.back();
        return;
      }

      const asset = res.assets[0];
      const base64DataUrl = `data:image/jpeg;base64,${asset.base64}`;
      console.log("Image selected successfully");
      
      setLoading(true);
      await handleOCR(base64DataUrl);
      setLoading(false);
    } catch (error) {
      console.error("Gallery picker error:", error);
      Alert.alert("Error", "There was a problem accessing the gallery");
      router.back();
    } finally {
      galleryActive.current = false;
    }
  };

  useFocusEffect(
    useCallback(() => {
      console.log("Opening library");
      const timer = setTimeout(() => {
        pickFromGallery();
      }, 1000);

      return () => {
        clearTimeout(timer);
        console.log("Screen unfocused, resetting camera state");
        galleryActive.current = false;
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