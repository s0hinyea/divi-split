import { useRouter } from "expo-router";
import { Alert } from "react-native";
import { useReceipt, OCRResponse } from "./ReceiptContext";
import { useOCR } from "@/utils/OCRContext";

// The URL can be changed based on environment
const API_URL = "https://divi-backend-7bfd.onrender.com/ocr";

export const handleOCR = async (
	base64DataUrl: string,
	updateReceiptData: (data: OCRResponse) => void,
	setIsProcessing: (val: boolean) => void
) => {
	const router = useRouter();
	
	try {
		setIsProcessing(true);
		router.push("/contacts")
		const data = await fetch(API_URL, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ image: base64DataUrl }),
		});

		console.log("Image sent for OCR processing");
		const extractedData = await data.json();

		if ("text" in extractedData) {
			console.log(extractedData.text);
			console.log(extractedData.items);
			setIsProcessing(false);
			// Update the context with the new data
			updateReceiptData(extractedData);
		} else if ("error" in extractedData) {
			console.error("OCR error:", extractedData.error);
			Alert.alert("Error", "There was a problem processing the image");
		}
	} catch (error) {
		console.error("OCR Failed:", error);
		Alert.alert("Error", "Failed to process the image");
	} finally {
	}
};
