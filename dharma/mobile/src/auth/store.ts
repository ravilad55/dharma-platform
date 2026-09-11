import { create } from "zustand";

import api, { clearAccessToken, setAccessToken } from "../api/client";
import { clearRefreshMaterial, readRefreshMaterial, writeRefreshMaterial } from "./storage";
import type { AuthSession, AuthUser, OtpRequestResult } from "./types";

type AuthStatus = "bootstrapping" | "unauthenticated" | "authenticated";

type AuthState = {
  status: AuthStatus;
  user: AuthUser | null;
  challenge: OtpRequestResult | null;
  phoneNumber: string;
  bootstrap: () => Promise<void>;
  requestOtp: (phoneNumber: string, deviceId: string) => Promise<OtpRequestResult>;
  verifyOtp: (otp: string, deviceId: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
};

const deviceId = "customer-mobile-device";

function applySession(session: AuthSession) {
  setAccessToken(session.accessToken);
  void writeRefreshMaterial(session.refreshToken, session.sessionId);
  return { status: "authenticated" as const, user: session.user };
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: "bootstrapping",
  user: null,
  challenge: null,
  phoneNumber: "",
  bootstrap: async () => {
    const material = await readRefreshMaterial();
    if (!material) {
      set({ status: "unauthenticated", user: null });
      return;
    }

    try {
      const response = await api.post<AuthSession>("/auth/refresh", material);
      const sessionState = applySession(response.data);
      const currentUser = await api.get<AuthUser>("/auth/me");
      set({ ...sessionState, user: currentUser.data });
    } catch {
      clearAccessToken();
      await clearRefreshMaterial();
      set({ status: "unauthenticated", user: null });
    }
  },
  requestOtp: async (phoneNumber, requestedDeviceId = deviceId) => {
    const response = await api.post<OtpRequestResult>("/auth/request-otp", {
      phoneNumber,
      deviceId: requestedDeviceId,
    });
    set({ challenge: response.data, phoneNumber });
    return response.data;
  },
  verifyOtp: async (otp, requestedDeviceId = deviceId, displayName) => {
    const { challenge, phoneNumber } = get();
    if (!challenge) throw new Error("OTP challenge is missing.");
    const response = await api.post<AuthSession>("/auth/verify-otp", {
      challengeId: challenge.challengeId,
      phoneNumber,
      otp,
      deviceId: requestedDeviceId,
      displayName,
    });
    set({ ...applySession(response.data), challenge: null });
  },
  logout: async () => {
    try {
      await api.post("/auth/logout", { allSessions: false });
    } finally {
      clearAccessToken();
      await clearRefreshMaterial();
      set({ status: "unauthenticated", user: null, challenge: null, phoneNumber: "" });
    }
  },
}));
