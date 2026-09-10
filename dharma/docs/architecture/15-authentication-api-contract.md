# Slice 1 Authentication API Contract

Status: design only, no endpoint implementation
Base path: `/api/v1`

All JSON is camelCase. All errors are RFC 7807 `application/problem+json` with `code`, `traceId`, and optional `fieldErrors`. Do not reveal whether a phone number has an account. Protected requests use `Authorization: Bearer <access-token>`. HTTPS is required outside local development.

## Common DTOs

`OtpRequestAccepted`: `challengeId` opaque ID, masked destination, `expiresAtUtc`, `resendAvailableAtUtc`.

`AuthSession`: `user` customer DTO, short-lived `accessToken`, `accessTokenExpiresAtUtc`, opaque `refreshToken`, `refreshTokenExpiresAtUtc`, `sessionId`, `tokenType`.

`CurrentUser`: `id`, `displayName`, optional normalized-safe profile fields, `scope: CUSTOMER`, `sessionId`. No raw phone, tokens, OTP, or security metadata.

## POST `/api/v1/auth/request-otp`

Public. Request:

```json
{ "phoneNumber": "+919876543210", "deviceId": "opaque-device-id" }
```

Validation: canonical phone normalization; permitted country/region; bounded lengths; device ID format. The server applies phone, IP, device, and global abuse limits. `Idempotency-Key` is accepted for retry correlation but repeated calls do not reveal whether an account exists.

Responses:

- `202 Accepted`: `OtpRequestAccepted`; response is deliberately similar for existing and new customer numbers.
- `422`: `validation_error` for malformed input.
- `429`: `rate_limited` with `Retry-After`; do not reveal which limit was hit.
- `503`: `otp_provider_unavailable` with a safe retry message; no provider details.

Concurrency: a new accepted challenge supersedes the previous challenge for the same phone/security subject. The prior challenge becomes unusable. Provider dispatch and challenge persistence require an explicit failure policy; an accepted response must not claim delivery if the durable send handoff failed.

## POST `/api/v1/auth/verify-otp`

Public. Request:

```json
{ "challengeId": "opaque-challenge-id", "phoneNumber": "+919876543210", "otp": "123456", "deviceId": "opaque-device-id", "displayName": "Optional on first verification" }
```

Validation: challenge ID, canonical phone match, OTP shape, device ID, and display-name rules where first-use onboarding requires it. The server atomically checks latest/unexpired/unconsumed challenge, attempt limit, and lock state, then consumes the OTP and creates/updates the customer/session.

Responses:

- `200`: existing customer; `AuthSession`.
- `201`: first verified customer identity created; `AuthSession`.
- `401`: `otp_invalid` only when the challenge exists but the supplied code is wrong; response does not disclose account existence.
- `409`: `otp_superseded`, `otp_already_used`, or concurrent terminal state.
- `422`: `validation_error`.
- `429`: `otp_attempts_exceeded` or abuse rate limit with `Retry-After`.
- `503`: `otp_provider_unavailable` only for provider-dependent workflows; verification itself should rely on the server challenge record.

Concurrency: only one concurrent verification can consume a challenge. Duplicate successful verification must not create another user/session for the same request; a retried client should use the returned idempotent result where retained, otherwise obtain a new challenge.

## POST `/api/v1/auth/refresh`

Public transport endpoint but requires a valid refresh token. Request:

```json
{ "refreshToken": "opaque-refresh-token", "deviceId": "opaque-device-id" }
```

The refresh token is accepted in the body over TLS; never put it in a URL or logs. The server hashes and looks up the session token node, validates active family/session/device and expiry, atomically consumes the presented node, and returns a new `AuthSession` with rotated refresh token.

Responses:

- `200`: rotated `AuthSession`.
- `401`: `refresh_invalid`, `refresh_expired`, `session_revoked`, or `refresh_reuse_detected`; the client clears local session state. Do not distinguish these to an attacker beyond safe client handling.
- `409`: `refresh_concurrent` only if the server cannot safely serialize the same request; client retries once with the current in-flight result, not the consumed token.
- `422`: malformed request.
- `429`: refresh abuse limit.

Idempotency/concurrency: use token-node single consumption and a short per-session lock or transaction uniqueness. Never let two callers mint two successors from one refresh token.

## POST `/api/v1/auth/logout`

Customer-authenticated. Request:

```json
{ "sessionId": "current-session-id", "allSessions": false }
```

The server ignores a session ID not owned by the authenticated subject. `allSessions` requires the customer policy only and cannot revoke another user.

Responses:

- `204`: current-session or requested owned sessions revoked; repeated logout is idempotent.
- `401`: missing/invalid access token. The mobile client still clears local state.
- `403`: authenticated subject lacks the requested scope/policy.
- `422`: invalid session request.

## GET `/api/v1/auth/me`

Customer-authenticated. No request body. Returns `200 CurrentUser` after validating access token, session/account status, and customer scope. `401` means unauthenticated or expired/revoked session; `403` means authenticated but not permitted for the customer scope. Never return a raw User entity.

## ProblemDetails catalogue

- `validation_error` -> `422`, field errors.
- `unauthenticated` -> `401`, no sensitive reason.
- `forbidden` -> `403`.
- `otp_invalid`, `otp_expired`, `otp_superseded`, `otp_already_used` -> `401` or `409` as defined above.
- `otp_attempts_exceeded`, `rate_limited` -> `429`, `Retry-After`.
- `conflict` / `refresh_concurrent` -> `409`.
- `otp_provider_unavailable` / `dependency_unavailable` -> `503`.
- `internal_error` -> `500`, generic body and correlation ID only.

## Headers and observability

Every response includes `X-Correlation-ID`. Clients may send a bounded correlation ID; the server generates one otherwise. Requests never log `Authorization`, OTP, refresh token, phone number, or raw request bodies.
