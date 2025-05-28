import { useRouter } from 'expo-router';
import { Alert } from 'react-native';
import { useReceipt } from '../utils/ReceiptContext'


export const handleOCR = async (base64DataUrl: string) => {

  const { receiptData, updateItem } = useReceipt();

  const router = useRouter()
  try { 
    const data = await fetch('https://divi-backend-krh1.onrender.com/ocr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64DataUrl }),
    });
    
    console.log("Image sent for OCR processing" );
    let ExtractedData = await data.json(); 
    
    if ('text' in ExtractedData) {
      console.log(ExtractedData.text)
      console.log(ExtractedData.items)

      router.push({
        pathname: "/result",
        params: {
          text: ExtractedData.text,
          items: JSON.stringify(ExtractedData.items)
        }
      });
    } else if ('error' in ExtractedData) {
      console.error("OCR error:", ExtractedData.error);
      Alert.alert("Error", "There was a problem processing the image");
    }
  } catch (error) {
    console.error("OCR Failed:", error);
    Alert.alert("Error", "Failed to process the image");
  }
};
