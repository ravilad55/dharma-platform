import axios from "axios";
import { clearAccessToken, getAccessToken, refreshAccessToken, setAccessToken } from "../../src/api/client";
import * as storage from "../../src/auth/storage";
import type { AuthSession } from "../../src/auth/types";
import { deviceId } from "../../src/auth/device";

jest.mock("axios", () => {
  const actual = jest.requireActual("axios");
  return {
    ...actual,
    post: jest.fn(),
  };
});

describe("Axios API Client & Refresh Coordinator", () => {
  const mockSession: AuthSession = {
    user: {
      id: "u-1",
      displayName: "Test User",
      scope: "CUSTOMER",
      sessionId: "s-1",
    },
    accessToken: "new-access-token-999",
    accessTokenExpiresAtUtc: "2026-01-01T00:10:00Z",
    refreshToken: "new-refresh-token-888",
    refreshTokenExpiresAtUtc: "2026-02-01T00:00:00Z",
    sessionId: "s-1",
    tokenType: "Bearer",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    clearAccessToken();
  });

  it("sets, gets, and clears access token in memory only", () => {
    expect(getAccessToken()).toBeNull();

    setAccessToken("sample-jwt-token");
    expect(getAccessToken()).toBe("sample-jwt-token");

    clearAccessToken();
    expect(getAccessToken()).toBeNull();
  });

  describe("refreshAccessToken", () => {
    it("returns null if no refresh material in SecureStore", async () => {
      jest.spyOn(storage, "readRefreshMaterial").mockResolvedValueOnce(null);

      const token = await refreshAccessToken();
      expect(token).toBeNull();
      expect(getAccessToken()).toBeNull();
    });

    it("rotates refresh token and stores new access token on successful refresh", async () => {
      jest.spyOn(storage, "readRefreshMaterial").mockResolvedValueOnce({
        refreshToken: "current-refresh-token",
        sessionId: "s-1",
      });
      const writeSpy = jest.spyOn(storage, "writeRefreshMaterial").mockResolvedValueOnce();

      (axios.post as jest.Mock).mockResolvedValueOnce({ data: mockSession });

      const token = await refreshAccessToken();

      expect(token).toBe("new-access-token-999");
      expect(getAccessToken()).toBe("new-access-token-999");
      expect(writeSpy).toHaveBeenCalledWith("new-refresh-token-888", "s-1");
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining("/auth/refresh"),
        { refreshToken: "current-refresh-token", deviceId },
        expect.any(Object),
      );
    });

    it("clears storage and access token if refresh fails (e.g. 401 revoked)", async () => {
      jest.spyOn(storage, "readRefreshMaterial").mockResolvedValueOnce({
        refreshToken: "revoked-refresh-token",
        sessionId: "s-1",
      });
      const clearSpy = jest.spyOn(storage, "clearRefreshMaterial").mockResolvedValueOnce();

      (axios.post as jest.Mock).mockRejectedValueOnce(new Error("401 Unauthorized"));

      const token = await refreshAccessToken();

      expect(token).toBeNull();
      expect(getAccessToken()).toBeNull();
      expect(clearSpy).toHaveBeenCalled();
    });
  });

  describe("concurrent 401 coordination", () => {
    it("executes only one refresh operation for multiple concurrent refresh requests", async () => {
      jest.spyOn(storage, "readRefreshMaterial").mockResolvedValue({
        refreshToken: "valid-refresh-token",
        sessionId: "s-1",
      });
      jest.spyOn(storage, "writeRefreshMaterial").mockResolvedValue();

      (axios.post as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ data: mockSession }), 50))
      );

      // Trigger multiple concurrent calls to refreshAccessToken
      const [token1, token2, token3] = await Promise.all([
        refreshAccessToken(),
        refreshAccessToken(),
        refreshAccessToken(),
      ]);

      expect(token1).toBe("new-access-token-999");
      expect(token2).toBe("new-access-token-999");
      expect(token3).toBe("new-access-token-999");
    });
  });
});
