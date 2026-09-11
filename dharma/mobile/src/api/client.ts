import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

import { clearRefreshMaterial, readRefreshMaterial, writeRefreshMaterial } from "../auth/storage";
import type { AuthSession } from "../auth/types";

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:5000/api/v1",
  headers: { "Content-Type": "application/json" },
});

let accessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function clearAccessToken() {
  accessToken = null;
}

async function refreshAccessToken() {
  const material = await readRefreshMaterial();
  if (!material) return null;

  const response = await axios.post<AuthSession>(
    `${process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:5000/api/v1"}/auth/refresh`,
    material,
  );
  await writeRefreshMaterial(response.data.refreshToken, response.data.sessionId);
  setAccessToken(response.data.accessToken);
  return response.data.accessToken;
}

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const request = error.config as (InternalAxiosRequestConfig & { _authRetry?: boolean }) | undefined;
    if (error.response?.status !== 401 || !request || request._authRetry || request.url?.endsWith("/auth/refresh")) {
      throw error;
    }

    request._authRetry = true;
    refreshPromise ??= refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
    const token = await refreshPromise;
    if (!token) {
      await clearRefreshMaterial();
      clearAccessToken();
      throw error;
    }

    request.headers.Authorization = `Bearer ${token}`;
    return api(request);
  },
);

export default api;
