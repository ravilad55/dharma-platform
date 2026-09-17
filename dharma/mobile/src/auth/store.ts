import { create } from "zustand";

import api, { clearAccessToken, setAccessToken } from "../api/client";
import {
  clearRefreshMaterial,
  readOnboardingCompleted,
  readRefreshMaterial,
  writeOnboardingCompleted,
  writeRefreshMaterial,
} from "./storage";
import type { AuthSession, AuthUser, OtpRequestResult } from "./types";
import { deviceId } from "./device";
import { setSessionExpiredHandler } from "./sessionEvents";

type AuthStatus = "bootstrapping" | "unauthenticated" | "authenticated";

type AuthState = {
  status: AuthStatus;
  user: AuthUser | null;
  challenge: OtpRequestResult | null;
  phoneNumber: string;
  onboardingCompleted: boolean;
  bootstrap: () => Promise<void>;
  setOnboardingCompleted: (completed: boolean) => Promise<void>;
  requestOtp: (phoneNumber: string, deviceId?: string) => Promise<OtpRequestResult>;
  verifyOtp: (otp: string, deviceId?: string, displayName?: string) => Promise<void>;
  resendOtp: () => Promise<OtpRequestResult>;
  logout: () => Promise<void>;
  reset: () => void;
};

function applySession(session: AuthSession) {
  setAccessToken(session.accessToken);
  void writeRefreshMaterial(session.refreshToken, session.sessionId);
  void writeOnboardingCompleted(true);
  return { status: "authenticated" as const, user: session.user, onboardingCompleted: true };
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: "bootstrapping",
  user: null,
  challenge: null,
  phoneNumber: "",
  onboardingCompleted: false,
  bootstrap: async () => {
    const isCompleted = await readOnboardingCompleted();
    const material = await readRefreshMaterial();

    if (!material) {
      set({ status: "unauthenticated", user: null, onboardingCompleted: isCompleted });
      return;
    }

    try {
      const response = await api.post<AuthSession>("/auth/refresh", { refreshToken: material.refreshToken, deviceId });
      const sessionState = applySession(response.data);
      const currentUser = await api.get<AuthUser>("/auth/me");
      set({ ...sessionState, user: currentUser.data, onboardingCompleted: true });
    } catch {
      clearAccessToken();
      await clearRefreshMaterial();
      set({ status: "unauthenticated", user: null, onboardingCompleted: isCompleted });
    }
  },
  setOnboardingCompleted: async (completed: boolean) => {
    await writeOnboardingCompleted(completed);
    set({ onboardingCompleted: completed });
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
  resendOtp: async () => {
    const { phoneNumber } = get();
    if (!phoneNumber) throw new Error("Phone number is missing.");
    const response = await api.post<OtpRequestResult>("/auth/request-otp", {
      phoneNumber,
      deviceId,
    });
    set({ challenge: response.data });
    return response.data;
  },
  logout: async () => {
    try {
      await api.post("/auth/logout", { allSessions: false });
    } catch {
      // Ignore network failure during logout
    } finally {
      clearAccessToken();
      await clearRefreshMaterial();
      set({ status: "unauthenticated", user: null, challenge: null, phoneNumber: "" });
    }
  },
  reset: () => {
    clearAccessToken();
    set({ status: "unauthenticated", user: null, challenge: null, phoneNumber: "" });
  },
}));

setSessionExpiredHandler(() => {
  clearAccessToken();
  void clearRefreshMaterial();
  useAuthStore.setState({ status: "unauthenticated", user: null, challenge: null, phoneNumber: "" });
});
