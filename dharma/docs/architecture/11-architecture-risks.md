# 11 Architecture Risks

The Architecture Decision Gate resolved the product and architecture risks that were approval blockers. The risks below remain implementation and operational controls; they must be tracked through Slice 0/9 and the readiness gates.

| Risk | Impact | Mitigation | Approval/owner |
|---|---|---|---|
| Flutter in source DOCX conflicts with required React Native direction | Rework, inconsistent client plan | React Native is approved V1 direction; treat the DOCX Flutter recommendation as superseded | Closed by decision gate |
| Booking lock without database invariant | Double booking under race or Redis failure | Fixed canonical slots, Redis token lock, MySQL conditional claim, durable status/idempotency; fail closed on Redis outage | Implementation test gate |
| Payment client callback treated as success | Unpaid confirmed booking or lost booking | Stripe webhook/server verification, durable payment state, reconciliation and refund/void workflow | Implementation test gate |
| Ten-minute hold semantics unclear at payment timeout | Slot leakage or unexpected late confirmation | Explicit reservation/booking/payment state machine and expiry policy | Product + Payment |
| Provider webhook duplicate/out-of-order delivery | Incorrect payment/booking state | Event ID deduplication, expected-state transitions, reconciliation | Payment owner |
| Search index stale or unavailable | Missing/incorrect discovery | OpenSearch derived only; fallback/detail reads and rebuild process | Platform owner |
| Cross-module table coupling | Modular monolith becomes unmaintainable | Enforce contracts, module-owned mappings, architecture tests | Architecture owner |
| Restaurant/product checkout detail | Blocked order implementation | V1 includes restaurant ordering, one merchant per cart/order, INR snapshots, finite inventory reservation | Implementation contract gate |
| Delivery pricing/dispatch | Cannot implement reliable quote/request flow | V1 includes coverage, quote, payment, assignment, pickup, on-the-way, delivered, cancellation, ETA, and polling | Implementation contract gate |
| Shared carts across merchants ambiguous | Incorrect totals and fulfilment | Start with merchant-scoped carts; approve multi-merchant behavior | Product owner |
| Location and address privacy | Regulatory/reputational harm | Minimize/retain, encrypt, audit, exact retention decision | Security/legal |
| Push/SMS/email provider choice | Notification delays/cost | FCM/in-app required; transactional SMS/email optional for important events; define templates/configuration | Implementation/configuration gate |
| Unknown SLOs and scale targets | Over/under-engineering | Approve SLOs, load profiles, RPO/RTO before production | Technical leadership |
| External provider outages | Transaction failure/customer confusion | Timeouts, circuit breakers, pending states, reconciliation, support tooling | Platform owner |
| Partner/admin workflows deferred | Weak authorization model | Partner organization/membership model and resource ownership are defined; UIs remain future scope | Implementation security gate |
| Reviews/favorites/support implementation churn | Schema/API churn | V1 contracts and ownership are defined; protect them with API/schema tests | Implementation owner |
