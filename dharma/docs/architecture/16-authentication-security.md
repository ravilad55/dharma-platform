# Slice 1 Authentication Security Design

Status: design only, no authentication implementation

## Threat model and authority

Mobile is an untrusted public client. The backend owns identity, OTP, sessions, tokens, and authorization. The database is authoritative for refresh/session state. Redis may provide short-lived admission control, but Redis is never the source of truth for an account, OTP, or session.

## OTP controls

- Normalize the phone number before lookup, rate limiting, persistence, and provider dispatch.
- Store a salted/peppered OTP digest or an equivalent one-way verifier, never plaintext OTP. Keep the pepper in managed secrets.
- Store challenge ID, phone hash/lookup key, expiry, consumed time, superseded time, attempt count, lock state, provider delivery reference, device hash, IP risk metadata, and timestamps.
- Only the newest active challenge for a phone/security subject is valid; verification is single-use.
- Apply independent configurable limits for phone, IP, device, and global/provider capacity. Return generic `429` responses and `Retry-After`.
- Apply a resend cooldown and bounded challenge request window. Numeric values require security/product approval and are configuration, not code constants.
- Constant-shape responses and masked metadata prevent account enumeration. Logs and metrics use opaque IDs or keyed hashes, not raw phone numbers.
- Wrong OTP increments attempts atomically. At the configured threshold, transition to blocked/locked and require a new challenge or policy-defined recovery.
- Provider failures produce safe retryable errors and an operational alert; they never expose provider credentials or OTP content.

## Tokens and sessions

- Access JWTs are short-lived and signed with an asymmetric key where operationally approved. Private keys are held in Secrets Manager/KMS-backed configuration; public verification keys are rotated and published internally.
- Validate issuer, audience, signature, `exp`, `nbf`, `jti`, and `sid`. Clock skew is bounded configuration.
- Refresh tokens are cryptographically random opaque values. Persist only a strong hash, token family ID, token-node ID, session ID, device metadata, expiry, consumed/revoked timestamps, and audit state.
- Rotation is atomic. A consumed token presented again is token reuse, not a normal expiry; revoke the family/session and require OTP login.
- Logout revokes the server session and clears mobile storage/cache. Security revocation records actor, reason, correlation ID, and timestamp without token material.
- Device IDs are opaque application identifiers, not trusted identity. Avoid using hardware identifiers that create unnecessary tracking.
- Enforce a configurable session/device limit with an explicit product policy; do not silently revoke an unrelated device.

## Mobile storage and transport

- Store refresh/session material only in iOS Keychain/Android Keystore through Expo SecureStore or an approved equivalent.
- Keep access tokens memory-only where practical; never persist them in AsyncStorage, ordinary preferences, logs, crash payloads, analytics, or navigation params.
- Use TLS in all non-local environments, certificate/transport defaults, and no secrets in the mobile bundle.
- Axios interceptors attach the in-memory access token. A single refresh coordinator serializes refresh calls; failed refresh clears secure material and customer-scoped TanStack Query cache.
- Treat deep links and push payloads as untrusted input. Never put access/refresh tokens or OTPs in links, push payloads, screenshots, clipboard, or analytics.

## API abuse and authorization

- Rate-limit OTP request, OTP verification, refresh, and logout routes independently.
- Add request body size limits, HTTPS, safe CORS, structured validation, and generic error bodies.
- Customer scope is established server-side. Resource handlers check subject ownership from the database; client role claims and route parameters are not authorization proof.
- Partner/Admin policies remain separate and are not activated by a customer token.
- Use idempotency and concurrency constraints for verification, refresh rotation, logout, and first-user creation.

## Logging and audit

Never log OTPs, access tokens, refresh tokens, Authorization headers, secrets, full phone numbers, raw SMS/provider bodies, or full request bodies. Safe fields include event type, opaque user/session/challenge IDs, keyed phone hash where operationally necessary, outcome category, route template, status, latency, correlation ID, provider category, attempt count bucket, and environment.

Audit security events: OTP requested/sent/failed/blocked, user authenticated, session created/revoked/expired, refresh reuse detected, logout, account status change, and suspicious activity. Audit records exclude credential material and are access-controlled.

## Privacy and retention

- Retain OTP challenge records only for the configured security/audit period; cryptographic material and provider content are minimized and purged sooner.
- Retain refresh/session records long enough for security investigation and legal policy, then pseudonymize or delete according to the approved retention schedule.
- Hash or tokenize phone lookup/risk data and restrict access.
- Do not use logs as the system of record for identity or audit.

## Provider and development safety

`IOtpProvider` isolates SMS. A development provider is allowed only with an explicit development environment plus opt-in flag and must fail closed in production. Production configuration validation must reject development OTP mode, placeholder signing keys, empty issuer/audience, and non-TLS provider endpoints.

## Security test gates

Before Slice 1 approval, test brute-force resistance, enumeration-safe responses, OTP replay/expiry/supersession, concurrent verification, refresh rotation/reuse, concurrent refresh, logout revocation, ownership/role policy, secure-storage failure, redacted logs, and provider outage. Add SAST, dependency, secret, and container scans to the release pipeline.
