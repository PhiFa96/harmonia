export {};
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      readonly EXPO_PUBLIC_AUTH_APPLE_ENABLED?: string;
      readonly EXPO_PUBLIC_AUTH_GOOGLE_ENABLED?: string;
      readonly EXPO_PUBLIC_AUTH_WEB_ORIGIN?: string;
      readonly EXPO_PUBLIC_LEGAL_RELEASE_APPROVED?: string;
      readonly EXPO_PUBLIC_LEGAL_WITHDRAWAL_DE?: string;
      readonly EXPO_PUBLIC_LEGAL_WITHDRAWAL_EN?: string;
      readonly EXPO_PUBLIC_LEGAL_TERMS_DE?: string;
      readonly EXPO_PUBLIC_LEGAL_TERMS_EN?: string;
      readonly EXPO_PUBLIC_LEGAL_PRIVACY_DE?: string;
      readonly EXPO_PUBLIC_LEGAL_PRIVACY_EN?: string;
      readonly EXPO_PUBLIC_LEGAL_IMPRINT?: string;
      readonly EXPO_PUBLIC_REVENUECAT_IOS_KEY?: string;
      readonly EXPO_PUBLIC_REVENUECAT_ANDROID_KEY?: string;
      readonly EXPO_PUBLIC_REVENUECAT_WEB_KEY?: string;
      readonly EXPO_PUBLIC_REVENUECAT_MAX_ENABLED?: string;
      readonly EXPO_PUBLIC_SUPABASE_URL?: string;
      readonly EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string;
      readonly EXPO_PUBLIC_SUPABASE_ANON_KEY?: string;
    }
  }
}
