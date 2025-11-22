export const oneSignalConfig = {
  appId: import.meta.env.VITE_ONESIGNAL_APP_ID || '',
  allowLocalhostAsSecureOrigin: true,
};

// Type definitions for OneSignal
declare global {
  interface Window {
    OneSignal: any;
  }
}