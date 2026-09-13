import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const refreshTokenKey = "dharma.refresh-token";
const sessionIdKey = "dharma.session-id";

async function isSecureStoreAvailable(): Promise<boolean> {
  if (Platform.OS === "web") {
    return false;
  }
  return SecureStore.isAvailableAsync();
}

export async function readRefreshMaterial() {
  if (!(await isSecureStoreAvailable())) {
    if (typeof window !== "undefined" && window.localStorage) {
      const refreshToken = window.localStorage.getItem(refreshTokenKey);
      const sessionId = window.localStorage.getItem(sessionIdKey);
      return refreshToken && sessionId ? { refreshToken, sessionId } : null;
    }
    return null;
  }

  const [refreshToken, sessionId] = await Promise.all([
    SecureStore.getItemAsync(refreshTokenKey),
    SecureStore.getItemAsync(sessionIdKey),
  ]);

  return refreshToken && sessionId ? { refreshToken, sessionId } : null;
}

export async function writeRefreshMaterial(refreshToken: string, sessionId: string) {
  if (!(await isSecureStoreAvailable())) {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(refreshTokenKey, refreshToken);
      window.localStorage.setItem(sessionIdKey, sessionId);
    }
    return;
  }

  await Promise.all([
    SecureStore.setItemAsync(refreshTokenKey, refreshToken),
    SecureStore.setItemAsync(sessionIdKey, sessionId),
  ]);
}

export async function clearRefreshMaterial() {
  if (!(await isSecureStoreAvailable())) {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.removeItem(refreshTokenKey);
      window.localStorage.removeItem(sessionIdKey);
    }
    return;
  }

  await Promise.all([
    SecureStore.deleteItemAsync(refreshTokenKey),
    SecureStore.deleteItemAsync(sessionIdKey),
  ]);
}
