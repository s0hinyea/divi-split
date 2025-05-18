import { useRouter } from 'expo-router';
import { Alert } from 'react-native';

export type OCRResponse = {
  text: string; 
} | {
  error?: string;
};

export const handleOCR = async (base64DataUrl: string) => {
  const router = useRouter();

  try { 
    const data = await fetch('https://divi-backend-krh1.onrender.com/ocr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64DataUrl }),
    });
    
    console.log("Image sent for OCR processing");
    const extractedData: OCRResponse = await data.json(); 
    
    if ('text' in extractedData) {

      router.push({
        pathname: "/result",
        params: {data : extractedData.text}
        });
        
    } else if ('error' in extractedData) {
      console.error("OCR error:", extractedData.error);
      Alert.alert("Error", "There was a problem processing the image");
    }
  } catch (error) {
    console.error("OCR Failed:", error);
    Alert.alert("Error", "Failed to process the image");
  }
};
