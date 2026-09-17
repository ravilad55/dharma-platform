import Constants from "expo-constants";
import { Platform } from "react-native";

/**
 * Resolves the backend API base URL depending on platform and environment.
 * Priority:
 * 1. process.env.EXPO_PUBLIC_API_URL if explicitly provided
 * 2. If running on native device/emulator in Expo Go, uses Expo host URI's IP address (LAN IP) on port 5000
 * 3. Default to http://localhost:5000/api/v1 for Web/Desktop
 */
export function getApiBaseUrl(overrideUrl?: string): string {
  const env = typeof process !== "undefined" ? process.env : undefined;
  const envUrl = overrideUrl || env?.EXPO_PUBLIC_API_URL;
  if (envUrl) {
    return envUrl;
  }

  if (Platform.OS !== "web") {
    // In Expo development, Constants.expoConfig?.hostUri or debuggerHost holds the LAN IP:port (e.g. 192.168.1.20:8081)
    const hostUri =
      Constants.expoConfig?.hostUri ??
      (Constants as unknown as { manifest?: { debuggerHost?: string } }).manifest?.debuggerHost;

    if (hostUri) {
      const lanIp = hostUri.split(":")[0];
      if (lanIp && lanIp !== "localhost" && lanIp !== "127.0.0.1") {
        return `http://${lanIp}:5000/api/v1`;
      }
    }
  }

  return "http://localhost:5000/api/v1";
}
