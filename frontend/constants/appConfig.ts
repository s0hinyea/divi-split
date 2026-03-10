import Constants from 'expo-constants';

type ExtraConfig = {
    privacyPolicyUrl?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as ExtraConfig;

export const privacyPolicyUrl =
    process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL?.trim() ||
    extra.privacyPolicyUrl?.trim() ||
    '';
