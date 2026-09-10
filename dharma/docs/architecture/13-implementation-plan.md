# 13 Implementation Plan

The sequence below is vertical-slice oriented. It assumes the open questions are resolved before each dependent slice. v1 remains one modular monolith.

## Slice 0: Architecture and delivery foundation

- Backend: solution boundaries, shared kernel limits, API versioning, ProblemDetails, DI, cancellation, health endpoints.
- Database: baseline conventions, IDs, audit fields, outbox and concurrency approach; no migrations in this planning phase.
- API: OpenAPI skeleton and error/pagination/idempotency conventions.
- React Native: Expo Router route groups, feature folders, Axios client, TanStack Query, Zustand boundaries, secure storage abstraction, design tokens.
- Tests: architecture dependency tests, API contract checks, mobile navigation/client unit tests.
- Dependencies: technology choice and open-question approvals.
- Definition of done: documented boundaries compile in an implementation branch, contracts reviewed, CI gates specified.

## Slice 1: Identity and customer foundation

- Backend: Identity and Customer modules; registration/login/refresh/logout/profile/addresses; policies and audit.
- Database: users, roles, sessions, profiles, addresses, device tokens.
- API: auth/profile/address contracts and ProblemDetails.
- React Native: onboarding, login/register/recovery placeholders only after UX approval, profile/address flows, auth guards.
- Tests: token rotation/revocation, ownership, validation, rate limits, mobile auth persistence and logout.
- Dependencies: identity verification policy, secure storage.
- Done: customer can authenticate and manage an address safely across app relaunch.

## Slice 2: Pandit discovery

- Backend: Pandit published read model, search query, detail, reviews read path, availability query.
- Database: pandits, services, availability rules/exceptions, review read structures.
- API: paginated/filterable pandit list/detail/availability.
- React Native: Home service entry, pandit listing/detail, loading/empty/error/accessibility states.
- Tests: query filters/pagination, publication/authorization, search indexing/rebuild, component and integration tests.
- Dependencies: location policy, OpenSearch mapping.
- Done: customer can discover a published pandit and see authoritative active services/availability.

## Slice 3: Booking reservation

- Backend: Booking state machine, Redis lock, reservation expiry, idempotency, concurrency controls.
- Database: bookings, reservations, status history, constraints, outbox.
- API: create reservation, booking list/detail, cancellation/reschedule policy endpoints.
- React Native: booking details form, address/service/date/time selection, reservation countdown.
- Tests: concurrent attempts, duplicate requests, Redis failure, expiry, cancellation/reschedule authorization, E2E reservation.
- Dependencies: slot semantics, fee policy.
- Done: one slot cannot be committed twice and every hold has observable expiry behavior.

## Slice 4: Stripe payment and booking confirmation

- Backend: Payment module, intent creation, webhook verification/deduplication, reconciliation, final booking transition.
- Database: payments, attempts, webhook receipts, durable idempotency.
- API: payment intent/status/webhook; pending/failed/success states.
- React Native: provider payment UI integration, payment states, confirmation screen; never client-authoritative.
- Tests: provider success/failure/timeout, duplicate/out-of-order webhook, late success, payment retry, end-to-end confirmed booking.
- Dependencies: Stripe account/payment methods/refund policy.
- Done: only server-verified payment confirms booking; failures release or reconcile holds predictably.

## Slice 5: Booking history and notifications

- Backend: Notification module, booking events, FCM token/preferences/in-app notifications.
- Database: notifications, attempts, preferences, outbox consumers.
- API: booking tabs/details, notifications/read/device registration.
- React Native: Bookings tab, confirmation/detail, notifications, push deep links.
- Tests: event delivery/idempotency/DLQ, notification preference, ownership, mobile deep-link handling.
- Dependencies: channel/template decisions.
- Done: customer can reliably see booking history and receive safe status notifications.

## Slice 6: Pooja Samagri catalog and order

- Backend: PoojaSamagri and Order catalog/cart/order/payment integration.
- Database: shops, categories, products/images, carts/items, orders/items/status history.
- API: catalog, cart, order creation/detail/list/cancel.
- React Native: samagri listing, cart, checkout/order history/detail screens.
- Tests: price snapshot, stock/availability policy, duplicate order, payment failure, order authorization, E2E order.
- Dependencies: merchant/cart/tax/inventory decisions.
- Done: customer can place and view a supported samagri order with immutable line-item facts.

## Slice 7: Restaurant discovery and order

- Backend: Restaurant published catalog/menu and order fulfilment states.
- Database: restaurants, menu categories/items, order merchant/type extensions.
- API: restaurant listing/detail/menu and order paths.
- React Native: restaurant listing/detail/menu/order screens.
- Tests: pure-veg publication, menu availability, merchant isolation, order/payment transitions.
- Dependencies: whether restaurant ordering is v1 and restaurant operational workflow.
- Done: approved restaurant journey works without coupling to samagri catalog ownership.

## Slice 8: Delivery request and tracking

- Backend: Delivery lifecycle, assignment/status/location/ETA contracts, Maps integration boundary.
- Database: requests, assignments, location snapshots, histories, retention.
- API: create/detail/tracking/cancel.
- React Native: request form, map/tracking screen, stale/no-location states.
- Tests: ownership, assignment transitions, location privacy/retention, provider outage, tracking freshness.
- Dependencies: pricing, dispatch, realtime choice, partner workflow.
- Done: customer sees a truthful delivery state and last-update time; no fabricated ETA/location.

## Slice 9: Security, performance, and production readiness

- Backend: rate limits, audit review, reconciliation jobs, load protections, authorization review.
- Database: indexes, backup/restore verification, retention jobs, query plans.
- API: OpenAPI publication, compatibility tests, production error catalogue.
- React Native: offline/network behavior, accessibility audit, crash/error reporting, release hardening.
- Tests: penetration/security, load/concurrency, disaster recovery, E2E critical journeys, UAT.
- Dependencies: SLO/RPO/RTO and operational ownership.
- Done: business sign-off, monitored deployment, rollback/reconciliation runbooks, no unresolved critical risks.

## Safest order rationale

Identity and ownership precede customer data. Published discovery precedes booking. Booking reservation precedes payment confirmation. Events/notifications follow authoritative state transitions. Samagri order establishes the order/payment pattern before restaurant variation. Delivery follows the address and order foundations. Production readiness is last but security and test strategy begin in every slice.
