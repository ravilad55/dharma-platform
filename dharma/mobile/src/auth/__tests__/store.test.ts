import { useAuthStore } from "../store";
import { clearAccessToken, setAccessToken } from "../../api/client";

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock("axios", () => {
  const actual = jest.requireActual("axios");
  return {
    ...actual,
    create: jest.fn(() => ({
      ...actual,
      post: jest.fn(),
      get: jest.fn(),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
    })),
  };
});

describe("useAuthStore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setAccessToken(null);
    useAuthStore.setState({ status: "unauthenticated", user: null, challenge: null, phoneNumber: "" });
  });

  it("sets authenticated state on login", async () => {
    const mockPost = require("axios").create().post;
    mockPost.mockResolvedValueOnce({
      data: { challengeId: "challenge-1", maskedPhone: "+919******10", expiresAtUtc: "2026-01-01T00:05:00Z", resendAvailableAtUtc: "2026-01-01T00:00:30Z" },
    });
    mockPost.mockResolvedValueOnce({
      data: {
        user: { id: "user-1", displayName: "Test", scope: "CUSTOMER", sessionId: "session-1" },
        accessToken: "access-1",
        accessTokenExpiresAtUtc: "2026-01-01T00:10:00Z",
        refreshToken: "refresh-1",
        refreshTokenExpiresAtUtc: "2026-01-01T00:00:00Z",
        sessionId: "session-1",
        tokenType: "Bearer",
      },
    });

    const store = useAuthStore.getState();
    await store.requestOtp("+919876543210", "device");
    await store.verifyOtp("123456", "device");

    const state = useAuthStore.getState();
    expect(state.status).toBe("authenticated");
    expect(state.user?.id).toBe("user-1");
  });
});
