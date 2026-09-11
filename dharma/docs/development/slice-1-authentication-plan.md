# Slice 1 Authentication Implementation Plan

Status: implemented and validated; see [slice-1-validation.md](slice-1-validation.md) for test results

## Scope and non-scope

Implement phone OTP authentication for the Dharma Customer mobile app only: request OTP, verify OTP, access token, rotating refresh token, logout, current user, session bootstrap, unauthorized handling, protected navigation, and secure token storage.

Do not implement Partner/Admin authentication, email/social login, business features, or Firebase Authentication as identity authority.

## Implementation order

1. Resolve security/product decisions: OTP and session policy values, phone region policy, SMS provider, JWT issuer/audience/signing rotation, session limits, retention, and first-verification customer creation semantics.
2. Extend Identity Domain with value objects and state transitions for normalized phone, OTP challenge, user, session, and refresh-token family. Keep provider, database, clock, token, hashing, and rate-limit ports outside Domain.
3. Define Identity Application commands/queries and ports: OTP request/verification, refresh rotation, logout, current user, `IOtpProvider`, clock, token issuer, token hash verifier, rate limiter, session repository, audit/event publisher, and unit-of-work.
4. Implement Identity Infrastructure persistence and migrations using explicit tables, unique indexes, concurrency tokens, hashed secrets, and retention jobs. Add secure configuration validation.
5. Implement infrastructure adapters for SMS provider, JWT signing/validation, rate limiting, and audit/outbox. Development OTP mode must fail closed outside explicit Development.
6. Add API DTOs/controllers or endpoints under `/api/v1/auth`, ProblemDetails mappings, 401/403/409/422/429/503 semantics, correlation IDs, and no-sensitive-data logging tests.
7. Add backend unit, integration, contract, concurrency, abuse, ownership, and database-constraint tests before mobile integration.
8. Add mobile SecureStore abstraction and auth API client. Keep access token memory-only; add a single refresh coordinator and safe 401 handling.
9. Add public/protected Expo Router route groups, login/OTP screens, bootstrap state, loading/error/cooldown states, logout, and `/auth/me` TanStack Query integration.
10. Run migration/configuration checks, provider contract tests, security scans, mobile tests, API tests, and end-to-end session journeys. Review OpenAPI and redacted logs.

## Failure scenario contract

| Scenario | Server behavior | Mobile behavior |
| --- | --- | --- |
| Invalid phone | `422 validation_error` | Show field error; no request retry |
| OTP not delivered | Safe `503` or accepted retry state; alert provider failure | Show retry state; never show OTP |
| Wrong OTP | Atomic attempt increment; `401 otp_invalid` | Remain on OTP screen; show remaining-attempt-safe message |
| Expired OTP | `401 otp_expired` | Request a new OTP |
| Too many attempts | Lock challenge; `429` | Disable verification and require resend after server time |
| OTP resend | New latest challenge; old one superseded | Replace cooldown/challenge state |
| Duplicate OTP request | Idempotent/rate-limited policy; no account enumeration | Use latest accepted challenge |
| Concurrent verification | One atomic success; loser `409`/safe terminal response | Accept one session result; do not duplicate navigation |
| Access token expired | `401`; refresh endpoint remains available | Single coordinated refresh, then replay once |
| Refresh token expired | `401 refresh_expired`; session terminal | Clear SecureStore/cache; Login |
| Refresh token reused | Revoke family; audit security event; `401` | Clear session; require OTP |
| Concurrent refresh | Serialize one successor | Await shared refresh promise |
| Logout | Revoke current/all owned sessions; idempotent `204` | Clear local state regardless of network outcome |
| Request after logout | `401` | Route to Login |
| Revoked session | `401` from auth/session validation | Clear local auth state |
| Network failure during verify | No client assumption about commit | Preserve input; retry safely or request fresh challenge |
| Network failure after verify commit | Server remains authoritative | Bootstrap/refresh on restart; avoid duplicate user creation |
| App restart | Refresh then `/auth/me` | Show bootstrap gate, then Home or Login |
| Multiple devices | Separate sessions; explicit all-session policy | Device logout does not silently clear others |
| Suspicious/revoked session | Security revoke family/session | Clear local state and require OTP |

