# 02 System Architecture

## Architectural decision

Use a single ASP.NET Core 8 Modular Monolith with Clean Architecture boundaries. Modules execute in one deployable API process and share one MySQL instance, but communicate through explicit application contracts and domain/integration events. Do not introduce v1 microservices.

## Logical topology

```text
Customer App (React Native / Expo)
        |
      HTTPS
        |
   ALB / API edge
        |
ASP.NET Core API - Modular Monolith
  Identity | Customer | Pandit | Booking | Payment
  PoojaSamagri | Restaurant | Order | Delivery | Notification
        |
  MySQL     Redis     OpenSearch     S3
        |
 Stripe | FCM | Google Maps | SNS + SQS
```

ECS/Fargate runs stateless API tasks behind an ALB. RDS MySQL is the transaction system of record. ElastiCache Redis provides short-lived cache, distributed booking locks, and reservation state. OpenSearch is a derived search index, never the source of truth. S3/CloudFront serves approved media. CloudWatch receives logs, metrics, alarms, and traces.

## Clean Architecture layers

- API: routing, authentication middleware, DTO binding, ProblemDetails, versioning. Controllers remain thin.
- Application: commands, queries, validation, authorization policies, transaction orchestration, ports.
- Domain: aggregates, value objects, status transitions, invariants, domain events.
- Infrastructure: EF Core/MySQL, Redis, OpenSearch, Stripe, FCM, Maps, object storage, messaging, clock and ID providers.

Modules own their domain and persistence mappings. Cross-module access uses application ports, read contracts, or events; no module reads another module's tables directly in application code.

## Runtime request patterns

Reads use query handlers with DTO projections, pagination, cache where useful, and OpenSearch for discovery. Writes use command handlers with validation, authorization, idempotency where applicable, and an explicit transaction boundary. External side effects are dispatched through an outbox after the database transaction commits.

## State ownership

- MySQL: authoritative identities, commercial records, statuses, money, and audit references.
- Redis: ephemeral locks, booking hold TTLs, rate-limit counters, cache, and short-lived idempotency coordination. Redis loss must not corrupt the system of record.
- OpenSearch: denormalized, rebuildable search documents.
- Stripe: payment instrument and provider payment state; Dharma stores references and verification state.
- FCM: push delivery transport; Notification owns intent and delivery attempts.

## Cross-module rules

Booking owns booking lifecycle and slot commitment. Payment owns payment intents and provider verification but does not decide business eligibility alone. Order owns order lifecycle. Delivery owns delivery lifecycle. Notification subscribes to business events and must not be called synchronously to complete a booking. Identity owns authentication and role claims; each module remains responsible for resource authorization.

## Consistency model

Booking creation, reservation, and initial payment record use a short MySQL transaction coordinated with a Redis admission lock. The bookable model uses canonical fixed slots; Redis lock TTL is shorter than the ten-minute MySQL reservation hold. Final booking confirmation occurs only after authoritative Stripe webhook/provider verification. Outbox records are committed with business state and delivered asynchronously through SNS + SQS. Search, push, analytics, and partner notifications are eventually consistent.

## Resilience

Use request timeouts, cancellation tokens, bounded retries with jitter for transient external failures, circuit breakers for provider calls, and dead-letter handling for event delivery. Never retry a non-idempotent command without an idempotency key. Booking/payment/order mutations are rejected while offline and are never queued by the mobile client; safe read-only queries may use offline cache. Health endpoints distinguish liveness from readiness and include dependency checks only in readiness.

## Future clients

Partner App and Admin Portal use the same versioned API but separate route policies, DTOs, and use cases where workflows differ. A future extraction may move Booking, Payment, Search, Order, or Delivery, but no current design requires network calls between them.

## Approved booking state machine

`AVAILABLE` is the fixed-slot inventory state; the remaining states are booking lifecycle states. Booking owns business state transitions, Payment owns provider/payment transitions, and the reconciliation worker coordinates recovery under Booking and Payment policies.

| From | Event/condition | To | Owner |
|---|---|---|---|
| AVAILABLE | lock acquired and conditional slot claim succeeds | RESERVED | Booking |
| RESERVED | payment intent created | PAYMENT_PENDING | Booking |
| RESERVED | customer cancellation before payment | CANCELLED | Booking |
| RESERVED | ten-minute hold expires | EXPIRED | Booking expiry worker |
| PAYMENT_PENDING | verified Stripe success and conditional slot still valid | CONFIRMED | Payment invokes Booking port |
| PAYMENT_PENDING | verified provider failure | PAYMENT_FAILED | Payment |
| PAYMENT_PENDING | hold expires before successful verification | EXPIRED | Booking expiry worker |
| PAYMENT_PENDING | customer cancellation allowed by policy | CANCELLED | Booking |
| PAYMENT_PENDING | provider success but booking commit cannot complete | FINALIZATION_FAILED | Booking |
| FINALIZATION_FAILED | durable reconciliation is queued | AWAITING_RECONCILIATION | Booking |
| AWAITING_RECONCILIATION | retry safely commits slot and booking | CONFIRMED | Reconciliation worker/Booking |
| AWAITING_RECONCILIATION | slot cannot be committed or provider outcome requires compensation | REFUND_PENDING | Reconciliation worker/Payment |
| CONFIRMED | approved cancellation requiring compensation | REFUND_PENDING | Booking/Payment orchestration |
| REFUND_PENDING | Stripe void/refund succeeds | REFUNDED | Payment |
| PAYMENT_FAILED | failure is finalized and hold released | EXPIRED | Booking |

Terminal states are `CONFIRMED`, `EXPIRED`, `CANCELLED`, `REFUNDED`, and a payment/booking reconciliation record may remain operationally open until its refund outcome is recorded. Expiry wins over payment success unless one conditional MySQL transaction commits confirmation before the expiry update. Webhooks are authoritative inputs but cannot bypass state guards. Repeated events, expiry, cancellation, finalization, and reconciliation are idempotent no-ops after a terminal transition. Every transition writes status history and, where external work is needed, an outbox message.

## Approved payment state machine

Payment owns `CREATED -> REQUIRES_ACTION -> PROCESSING -> SUCCEEDED` and failure/timeout/refund states. Stripe PaymentIntent status and signed webhook events are authoritative. A mobile callback can initiate refresh only. `SUCCEEDED` does not imply booking confirmation; Booking must accept the conditional finalization. If finalization fails, Payment remains succeeded while the booking enters `AWAITING_RECONCILIATION`; the reconciliation worker retries finalization, then executes an idempotent void/refund and transitions booking/payment to `REFUND_PENDING -> REFUNDED` when commitment is impossible. Payment attempts are uniquely identified by Dharma payment ID plus provider attempt/event IDs.
