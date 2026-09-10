# 12 Open Questions

The Architecture Decision Gate resolved the prior product and platform questions. No unresolved question blocks V1 implementation. The items below are implementation clarifications to be captured in executable contracts or ADRs during Slice 0, not new product decisions.

## Resolved by the V1 decision gate

- React Native/TypeScript/Expo/Expo Router/TanStack Query/Zustand/Axios/React Hook Form/Zod.
- V1 customer scope includes restaurant ordering, payment methods, Favorites, Settings, Help & Support, Reviews, Home, unified Search, delivery, and tracking.
- Anonymous browsing covers Home, pandits, products, restaurants, and Search; transactional/account capabilities require authentication.
- Phone OTP is primary authentication; email association is allowed; social login is deferred.
- Fixed canonical bookable slots, ten-minute reservation hold, shorter Redis lock TTL, MySQL authority, durable idempotency, and transactional outbox.
- Explicit booking/payment states and reconciliation/refund workflow.
- Stripe PaymentIntent in INR with signed authoritative webhook, deduplication, reconciliation, and refund/void.
- Explicit durable infrastructure: IdempotencyRecords, OutboxMessages, ProcessedEvents/Inbox, PaymentWebhookReceipts.
- One merchant per cart/order, V1 restaurant ordering, finite-inventory concurrency rules.
- One review per completed eligible booking/order with moderation and aggregate calculation.
- AWS SNS + SQS at-least-once events with idempotent consumers and canonical `OrderPlaced`.
- FCM and in-app notifications; optional transactional SMS/email for important events.
- OpenSearch for discovery only; booking/inventory remain authoritative in MySQL/Booking/Order.
- V1 delivery coverage/quote/payment/assignment/pickup/on-the-way/delivered/cancelled/ETA with polling.
- No offline booking/payment/order mutation queue.
- Partner organization/membership ownership model.

## Implementation clarifications

1. Set concrete OTP expiry, resend, verification-attempt, and session-duration configuration values within the approved security policy.
2. Set concrete Redis lock TTL, clock-skew margin, fixed-slot duration/buffer configuration, and reservation expiry scheduler interval.
3. Define OpenSearch mappings, ranking weights, geospatial precision, freshness targets, and rebuild runbooks.
4. Define SNS topic/SQS queue names, FIFO versus standard queue assignment per event stream, retention, visibility timeout, retry count, and DLQ redrive permissions.
5. Define numeric SLOs, RPO/RTO, traffic profiles, capacity thresholds, and alert thresholds before production.
6. Define deployment account/network/WAF configuration and controlled migration execution in the release runbook.
7. Define final localized notification templates and support content after product copy review.

These clarifications cannot change the approved V1 behavior without reopening the Architecture Decision Gate.
