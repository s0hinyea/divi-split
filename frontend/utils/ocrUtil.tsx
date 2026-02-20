import { Alert } from "react-native";
import { useReceipt, OCRResponse } from "./ReceiptContext";
import { useOCR } from "@/utils/OCRContext";
import { Router } from "expo-router";
import { supabase } from "@/lib/supabase";
import * as ImageManipulator from 'expo-image-manipulator';

import { Config } from "@/constants/Config";

// The URL can be changed based on environment
const API_URL = `${Config.BACKEND_URL}/ocr-vision`;

export const handleOCR = async (
	imageUri: string, // Changed from base64DataUrl to imageUri
	updateReceiptData: (data: OCRResponse) => void,
	setIsProcessing: (val: boolean) => void,
	setStatus: (val: string) => void, // Added setStatus
	router: Router
) => {

	try {
		setIsProcessing(true);
		router.push("/contacts")

		// 1. Compressing
		setStatus("Compressing image...");
		const manipulatedImage = await ImageManipulator.manipulateAsync(
			imageUri,
			[{ resize: { width: 1024 } }], // Resize to reasonable width
			{ compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
		);
		const base64DataUrl = `data:image/jpeg;base64,${manipulatedImage.base64}`;

		const { data: { session } } = await supabase.auth.getSession();
		const token = session?.access_token;

		console.log('[OCR Debug] Session exists:', !!session);
		console.log('[OCR Debug] Token exists:', !!token);

		// 2. Sending
		setStatus("Sending it over...");
		const data = await fetch(API_URL, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Authorization": `Bearer ${token}`
			},
			body: JSON.stringify({ image: base64DataUrl }),
		});

		console.log("Image sent for OCR processing");

		// 3. Extracting
		setStatus("Extracting text...");
		const extractedData = await data.json();

		if ("items" in extractedData) {
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
		setIsProcessing(false);
		setStatus("");
	}
};
