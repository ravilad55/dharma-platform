# 06 Security Architecture

## Threat boundaries

The mobile app, internet clients, partner clients, web admin, AWS edge, API, database, cache, search, and external providers are separate trust zones. The client is untrusted for identity, authorization, totals, availability, and payment confirmation.

## Identity and sessions

Use short-lived JWT access tokens and rotating refresh tokens. Store only refresh/session material in platform secure storage (Expo SecureStore or approved equivalent), never in ordinary preferences or logs. Hash refresh tokens at rest, revoke on logout/security events, detect reuse, and support device/session visibility if approved. Password/OTP policy and identity verification channel are open questions.

Access-token claims identify subject and coarse roles. Resource ownership is checked server-side against the database. Do not trust role values supplied by the client. Use policy-based authorization for customer ownership, partner assignment/organization, and admin capabilities.

## Authorization matrix

- Customer: own profile, addresses, favorites, carts, bookings, orders, payments, delivery requests, notifications.
- Pandit: own approved profile/services/availability and assigned bookings in future Partner App.
- Pooja shop: own catalog and orders in future Partner App.
- Restaurant: own restaurant/menu and orders in future Partner App.
- Delivery partner: assigned delivery requests and permitted status/location operations.
- Admin: explicit least-privilege policies for support/operations/configuration; sensitive actions audited.

## Input and API security

Validate DTOs at the API boundary and enforce domain invariants again. Use HTTPS everywhere, secure CORS for approved clients, request size limits, rate limits, anti-abuse controls, and correlation IDs. Do not expose stack traces or SQL/provider details. Use parameterized EF queries and output encoding for rendered text.

## Payment security

Stripe owns card data. Use provider-hosted/client SDK payment collection where approved. Store only payment intent/reference, status, amounts, and safe failure metadata. Verify webhook signatures, deduplicate event IDs, and require server-side state transitions. Audit payment and booking mutations without logging secrets.

## Secrets and data protection

Store database, Stripe, FCM, Maps, AWS, JWT signing, and OpenSearch credentials in AWS Secrets Manager or approved managed configuration. Rotate secrets. Separate environments/accounts. Encrypt RDS, Redis, S3, backups, and transport. Use KMS-managed keys and least-privilege IAM roles for ECS tasks.

## Privacy and retention

Classify identity, address, location, payment references, device tokens, and support data. Minimize collection, redact logs, define retention/deletion/export policies, and restrict operational access. Delivery location history needs a retention decision. Do not persist precise location longer than required for the delivery use case.

## Audit and incident response

Audit login/security events, role changes, administrative actions, booking/payment state changes, refunds, and support interventions. Each audit record includes actor, action, resource, result, timestamp, and correlation ID, excluding credentials and payment secrets. Alert on refresh-token reuse, repeated payment failures, authorization failures, webhook signature failures, and unusual booking patterns.

## Mobile security

Use secure storage, certificate/transport defaults, no secrets in the bundle, release build hardening, safe screenshots/clipboard behavior for sensitive views, and redacted analytics. Handle logout and account deletion by clearing customer-scoped cache. Treat push payloads as untrusted and avoid sensitive data in notification bodies.

## Security testing

Require dependency and container scanning, SAST, secret scanning, API authorization tests, webhook replay tests, rate-limit tests, token rotation/revocation tests, and targeted penetration testing before production. Booking/payment concurrency tests are security and integrity tests, not merely functional tests.
