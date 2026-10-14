export {};
declare global {
  namespace NodeJS {
    interface ProcessEnv {
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
