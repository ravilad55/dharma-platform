# 17 Approved V1 Decisions

This document is the authoritative outcome of the Architecture Decision Gate. It supersedes the unresolved alternatives recorded in the original requirements analysis and [16-architecture-decisions-required.md](16-architecture-decisions-required.md). No production source code, project scaffold, package installation, or migration is created by this decision record.

## Mobile and customer scope

- Customer mobile technology: React Native, TypeScript, Expo, Expo Router, TanStack Query, Zustand, Axios, React Hook Form, and Zod.
- V1 includes Authentication, Home, Pandit discovery/details/booking, Payment, Booking confirmation, Pooja Samagri, Cart, Restaurant discovery/menu/ordering, Delivery request/tracking, My Bookings, My Orders, Profile, Addresses, Payment Methods, Favorites, Notifications, Settings, Help & Support, and Reviews.
- Anonymous users may browse Home, Pandit listings/details, Products, Restaurants, and Search.
- Authentication is required for Booking, Ordering, Payment, Favorites, Reviews, Profile, Address management, and Payment Methods.
- Social login is deferred.

## Authentication and security

- Phone OTP is the primary registration and login method.
- OTPs are single-use, expire after a short configured lifetime, have bounded resend/verification attempts, and are rate-limited by phone, device, and IP.
- Email may be associated with an account but is not the primary login method.
- Access tokens are short-lived JWTs. Refresh tokens rotate, are hashed at rest, are revocable, and are stored only through mobile secure storage.
- Logout revokes the refresh session and clears secure/session/cache state. Refresh-token reuse revokes the session family and requires OTP login.
- Partner ownership uses organizations and memberships. A user may hold multiple partner roles through separate memberships. Admin operations are explicit, least-privilege, and audited.
- Stripe owns card data. Secrets use AWS Secrets Manager; sensitive data is excluded from logs.

## Booking and availability

- Availability uses fixed canonical bookable slots. MySQL is the durable authority.
- Redis provides short-lived admission locking with `SET NX PX`, a random lock ownership token, atomic compare-and-delete release, and a lock TTL shorter than the ten-minute reservation hold.
- The reservation hold is ten minutes. The booking command rechecks fixed-slot availability in a conditional MySQL transaction.
- Durable idempotency is stored in MySQL. The transactional outbox is committed with booking state.
- Simultaneous requests for one slot produce exactly one reservation; the losing request receives `409 slot_unavailable`.
- Stale availability is advisory only. Reservation revalidation is authoritative.

## Booking state machine

Booking state transitions are explicit and owner-controlled:

```text
AVAILABLE --claim slot--> RESERVED
RESERVED --create PaymentIntent--> PAYMENT_PENDING
RESERVED --customer cancellation--> CANCELLED
RESERVED --hold expires--> EXPIRED
PAYMENT_PENDING --verified Stripe success + valid slot--> CONFIRMED
PAYMENT_PENDING --verified failure--> PAYMENT_FAILED
PAYMENT_PENDING --hold expires--> EXPIRED
PAYMENT_PENDING --allowed cancellation--> CANCELLED
PAYMENT_PENDING --provider success but commit fails--> FINALIZATION_FAILED
FINALIZATION_FAILED --reconciliation queued--> AWAITING_RECONCILIATION
AWAITING_RECONCILIATION --safe retry commits--> CONFIRMED
AWAITING_RECONCILIATION --cannot commit--> REFUND_PENDING
CONFIRMED --approved cancellation requiring compensation--> REFUND_PENDING
REFUND_PENDING --void/refund succeeds--> REFUNDED
PAYMENT_FAILED --failure finalized and hold released--> EXPIRED
```

Expiry wins unless a conditional MySQL transaction commits confirmation first. Webhooks cannot bypass state guards. Repeated commands/events are idempotent. Finalization failure never falsely confirms a booking; reconciliation retries safely and then performs an idempotent void/refund when commitment is impossible.

## Payments

- Use Stripe PaymentIntent with INR currency.
- Amounts, taxes, fees, discounts, and currency are calculated/server-snapshotted by Dharma; mobile totals are advisory.
- Stripe signed webhooks are authoritative. Provider event IDs, Dharma payment attempts, refund IDs, and idempotency keys are deduplicated durably.
- Payment success with lost mobile network converges through webhook/status polling. Payment success with failed booking finalization creates `AWAITING_RECONCILIATION`, retries finalization safely, and refunds/voids if the slot cannot be committed.
- Payment methods expose provider-safe references only. Refund/cancellation policy is represented by idempotent Payment/Booking commands.

## Database and integrity

- Add `idempotency_records`, `outbox_messages`, `processed_events`, and `payment_webhook_receipts` as durable infrastructure tables.
- Avoid arbitrary polymorphic foreign keys. Use explicit owner/merchant/partner/review relationships and database/application invariants.
- Bookings/orders store immutable address, price, tax, fee, discount, and INR currency snapshots.
- One merchant per cart/order.
- Finite inventory uses atomic optimistic version/quantity reservation and release semantics; concurrent checkout cannot oversell.
- One review is allowed per completed eligible booking/order, with moderation, editing/deletion policy, and aggregate recalculation/rebuild behavior.

## Events and notifications

- Use AWS SNS topics with SQS subscriptions and at-least-once delivery.
- Consumers are idempotent through `processed_events`; retries use visibility timeouts/backoff and DLQs; replay requires authorization and preserves event IDs.
- Canonical events include `BookingConfirmed`, `PaymentSucceeded`, `OrderPlaced`, `PartnerAssigned`, and `DeliveryCompleted`, with versioned envelopes, correlation/causation IDs, aggregate ordering keys, and redacted payloads.
- FCM push and in-app notifications are required. Transactional SMS/email may be used for important events.
- Notifications define templates, preferences, localization, redaction, deduplication, token registration/invalidation, and safe deep links.

## Search, delivery, and offline

- OpenSearch supports Pandit, Product, and Restaurant discovery by location, rating, price, category/service, and applicable availability. Search never authorizes booking or inventory.
- Delivery V1 includes coverage, quote, payment, assignment, pickup, on-the-way, delivered, cancellation, and ETA. Active tracking uses polling; API DTOs remain compatible with future WebSocket/SignalR transport.
- Safe read-only data may be cached offline. Booking, payment, and order mutations are never queued offline; forms preserve input and retry safely when online.

## API and implementation gate

- All APIs use `/api/v1/`, DTOs, ProblemDetails, server authorization, validation, pagination, explicit status codes, idempotency, and concurrency behavior.
- V1 APIs cover Home aggregation, unified Search, discovery/detail, availability, booking/payment/reconciliation, cart/checkout/orders, delivery/quote/tracking, favorites, settings, payment methods, support, reviews, notifications, OTP auth, addresses, and map/place lookup.
- Partner and Admin applications are future clients; V1 implements their ownership/authorization model but not their UIs.
- Implementation begins at Slice 0 with architecture tests, API contract tests, and booking/payment concurrency tests as mandatory gates.
