import { Alert } from "react-native";
import { OCRResponse } from "../stores/splitStore";
import { Router } from "expo-router";
import { supabase } from "@/lib/supabase";
import * as ImageManipulator from 'expo-image-manipulator';

export const handleOCR = async (
	imageUri: string,
	updateReceiptData: (data: OCRResponse) => void,
	setIsProcessing: (val: boolean) => void,
	setStatus: (val: string) => void,
	setError: (val: string | null) => void,
	router: Router
) => {
	try {
		setIsProcessing(true);
		setError(null);
		router.push("/contacts");

		setStatus("Compressing image...");
		const manipulatedImage = await ImageManipulator.manipulateAsync(
			imageUri,
			[{ resize: { width: 1024 } }],
			{ compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
		);
		const base64DataUrl = `data:image/jpeg;base64,${manipulatedImage.base64}`;

		const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();
		if (refreshError || !session) {
			throw new Error('Your session has expired. Please sign in again.');
		}

		setStatus("Analyzing receipt...");
		const { data: extractedData, error } = await supabase.functions.invoke('ocr-vision', {
			body: { image: base64DataUrl },
		});

		if (error) {
			let errorMessage = error.message;
			try {
				if (error.context && typeof error.context.json === 'function') {
					const errorBody = await error.context.json();
					errorMessage = errorBody?.error || errorMessage;
				}
			} catch (_) {}

			if (errorMessage.includes('timed out') || errorMessage.includes('timeout')) {
				throw new Error('TIMEOUT');
			}
			throw new Error(errorMessage);
		}

		setStatus("Extracting items...");

		if (extractedData && "items" in extractedData && extractedData.items.length > 0) {
			updateReceiptData(extractedData);
		} else if (extractedData && "items" in extractedData && extractedData.items.length === 0) {
			throw new Error('NO_ITEMS');
		} else if (extractedData && "error" in extractedData) {
			throw new Error(extractedData.error);
		} else {
			throw new Error('UNRECOGNIZED');
		}
	} catch (err: any) {
		const message = err?.message || '';

		let title = 'Scan Failed';
		let body = 'Something went wrong while processing your receipt.';
		let buttons: any[] = [
			{ text: 'Go Home', style: 'cancel', onPress: () => router.replace('/(tabs)') },
			{ text: 'Try Again', onPress: () => router.replace('/(tabs)') },
		];

		if (message === 'TIMEOUT') {
			title = 'Request Timed Out';
			body = 'The server took too long to respond. This can happen with large or blurry images. Try again with a clearer photo.';
		} else if (message === 'NO_ITEMS') {
			title = 'No Items Found';
			body = "We couldn't detect any items on this receipt. Make sure the receipt is well-lit and fully visible, then try again.";
		} else if (message === 'UNRECOGNIZED') {
			title = 'Processing Error';
			body = 'We received an unexpected response from the server. Please try scanning again.';
		} else if (message.includes('session') || message.includes('Unauthorized') || message.includes('auth')) {
			title = 'Session Expired';
			body = 'Your login session has expired. Please sign in again.';
			buttons = [
				{ text: 'Sign In', onPress: () => router.replace('/auth') },
			];
		} else if (message.includes('network') || message.includes('fetch')) {
			title = 'No Connection';
			body = "Couldn't reach the server. Check your internet connection and try again.";
		}

		setError(body);
		Alert.alert(title, body, buttons);
	} finally {
		setIsProcessing(false);
		setStatus("");
	}
};
