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

/**
 * Lazy-import NetInfo only when explicitly needed (not at module load time).
 * The static `import NetInfo` was triggering getifaddrs on the main thread
 * during native module registration, crashing physical iOS 26 devices.
 */
let _netInfoModule: typeof import('@react-native-community/netinfo').default | null = null;
async function getNetInfo() {
    if (!_netInfoModule) {
        const mod = await import('@react-native-community/netinfo');
        _netInfoModule = mod.default;
    }
    return _netInfoModule;
}

export async function hasInternetConnection() {
    try {
        const NetInfo = await getNetInfo();
        const state = await NetInfo.fetch();
        return Boolean(state.isConnected && state.isInternetReachable !== false);
    } catch {
        // If NetInfo itself fails, assume connected
        return true;
    }
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
    try {
        return await nativeFetch(...args);
    } catch (error) {
        if (isNetworkError(error)) {
            const rawMessage = error instanceof Error ? error.message : String(error);
            const targetUrl = typeof args[0] === 'string' ? args[0] : (args[0] && (args[0] as any).url) ? (args[0] as any).url : 'unknown_url';
            throw createOfflineError(`Fetch Failed: ${rawMessage} to ${targetUrl}`);
        }

        throw error;
    }
};
