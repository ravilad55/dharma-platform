import * as SecureStore from "expo-secure-store";

const refreshTokenKey = "dharma.refresh-token";
const sessionIdKey = "dharma.session-id";

export async function readRefreshMaterial() {
  const [refreshToken, sessionId] = await Promise.all([
    SecureStore.getItemAsync(refreshTokenKey),
    SecureStore.getItemAsync(sessionIdKey),
  ]);

  return refreshToken && sessionId ? { refreshToken, sessionId } : null;
}

export async function writeRefreshMaterial(refreshToken: string, sessionId: string) {
  await Promise.all([
    SecureStore.setItemAsync(refreshTokenKey, refreshToken),
    SecureStore.setItemAsync(sessionIdKey, sessionId),
  ]);
}

export async function clearRefreshMaterial() {
  await Promise.all([
    SecureStore.deleteItemAsync(refreshTokenKey),
    SecureStore.deleteItemAsync(sessionIdKey),
  ]);
}
