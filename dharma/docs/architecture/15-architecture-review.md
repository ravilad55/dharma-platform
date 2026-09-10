# 15 Architecture Review

## Review scope and verdict

Reviewed `AGENTS.md`, the complete requirements DOCX, architecture documents `01` through `14`, and all UX documents. The approved V1 decision gate resolved the prior product and architecture blockers. The architecture is now ready to begin implementation at Slice 0, with contract tests, architecture dependency tests, and booking/payment concurrency tests mandatory before feature release.

## Readiness score

**91/100**

The score reflects explicit V1 scope, fixed-slot booking integrity, authoritative Stripe processing, durable idempotency/outbox/inbox infrastructure, complete customer API paths, SNS/SQS event contracts, partner ownership, delivery polling, and mobile offline rules. It is not a production-readiness score; operational targets and executable validation remain.

## Critical findings

**None remain as unresolved architecture-direction issues.** The former critical findings are closed as follows:

- Booking/payment state transitions are explicit in [02-system-architecture.md](02-system-architecture.md), including expiry, finalization failure, reconciliation, refund, and terminal-state precedence.
- Fixed canonical slots plus conditional MySQL claim and shorter Redis admission-lock TTL prevent same-slot double reservation; the losing request receives `409 slot_unavailable`.
- Stripe webhook deduplication, durable payment attempts, reconciliation, and idempotent void/refund are defined.
- Home, Search, Payment Methods, Favorites, Settings, Support, Reviews, Checkout, Delivery, Tracking, and reconciliation APIs/data paths are defined.

## High findings

**None block V1 implementation.** The former high findings are closed by explicit dependency direction, partner organization/membership ownership, non-polymorphic ownership relationships, durable infrastructure tables, finite-inventory reservations, one-merchant carts/orders, and the SNS/SQS producer/consumer matrix.

## Remaining medium issues

1. Numeric SLO/RPO/RTO values, traffic profiles, retention periods, and alert thresholds remain implementation/operations configuration.
2. MySQL indexes, fixed-slot constraints, inventory versioning, and status-transition constraints require query-plan, migration, and concurrency validation.
3. Provider-specific configuration for Stripe, OTP, Maps, FCM, OpenSearch, SNS/SQS, and their failure responses requires integration tests.
4. Migration execution, rollback/forward-fix, environment networking, WAF, and operational runbooks must be completed before production.
5. Notification templates, support content, localization, and final redaction examples require content review.

## Remaining low issues

1. Final accessibility acceptance values and visual regression baselines.
2. Final public identifier examples and complete ProblemDetails examples in OpenAPI.
3. Dashboard presentation and support workflow polish.

## Booking concurrency review

| Scenario | Expected result and state | Integrity/recovery control |
|---|---|---|
| Two customers claim one slot | One `AVAILABLE -> RESERVED`; loser gets `409 slot_unavailable` | Redis canonical lock plus conditional MySQL fixed-slot claim and durable idempotency |
| Payment fails | No confirmation; `PAYMENT_PENDING -> PAYMENT_FAILED -> EXPIRED` | Signed provider result, status transaction, owner-token lock release, expiry worker |
| Mobile loses network after payment | Server confirms or reconciles independently | Stripe webhook and `GET /payments/{id}`/reconciliation status; no client authority |
| Duplicate webhook | First valid event applies; duplicate is no-op | Unique `payment_webhook_receipts.provider_event_id` and processed-event deduplication |
| Booking request retry | Original result is returned; changed payload with same key is `409 idempotency_conflict` | MySQL durable idempotency record with subject/route/request hash |
| Redis unavailable | New reservation admission fails closed | Existing MySQL records remain authoritative; safe retry after recovery |
| Hold expires during payment | No false confirmation; reconciliation determines commit or refund | Conditional expiry/finalization; `AWAITING_RECONCILIATION`; idempotent void/refund |
| API timeout after server success | Retry returns original reservation/payment state | Durable idempotency result linked to business transaction |
| Payment succeeds but finalization fails | `FINALIZATION_FAILED -> AWAITING_RECONCILIATION`; retry then refund/void if needed | Booking/payment correlation, reconciliation worker, refund record and audit |
| Stale availability | Reservation command revalidates and rejects if taken | Cache/search advisory only; current MySQL fixed-slot state decides |