## Test plan

Backend unit tests:

- phone normalization and validation
- OTP expiry, supersession, single use, attempt lock
- configurable rate-limit decisions
- refresh hash verification and rotation
- session state transitions and reuse detection
- authorization scope and safe ProblemDetails mapping

Backend integration/API tests:

- request/verify existing and first customer
- provider failure and generic enumeration-safe responses
- 401/403/409/422/429/503 contracts
- `/auth/me`, logout, revoked session, and refresh rotation
- database uniqueness/concurrency for OTP and refresh nodes
- concurrent verification and concurrent refresh
- audit/log redaction and correlation IDs
- secure configuration rejects production development-provider mode

Mobile tests:

- login/OTP rendering and phone/OTP validation
- loading, cooldown, resend, invalid, expired, locked, and provider-error states
- public/protected navigation guards
- bootstrap with no session, valid session, expired session, and refresh failure
- one refresh under concurrent 401 responses
- secure storage failure and logout/cache clearing
- app restart restoration and network recovery

Critical tests before Slice 1 approval: refresh reuse revocation, concurrent refresh, OTP replay/concurrent verification, rate-limit behavior, no enumeration, logout revocation, `/auth/me` ownership/scope, secure storage, redacted logs, and end-to-end app relaunch.

## Traceability

| Requirement | API | Backend owner | Database | Mobile | Test gate |
| --- | --- | --- | --- | --- | --- |
| Phone login | request/verify OTP | Identity | users, otp_challenges | Login, OTP Verification | validation, provider, OTP state |
| Server identity | `/auth/me` | Identity + Customer contract | users/customer profile | TanStack Query user | 401/403/ownership |
| Access token | auth responses | Identity token port | no token persistence | memory-only auth client | claims/expiry |
| Rotating refresh | `/auth/refresh` | Identity | sessions, refresh token nodes | SecureStore + coordinator | rotation/reuse/concurrency |
| Logout | `/auth/logout` | Identity | session revocation/audit | logout and cache clear | revoked request |
| Session bootstrap | refresh + `/auth/me` | Identity | session state | Expo Router bootstrap | relaunch matrix |
| Customer authorization | protected APIs | Identity policy | user roles/scope | protected route projection | forbidden/ownership |
| Abuse controls | request/verify/refresh | Identity + infrastructure | challenge/risk/audit records | cooldown/error UI | rate-limit/security |

## Slice 1 Definition of Done

- All approved numeric security policies are recorded as configuration and reviewed.
- Backend owns identity, OTP, token, session, and customer authorization decisions.
- No plaintext OTP or refresh token is persisted or logged.
- OTP is latest-only, single-use, expiry/attempt/resend/rate-limit behavior is tested.
- JWT access tokens validate issuer/audience/signature/expiry and carry only approved claims.
- Refresh rotation, family reuse detection, expiry, revocation, and concurrent refresh are transactionally tested.
- All five auth endpoints return the documented DTOs/statuses/ProblemDetails and correlation IDs.
- `/auth/me` and customer ownership/policy tests pass.
- Mobile uses SecureStore, memory-only access tokens, one refresh coordinator, TanStack Query for server user state, and protected/public route guards.
- App relaunch, logout, unauthorized, network failure, and provider failure tests pass.
- SMS provider is behind `IOtpProvider`; development mode cannot run in production.
- Security, dependency, secret, SAST, and relevant container scans pass with no unresolved critical findings and approved disposition for remaining risk.
- API contract, unit, integration, concurrency, and mobile tests pass in CI.
- Documentation/OpenAPI, audit events, retention, runbooks, and rollback behavior are reviewed.

## Open questions and assumptions

- Numeric OTP/session limits are intentionally not fixed in this design because the approved architecture requires configurable policy and no production values are recorded.
- The contract assumes first successful OTP verification may create the customer identity atomically; product must confirm whether a separate onboarding step is required.
- SMS vendor, phone-region policy, sender identity, and compliance requirements remain implementation dependencies.
- The current Slice 0 mobile shell has no auth routes; route-group changes belong to implementation after this design is approved.
