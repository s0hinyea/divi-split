import { Alert } from "react-native";
import { useReceipt, OCRResponse } from "./ReceiptContext";
import { useOCR } from "@/utils/OCRContext";
import { Router } from "expo-router";
import { supabase } from "@/lib/supabase";

import { Config } from "@/constants/Config";

// The URL can be changed based on environment
const API_URL = `${Config.BACKEND_URL}/ocr-vision`;

export const handleOCR = async (
	base64DataUrl: string,
	updateReceiptData: (data: OCRResponse) => void,
	setIsProcessing: (val: boolean) => void,
	router: Router // Now passed in from the calling component
) => {

	try {
		setIsProcessing(true);
		router.push("/contacts")

		const { data: { session } } = await supabase.auth.getSession();
		const token = session?.access_token;

		console.log('[OCR Debug] Session exists:', !!session);
		console.log('[OCR Debug] Token exists:', !!token);

		const data = await fetch(API_URL, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Authorization": `Bearer ${token}`
			},
			body: JSON.stringify({ image: base64DataUrl }),
		});

		console.log("Image sent for OCR processing");
		const extractedData = await data.json();

		if ("items" in extractedData) {
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
