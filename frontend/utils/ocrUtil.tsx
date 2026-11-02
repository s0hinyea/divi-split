import { OCRResponse } from "../stores/splitStore";
import { Router } from "expo-router";
import { supabase } from "@/lib/supabase";
import * as ImageManipulator from 'expo-image-manipulator';
import { isNetworkError } from "@/utils/network";
import { ToastType } from "@/components/ToastProvider";

export const handleOCR = async (
	imageUri: string,
	updateReceiptData: (data: OCRResponse) => void,
	setIsProcessing: (val: boolean) => void,
	setStatus: (val: string) => void,
	setError: (val: string | null) => void,
	router: Router,
	showToast: (message: string, type?: ToastType) => void,
	signal?: AbortSignal,
) => {
	try {
		if (signal?.aborted) return;
		setIsProcessing(true);
		setError(null);
		router.push("/contacts");

		setStatus("Compressing image...");
		const manipulatedImage = await ImageManipulator.manipulateAsync(
			imageUri,
			[{ resize: { width: 1200 } }],
			{ compress: 0.72, format: ImageManipulator.SaveFormat.JPEG, base64: true }
		);
		const base64DataUrl = `data:image/jpeg;base64,${manipulatedImage.base64}`;

		if (signal?.aborted) return;

		const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();
		if (refreshError || !session) {
			throw new Error('Your session has expired. Please sign in again.');
		}

		setStatus("Analyzing receipt...");
		const { data: extractedData, error } = await supabase.functions.invoke('ocr-vision', {
			body: { image: base64DataUrl },
			headers: {
				Authorization: `Bearer ${session.access_token}`,
			},
		});

		// 1. Handle network-level or 500-level errors
		if (error) {
			let errorMessage = error.message;
			let notReceiptReason = '';
			try {
				if (error.context && typeof error.context.json === 'function') {
					const errorBody = await error.context.json();
					errorMessage = errorBody?.error || errorMessage;
					if (errorBody?.reason) notReceiptReason = errorBody.reason;
				}
			} catch (_) {}

			if (errorMessage === 'NOT_RECEIPT' || errorMessage.includes('NOT_RECEIPT')) {
				throw new Error('NOT_RECEIPT:' + (notReceiptReason || 'This image does not appear to be a receipt.'));
			}
			if (errorMessage === 'SCAN_LIMIT_REACHED') throw new Error('SCAN_LIMIT_REACHED');
			if (errorMessage === 'SCAN_RATE_LIMITED') throw new Error('SCAN_RATE_LIMITED');
			if (errorMessage === 'NO_ITEMS') throw new Error('NO_ITEMS');
			if (errorMessage.includes('timed out') || errorMessage.includes('timeout') || errorMessage.includes('non-2xx')) {
				// If we get a generic non-2xx but no context, it's likely a 500 or 401
				if (errorMessage.includes('non-2xx')) {
					throw new Error('SERVER_ERROR: ' + errorMessage);
				}
				throw new Error('TIMEOUT');
			}
			throw new Error(errorMessage);
		}

		// 2. Handle 200 OK responses that contain graceful errors (like NOT_RECEIPT)
		if (extractedData?.error) {
			if (extractedData.error === 'NOT_RECEIPT') {
				throw new Error('NOT_RECEIPT:' + (extractedData.reason || 'This image does not appear to be a receipt.'));
			}
			if (extractedData.error === 'SCAN_LIMIT_REACHED') throw new Error('SCAN_LIMIT_REACHED');
			throw new Error(extractedData.error);
		}

		setStatus("Extracting items...");

		if (extractedData && "items" in extractedData && extractedData.items.length > 0) {
			// Filter out $0 items (promo lines, headers, etc.)
			extractedData.items = extractedData.items.filter((item: any) => item.price > 0);
			updateReceiptData(extractedData);

			// confidence field is stored in receiptData; review screen shows inline Level 4 warning
		} else if (extractedData && "items" in extractedData && extractedData.items.length === 0) {
			throw new Error('NO_ITEMS');
		} else if (extractedData && "error" in extractedData) {
			throw new Error(extractedData.error);
		} else {
			throw new Error('UNRECOGNIZED');
		}
	} catch (err: any) {
		if (__DEV__) console.error('[OCR] Error:', err);
		const message = err?.message || '';

		let title = 'Scan Failed';
		let body = 'Something went wrong while processing your receipt.';

		if (message === 'TIMEOUT') {
			title = 'Request Timed Out';
			body = 'The server took too long to respond. This can happen with large or blurry images. Try again with a clearer photo.';
		} else if (message.startsWith('NOT_RECEIPT:')) {
			title = 'No Receipt Found';
			body = "This image doesn't appear to contain receipt information. Please scan again.";
		} else if (message === 'NO_ITEMS') {
			title = 'No Items Found';
			body = "We couldn't detect any items on this receipt. Make sure the receipt is well-lit and fully visible, then try again.";
		} else if (message === 'UNRECOGNIZED') {
			title = 'Processing Error';
			body = 'We received an unexpected response from the server. Please try scanning again.';
		} else if (message === 'SCAN_LIMIT_REACHED') {
			title = 'Free Scans Used';
			body = 'You have used your five free scans. Divi Pro gives you unlimited scans; open Membership to see plans or restore a purchase.';
		} else if (message === 'SCAN_RATE_LIMITED') {
			title = 'Too Many Scans';
			body = 'You have scanned several receipts in a short time. Please wait a minute, then try again.';
		} else if (message.includes('429') || message.includes('credits') || message.includes('quota') || message.includes('rate limit')) {
			title = 'Service Unavailable';
			body = 'Our scanning service is temporarily unavailable. Please try again in a few minutes.';
		} else if (message.includes('session') || message.includes('Unauthorized') || message.includes('auth')) {
			title = 'Session Expired';
			body = 'Your login session has expired. Please sign in again.';
		} else if (isNetworkError(err) || message.includes('network') || message.includes('fetch')) {
			title = 'No Connection';
			body = "Couldn't reach the server. Check your internet connection and try again.";
		}

		setError(body);
		router.replace('/(tabs)');
		setTimeout(() => showToast(body, 'error'), 300);
	} finally {
		setIsProcessing(false);
		setStatus("");
	}
};
