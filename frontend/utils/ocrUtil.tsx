import { Alert } from "react-native";
import { OCRResponse } from "../stores/splitStore";
import { useOCR } from "@/utils/OCRContext";
import { Router } from "expo-router";
import { supabase } from "@/lib/supabase";
import * as ImageManipulator from 'expo-image-manipulator';




export const handleOCR = async (
	imageUri: string, 
	updateReceiptData: (data: OCRResponse) => void,
	setIsProcessing: (val: boolean) => void,
	setStatus: (val: string) => void, 
	router: Router
) => {

	try {
		setIsProcessing(true);
		router.push("/contacts")

		setStatus("Compressing image...");
		const manipulatedImage = await ImageManipulator.manipulateAsync(
			imageUri,
			[{ resize: { width: 1024 } }], 
			{ compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
		);
		const base64DataUrl = `data:image/jpeg;base64,${manipulatedImage.base64}`;

		// Refresh the session to ensure we have a valid (non-expired) JWT
		const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();
		if (refreshError || !session) {
			console.error('[OCR] Session refresh failed:', refreshError?.message);
			throw new Error('Your session has expired. Please sign in again.');
		}

		console.log('[OCR Debug] Session refreshed, token valid');

		setStatus("Processing...");
		const { data: extractedData, error } = await supabase.functions.invoke('ocr-vision', {
			body: { image: base64DataUrl },
		});

		if (error) {
			let errorMessage = error.message;
			try {
				if (error.context && typeof error.context.json === 'function') {
					const errorBody = await error.context.json();
					console.error("Edge Function error body:", JSON.stringify(errorBody));
					errorMessage = errorBody?.error || errorMessage;
				}
			} catch (_) {
				// context might not be parseable
			}
			console.error("Supabase Edge Function error:", errorMessage);
			throw new Error(errorMessage);
		}

		console.log("Image sent for OCR processing");

		setStatus("Extracting text...");

		if (extractedData && "items" in extractedData) {
			// Update the context with the new data
			updateReceiptData(extractedData);
		} else if (extractedData && "error" in extractedData) {
			console.error("OCR error:", extractedData.error);
			Alert.alert("Error", "There was a problem processing the image");
		}
	} catch (error) {
		console.error("OCR Failed:", error);
		Alert.alert("Error", "Failed to process the image");
	} finally {
		setIsProcessing(false);
		setStatus("");
	}
};
