export type AuthUser = {
  id: string;
  displayName?: string | null;
  scope: "CUSTOMER";
  sessionId: string;
};

export type AuthSession = {
  user: AuthUser;
  accessToken: string;
  accessTokenExpiresAtUtc: string;
  refreshToken: string;
  refreshTokenExpiresAtUtc: string;
  sessionId: string;
  tokenType: "Bearer";
};

export type OtpRequestResult = {
  challengeId: string;
  maskedPhone: string;
  expiresAtUtc: string;
  resendAvailableAtUtc: string;
};