## Payment review

Stripe PaymentIntent is the provider boundary and INR is the only V1 currency. Dharma calculates amount server-side, validates webhook signatures, deduplicates provider events, tracks payment attempts, and never confirms from mobile callback alone. Booking confirmation requires the Booking conditional finalization port. A successful payment that cannot commit a slot remains reconcilable and follows retry then void/refund compensation. Payment, refund, webhook, and reconciliation identifiers are durable and idempotent.

## Redis review

Cache and lock responsibilities are separate. Cache is derived, TTL-bound, invalidatable, and bypassable. The distributed lock uses a fixed slot key, random ownership token, atomic compare-and-delete, and a TTL shorter than the ten-minute MySQL reservation. Redis outage fails closed for new holds; MySQL remains authoritative. Cache projection owners, freshness targets, and rebuild paths are required implementation metadata.

## Event review

SNS topics and SQS subscriptions provide at-least-once delivery. The canonical V1 event names include `BookingConfirmed`, `PaymentSucceeded`, `OrderPlaced`, `PartnerAssigned`, and `DeliveryCompleted`. Versioned payloads include event ID, schema version, aggregate subject, correlation/causation IDs, occurred time, and redacted data. Consumers use `processed_events`, retries, visibility timeouts, DLQs, aggregate ordering keys where required, and authorized replay. No event consumer is allowed to bypass domain state guards.

## API review

All approved V1 screens now have `/api/v1/` paths with authentication, authorization, DTOs, validation, ProblemDetails, pagination where applicable, status semantics, idempotency, and concurrency rules. Added paths include phone OTP, `/home`, `/search`, places, checkout, delivery quotes, reconciliation, payment methods, favorites, settings, support cases, and reviews. The API contract uses one-merchant carts, INR money, polling delivery tracking, and no offline financial/order mutation queue.

## React Native review

The feature architecture is consistent with React Native/Expo: screens remain presentation-focused; repositories use Axios; TanStack Query owns server state; Zustand owns only client/application state; React Hook Form/Zod own form interaction; Expo Router owns public/authenticated navigation; secure storage holds session material. Anonymous discovery and authenticated transactional routes are explicit. Offline reads may be cached, but booking/payment/order mutations are never queued and preserve input for safe retry. Push notifications use FCM with safe deep links and in-app fallback.

## Security and non-functional review

Phone OTP, JWT/rotating refresh tokens, secure storage, server-side RBAC/resource authorization, partner memberships, Stripe boundary, Secrets Manager, HTTPS, rate limiting, redaction, audit logging, and FCM token lifecycle are defined. Performance, scalability, availability, reliability, observability, accessibility, maintainability, and disaster recovery have target architecture paths. Numeric operating targets and runbooks remain Slice 0/9 work, not architecture blockers.

## Consistency result

- The DOCX Flutter recommendation is superseded by the approved React Native direction.
- `OrderPlaced` is canonical; `OrderCreated` is not emitted.
- All approved customer V1 capabilities have module, API, database, UX, and test paths.
- Durable idempotency/outbox/inbox/webhook tables are defined.
- Delivery is V1 with quote/payment/assignment/status and polling tracking.
- Partner organizations/memberships define future resource ownership without creating partner/admin applications.

## Final recommendation

Proceed with Slice 0. Treat architecture tests, API contract tests, SNS/SQS integration tests, OTP security tests, inventory concurrency tests, and the ten booking/payment scenarios as release gates. The project is architecturally ready, but not production-ready until those executable validations and operational configurations pass.
