import { useAuthStore } from "../store";
import api, { setAccessToken } from "../../api/client";

jest.mock("expo-secure-store", () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock("../../api/client", () => {
  const actual = jest.requireActual("../../api/client");
  return {
    __esModule: true,
    ...actual,
    default: {
      post: jest.fn(),
      get: jest.fn(),
    },
  };
});

describe("useAuthStore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setAccessToken(null);
    useAuthStore.setState({ status: "unauthenticated", user: null, challenge: null, phoneNumber: "" });
  });

  it("sets authenticated state on login", async () => {
    (api.post as jest.Mock).mockResolvedValueOnce({
      data: { challengeId: "challenge-1", maskedPhone: "+919******10", expiresAtUtc: "2026-01-01T00:05:00Z", resendAvailableAtUtc: "2026-01-01T00:00:30Z" },
    });
    (api.post as jest.Mock).mockResolvedValueOnce({
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
