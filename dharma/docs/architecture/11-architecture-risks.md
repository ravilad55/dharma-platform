# 11 Architecture Risks

| Risk | Impact | Mitigation | Approval/owner |
|---|---|---|---|
| Flutter in source DOCX conflicts with required React Native direction | Rework, inconsistent client plan | Treat task/AGENTS.md direction as implementation constraint; approve final mobile choice | Product/technical leadership |
| Booking lock without database invariant | Double booking under race or Redis failure | Redis token lock plus MySQL unique/optimistic constraints and state checks; fail closed on Redis outage | Booking owner |
| Payment client callback treated as success | Unpaid confirmed booking or lost booking | Provider webhook/server verification, durable payment state, reconciliation job | Payment owner |
| Ten-minute hold semantics unclear at payment timeout | Slot leakage or unexpected late confirmation | Explicit reservation/booking/payment state machine and expiry policy | Product + Payment |
| Provider webhook duplicate/out-of-order delivery | Incorrect payment/booking state | Event ID deduplication, expected-state transitions, reconciliation | Payment owner |
| Search index stale or unavailable | Missing/incorrect discovery | OpenSearch derived only; fallback/detail reads and rebuild process | Platform owner |
| Cross-module table coupling | Modular monolith becomes unmaintainable | Enforce contracts, module-owned mappings, architecture tests | Architecture owner |
| Requirements omit restaurant/product checkout detail | Blocked order implementation | Resolve supporting screens, cart/merchant/tax/inventory rules before slice | Product owner |
| Delivery pricing/dispatch not defined | Cannot implement reliable quote/request flow | Decide coverage, pricing, assignment, cancellation, location policy | Operations owner |
| Shared carts across merchants ambiguous | Incorrect totals and fulfilment | Start with merchant-scoped carts; approve multi-merchant behavior | Product owner |
| Location and address privacy | Regulatory/reputational harm | Minimize/retain, encrypt, audit, exact retention decision | Security/legal |
| Push/SMS/email provider choice unspecified | Notification delays/cost | Define channels, templates, retry and opt-out policy | Product/operations |
| Unknown SLOs and scale targets | Over/under-engineering | Approve SLOs, load profiles, RPO/RTO before production | Technical leadership |
| External provider outages | Transaction failure/customer confusion | Timeouts, circuit breakers, pending states, reconciliation, support tooling | Platform owner |
| Partner/admin workflows deferred | Weak authorization model | Define organization/role/assignment policies now | Product/security |
| Reviews/favorites/support unspecified | Schema/API churn | Keep explicit open questions and defer implementation | Product owner |
