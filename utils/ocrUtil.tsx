import { useRouter } from 'expo-router';
import { Alert } from 'react-native';
import { useReceipt, OCRResponse } from '../utils/ReceiptContext'


export const handleOCR = async (base64DataUrl: string, updateReceiptData: (data: OCRResponse) => void) => {
  const router = useRouter();

  try { 
    const data = await fetch('https://divi-backend-krh1.onrender.com/ocr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64DataUrl }),
    });
    
    console.log("Image sent for OCR processing");
    const extractedData = await data.json(); 
    
    if ('text' in extractedData) {
      console.log(extractedData.text);
      console.log(extractedData.items);
      
      // Update the context with the new data
      updateReceiptData(extractedData);
      router.push('/result');
      
    } else if ('error' in extractedData) {
      console.error("OCR error:", extractedData.error);
      Alert.alert("Error", "There was a problem processing the image");
    }
  } catch (error) {
    console.error("OCR Failed:", error);
    Alert.alert("Error", "Failed to process the image");
  }
};
