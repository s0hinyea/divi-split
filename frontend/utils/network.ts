import NetInfo from '@react-native-community/netinfo';

export const OFFLINE_ERROR_MESSAGE = 'You are offline. Check your internet connection and try again.';

type OfflineError = Error & {
    code: 'OFFLINE';
};

export function createOfflineError(message = OFFLINE_ERROR_MESSAGE): OfflineError {
    const error = new Error(message) as OfflineError;
    error.name = 'OfflineError';
    error.code = 'OFFLINE';
    return error;
}

export async function hasInternetConnection() {
    const state = await NetInfo.fetch();
    return Boolean(state.isConnected && state.isInternetReachable !== false);
}

export async function assertInternetConnection() {
    if (!(await hasInternetConnection())) {
        throw createOfflineError();
    }
}

export function isNetworkError(error: unknown) {
    if (!error) return false;

    if (typeof error === 'object' && 'code' in error && (error as { code?: string }).code === 'OFFLINE') {
        return true;
    }

    const message =
        error instanceof Error
            ? error.message.toLowerCase()
            : String(error).toLowerCase();

    return (
        message.includes('network request failed') ||
        message.includes('failed to fetch') ||
        message.includes('load failed') ||
        message.includes('networkerror') ||
        message.includes('offline')
    );
}

export function getUserFacingErrorMessage(error: unknown, fallback: string) {
    return isNetworkError(error) ? OFFLINE_ERROR_MESSAGE : fallback;
}

const nativeFetch: typeof fetch = (...args) => globalThis.fetch(...args);

export const offlineAwareFetch: typeof fetch = async (...args) => {
    await assertInternetConnection();

    try {
        return await nativeFetch(...args);
    } catch (error) {
        if (isNetworkError(error)) {
            throw createOfflineError();
        }

        throw error;
    }
};
