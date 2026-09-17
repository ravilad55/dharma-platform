import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

import { getApiBaseUrl } from "./config";
import { clearRefreshMaterial, readRefreshMaterial, writeRefreshMaterial } from "../auth/storage";
import type { AuthSession } from "../auth/types";
import { deviceId } from "../auth/device";
import { notifySessionExpired } from "../auth/sessionEvents";

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
  if (refreshPromise) return refreshPromise;
  refreshPromise = performRefreshAccessToken().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

async function performRefreshAccessToken(): Promise<string | null> {
  const material = await readRefreshMaterial();
  logDevelopment("refresh material", { accessTokenPresent: Boolean(accessToken), refreshTokenPresent: Boolean(material?.refreshToken) });
  if (!material) {
    notifySessionExpired();
    return null;
  }

  try {
    const baseURL = getApiBaseUrl();
    const response = await axios.post<AuthSession>(
      `${baseURL}/auth/refresh`,
      { refreshToken: material.refreshToken, deviceId },
      { headers: { "Content-Type": "application/json" } }
    );

    logDevelopment("refresh response", { status: response.status });
    await writeRefreshMaterial(response.data.refreshToken, response.data.sessionId);
    setAccessToken(response.data.accessToken);
    return response.data.accessToken;
  } catch (error) {
    const axiosError = error as AxiosError<{ type?: string; title?: string; detail?: string; code?: string }>;
    logDevelopment("refresh failure", { status: axiosError.response?.status, type: axiosError.response?.data?.type, title: axiosError.response?.data?.title, detail: axiosError.response?.data?.detail, code: axiosError.response?.data?.code });
    await clearRefreshMaterial();
    clearAccessToken();
    notifySessionExpired();
    return null;
  }
}

function logDevelopment(message: string, details: Record<string, unknown>) {
  if (typeof __DEV__ !== "undefined" && __DEV__) console.warn(`[Dharma auth] ${message}`, details);
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
