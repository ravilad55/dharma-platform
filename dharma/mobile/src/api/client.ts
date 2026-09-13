import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

import { getApiBaseUrl } from "./config";
import { clearRefreshMaterial, readRefreshMaterial, writeRefreshMaterial } from "../auth/storage";
import type { AuthSession } from "../auth/types";

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: { "Content-Type": "application/json" },
});

let accessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function clearAccessToken() {
  accessToken = null;
}

export async function refreshAccessToken(): Promise<string | null> {
  const material = await readRefreshMaterial();
  if (!material) {
    return null;
  }

  try {
    const baseURL = getApiBaseUrl();
    const response = await axios.post<AuthSession>(
      `${baseURL}/auth/refresh`,
      material,
      { headers: { "Content-Type": "application/json" } }
    );

    await writeRefreshMaterial(response.data.refreshToken, response.data.sessionId);
    setAccessToken(response.data.accessToken);
    return response.data.accessToken;
  } catch {
    await clearRefreshMaterial();
    clearAccessToken();
    return null;
  }
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const request = error.config as (InternalAxiosRequestConfig & { _authRetry?: boolean }) | undefined;

    // Do not attempt refresh on auth endpoints or if already retried once
    if (
      error.response?.status !== 401 ||
      !request ||
      request._authRetry ||
      request.url?.includes("/auth/refresh") ||
      request.url?.includes("/auth/verify-otp") ||
      request.url?.includes("/auth/request-otp")
    ) {
      throw error;
    }

    request._authRetry = true;

    // Coordinate single in-flight refresh for concurrent 401 requests
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
