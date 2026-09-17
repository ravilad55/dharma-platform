import { useAuthStore } from "../store";
import api, { clearAccessToken, setAccessToken } from "../../api/client";
import * as storage from "../storage";
import type { AuthSession, AuthUser, OtpRequestResult } from "../types";

jest.mock("expo-secure-store", () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock("../../api/client", () => {
  let inMemoryToken: string | null = null;
  const actual = jest.requireActual("../../api/client");
  return {
    __esModule: true,
    ...actual,
    getAccessToken: jest.fn(() => inMemoryToken),
    setAccessToken: jest.fn((token: string | null) => {
      inMemoryToken = token;
    }),
    clearAccessToken: jest.fn(() => {
      inMemoryToken = null;
    }),
    default: {
      post: jest.fn(),
      get: jest.fn(),
    },
  };
});

describe("Auth Store & Lifecycle", () => {
  const mockUser: AuthUser = {
    id: "user-123",
    displayName: "Arjun Sharma",
    scope: "CUSTOMER",
    sessionId: "session-456",
  };

  const mockSession: AuthSession = {
    user: mockUser,
    accessToken: "jwt-access-token-abc",
    accessTokenExpiresAtUtc: "2026-01-01T00:10:00Z",
    refreshToken: "raw-refresh-token-xyz",
    refreshTokenExpiresAtUtc: "2026-02-01T00:00:00Z",
    sessionId: "session-456",
    tokenType: "Bearer",
  };

  const mockChallenge: OtpRequestResult = {
    challengeId: "chal-789",
    maskedPhone: "+919******10",
    expiresAtUtc: "2026-01-01T00:05:00Z",
    resendAvailableAtUtc: "2026-01-01T00:00:30Z",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    clearAccessToken();
    useAuthStore.setState({
      status: "unauthenticated",
      user: null,
      challenge: null,
      phoneNumber: "",
    });
  });

  describe("requestOtp", () => {
    it("successfully requests OTP and stores challenge", async () => {
      (api.post as jest.Mock).mockResolvedValueOnce({ data: mockChallenge });

      const store = useAuthStore.getState();
      const result = await store.requestOtp("+919876543210", "test-device");

      expect(api.post).toHaveBeenCalledWith("/auth/request-otp", {
        phoneNumber: "+919876543210",
        deviceId: "test-device",
      });
      expect(result.challengeId).toBe("chal-789");

      const state = useAuthStore.getState();
      expect(state.challenge).toEqual(mockChallenge);
      expect(state.phoneNumber).toBe("+919876543210");
    });

    it("propagates API errors when OTP request fails", async () => {
      (api.post as jest.Mock).mockRejectedValueOnce(new Error("Rate limit exceeded"));

      const store = useAuthStore.getState();
      await expect(store.requestOtp("+919876543210")).rejects.toThrow("Rate limit exceeded");
    });
  });

  describe("verifyOtp", () => {
    it("successfully verifies OTP and establishes authenticated session", async () => {
      const writeSpy = jest.spyOn(storage, "writeRefreshMaterial");
      useAuthStore.setState({
        challenge: mockChallenge,
        phoneNumber: "+919876543210",
      });

      (api.post as jest.Mock).mockResolvedValueOnce({ data: mockSession });

      const store = useAuthStore.getState();
      await store.verifyOtp("123456", "test-device");

      expect(api.post).toHaveBeenCalledWith("/auth/verify-otp", {
        challengeId: "chal-789",
        phoneNumber: "+919876543210",
        otp: "123456",
        deviceId: "test-device",
        displayName: undefined,
      });

      const state = useAuthStore.getState();
      expect(state.status).toBe("authenticated");
      expect(state.user).toEqual(mockUser);
      expect(state.challenge).toBeNull();
      expect(setAccessToken).toHaveBeenCalledWith("jwt-access-token-abc");
      expect(writeSpy).toHaveBeenCalledWith("raw-refresh-token-xyz", "session-456");
    });

    it("throws error if OTP challenge is missing", async () => {
      useAuthStore.setState({ challenge: null });

      const store = useAuthStore.getState();
      await expect(store.verifyOtp("123456")).rejects.toThrow("OTP challenge is missing.");
    });
  });

  describe("resendOtp", () => {
    it("resends OTP using stored phone number", async () => {
      useAuthStore.setState({ phoneNumber: "+919876543210" });
      (api.post as jest.Mock).mockResolvedValueOnce({ data: mockChallenge });

      const store = useAuthStore.getState();
      const result = await store.resendOtp();

      expect(api.post).toHaveBeenCalledWith("/auth/request-otp", {
        phoneNumber: "+919876543210",
        deviceId: "customer-mobile-device",
      });
      expect(result.challengeId).toBe("chal-789");
    });

    it("throws error if phone number is missing on resend", async () => {
      useAuthStore.setState({ phoneNumber: "" });

      const store = useAuthStore.getState();
      await expect(store.resendOtp()).rejects.toThrow("Phone number is missing.");
    });
  });

  describe("setOnboardingCompleted", () => {
    it("updates store and writes completion flag to SecureStore", async () => {
      const writeSpy = jest.spyOn(storage, "writeOnboardingCompleted").mockResolvedValue(undefined);

      const store = useAuthStore.getState();
      await store.setOnboardingCompleted(true);

      expect(writeSpy).toHaveBeenCalledWith(true);
      expect(useAuthStore.getState().onboardingCompleted).toBe(true);
    });
  });

  describe("bootstrap", () => {
    it("remains unauthenticated if no refresh material in SecureStore", async () => {
      jest.spyOn(storage, "readOnboardingCompleted").mockResolvedValueOnce(false);
      jest.spyOn(storage, "readRefreshMaterial").mockResolvedValueOnce(null);

      const store = useAuthStore.getState();
      await store.bootstrap();

      const state = useAuthStore.getState();
      expect(state.status).toBe("unauthenticated");
      expect(state.onboardingCompleted).toBe(false);
      expect(state.user).toBeNull();
    });

    it("restores session and fetches current user if refresh material exists", async () => {
      jest.spyOn(storage, "readOnboardingCompleted").mockResolvedValueOnce(true);
      jest.spyOn(storage, "readRefreshMaterial").mockResolvedValueOnce({
        refreshToken: "valid-stored-refresh-token",
        sessionId: "session-456",
      });

      (api.post as jest.Mock).mockResolvedValueOnce({ data: mockSession });
      (api.get as jest.Mock).mockResolvedValueOnce({ data: mockUser });

      const store = useAuthStore.getState();
      await store.bootstrap();

      expect(api.post).toHaveBeenCalledWith("/auth/refresh", {
        refreshToken: "valid-stored-refresh-token",
        deviceId: "customer-mobile-device",
      });
      expect(api.get).toHaveBeenCalledWith("/auth/me");

      const state = useAuthStore.getState();
      expect(state.status).toBe("authenticated");
      expect(state.onboardingCompleted).toBe(true);
      expect(state.user).toEqual(mockUser);
    });

    it("clears storage and sets unauthenticated if bootstrap refresh fails", async () => {
      jest.spyOn(storage, "readRefreshMaterial").mockResolvedValueOnce({
        refreshToken: "expired-refresh-token",
        sessionId: "session-456",
      });
      const clearSpy = jest.spyOn(storage, "clearRefreshMaterial");

      (api.post as jest.Mock).mockRejectedValueOnce(new Error("401 Unauthorized"));

      const store = useAuthStore.getState();
      await store.bootstrap();

      expect(clearAccessToken).toHaveBeenCalled();
      expect(clearSpy).toHaveBeenCalled();

      const state = useAuthStore.getState();
      expect(state.status).toBe("unauthenticated");
      expect(state.user).toBeNull();
    });
  });

  describe("logout", () => {
    it("calls API logout and clears all session material and local state", async () => {
      const clearSpy = jest.spyOn(storage, "clearRefreshMaterial");
      useAuthStore.setState({
        status: "authenticated",
        user: mockUser,
        challenge: mockChallenge,
        phoneNumber: "+919876543210",
      });

      (api.post as jest.Mock).mockResolvedValueOnce({ status: 204 });

      const store = useAuthStore.getState();
      await store.logout();

      expect(api.post).toHaveBeenCalledWith("/auth/logout", { allSessions: false });
      expect(clearAccessToken).toHaveBeenCalled();
      expect(clearSpy).toHaveBeenCalled();

      const state = useAuthStore.getState();
      expect(state.status).toBe("unauthenticated");
      expect(state.user).toBeNull();
      expect(state.challenge).toBeNull();
      expect(state.phoneNumber).toBe("");
    });
  });
});
