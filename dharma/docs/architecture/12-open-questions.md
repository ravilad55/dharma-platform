# 12 Open Questions

These questions are intentionally unresolved because the requirements do not provide a definitive answer. They must be answered before the affected vertical slice is approved.

## Product and policy

1. Is React Native/Expo the final mobile choice, or should the DOCX Flutter recommendation prevail?
2. What registration method is required: password, phone OTP, email OTP, social login, or a combination?
3. Which browsing screens are public, and where is authentication first required?
4. Can one user hold multiple partner roles or belong to an organization?
5. What are the exact pandit reschedule/cancellation windows, fees, refund rules, and no-show policy?
6. What time zone governs availability and booking display for each pandit/location?
7. What is the exact slot granularity, service duration, buffer, blackout, and recurring availability model?
8. Are convenience fees, taxes, discounts, tips, and rounding rules fixed or configurable?
9. Do restaurant and samagri orders share the same cart/order flow, or are carts merchant-scoped?
10. What are inventory reservation, out-of-stock, substitution, tax, delivery fee, and cancellation rules?
11. Which restaurant detail/menu/checkout screens are required beyond the listed restaurant listing?
12. Is restaurant ordering in v1 or only discovery? Which order states are customer-visible?
13. How are delivery requests priced, covered, assigned, cancelled, and paid?
14. Is live delivery tracking polling, push, WebSocket, or a later phase? What location accuracy/retention is allowed?
15. Which notification channels are required: push, SMS, email, in-app? What preferences and opt-outs apply?
16. Can customers submit reviews? One per booking/order? What moderation, edit, and deletion rules apply?
17. What does Favorites support and which entity types can be favorited?
18. What are Help & Support case creation, SLA, escalation, and contact-channel requirements?
19. Are payment methods merely provider-managed, or must Dharma list/remove methods?
20. Are account deletion, data export, privacy consent, and age/region restrictions required?

## Technical decisions

21. Choose AWS SQS/SNS or RabbitMQ and define ordering/retention/replay semantics.
22. Choose UUID/ULID/public ID policy and booking/order reference format.
23. Approve OpenSearch mapping, location search strategy, indexing freshness, and fallback behavior.
24. Define API pagination limits, rate limits, version compatibility, and client retry policy.
25. Define Stripe integration mode, supported payment methods/currencies, webhook events, refund/reconciliation cadence.
26. Approve Redis failure behavior, lock TTL grace period, clock source, and reservation renewal policy.
27. Define RPO/RTO, SLOs, traffic/scale estimates, and data retention periods.
28. Define deployment account/network model, WAF/API gateway choice, and environment promotion policy.
29. Define observability vendor/export, trace sampling, dashboard owners, and alert thresholds.
30. Confirm whether partner/admin clients have separate API scopes and DTOs from customer APIs.

## Human approval gate

No implementation should silently decide these items. Each answer should be recorded in an ADR or requirements update and reflected in the affected API, state machine, UX contract, and test plan.
