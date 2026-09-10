# 01 Requirements Analysis

## Source and scope

Primary source: `docs/requirements/Dharma_Mobile_UI_UX_Wireframe_and_Technology_Architecture.docx`, supplemented by `AGENTS.md` and the approved project technology direction. The DOCX is a product and high-level architecture concept. This document turns it into implementation constraints without adding product behavior.

The first release is the Dharma Customer Mobile App backed by one ASP.NET Core 8 modular monolith. Partner mobile and Admin Web are future clients of the same bounded backend modules.

## Product scope

Dharma connects customers with:

- Pandits for spiritual-service discovery and bookings.
- Pooja Samagri shops for product browsing and orders.
- Pure-veg restaurants for restaurant discovery and food orders.
- Delivery Partners for ad hoc delivery requests and tracking.

The customer app information architecture contains Home, Bookings, Orders, and Profile. Home provides entry points to Pandits, Pooja Samagri, Pure Veg Restaurants, and Delivery.

## Roles

| Role | Current interface | Responsibility |
|---|---|---|
| Customer | Customer mobile app | Discover, book, buy, order, request delivery, track, manage profile |
| Pandit | Future Partner app | Profile, services, availability, bookings |
| Pooja Shop | Future Partner app | Products and orders |
| Restaurant | Future Partner app | Menu, orders, fulfilment |
| Delivery Partner | Future Partner app | Accept and fulfil delivery requests |
| Admin | Future Admin Web Portal | Users, partners, services, orders, bookings, payments, complaints, reports, configuration |

A partner organization/operator model is needed for future roles, but the requirements do not define whether a person can hold multiple partner roles. Record this as an open question.

## Customer capabilities

1. Onboard, register, log in, refresh a session, log out, and manage profile.
2. Select or manage addresses and a location context.
3. Search and browse pandits, samagri products, restaurants, and relevant recommendations.
4. View pandit verification, experience, languages, services, ratings, reviews, and starting price.
5. Check pandit availability and create, pay for, view, reschedule, or cancel a booking.
6. Browse product categories, adjust cart quantities, create an order, and view order history/details.
7. Browse nearby pure-veg restaurants and their menu/order workflow.
8. Create an ad hoc delivery request with pickup, drop, and package details; view live status and ETA.
9. Receive booking, order, payment, and delivery notifications.
10. Manage payment methods, favorites, notifications, settings, help/support, and logout.

## Functional workflows

### Booking
Customer selects service, pandit, date, and time. The API validates the slot and acquires a Redis lock for a ten-minute hold. The server creates a payment intent. The customer completes provider payment. Server-side confirmation and/or webhook verification authorizes final booking confirmation. Expiry releases the hold. Events drive notifications and partner visibility.

### Payment
The mobile client may collect/complete payment-provider UI, but it is never authoritative. Dharma stores provider references and payment status, not card secrets. The payment module verifies provider state and processes duplicate webhook deliveries idempotently.

### Ordering
The customer browses products or restaurant content, manages a cart, submits an order, and pays through the payment flow. The Order module owns order state and immutable order-item price snapshots. Fulfilment is partner-facing future scope; customer APIs must expose pending/accepted/preparing/ready/out-for-delivery/delivered/cancelled only when those states are supported by the product decision.

### Delivery
Customer supplies pickup, drop, and package information. Delivery creates a request, locates/assigns a partner in a future partner workflow, and exposes status, partner identity, map position, and ETA where available. The exact dispatch and pricing policy is not defined.

## Non-functional requirements

- Performance: low-latency home/search reads; cache read-heavy data.
- Scalability: clear module boundaries; future extraction remains possible, but v1 is not microservices.
- Availability: managed AWS services, load balancing, health checks, monitoring.
- Reliability: idempotent booking/payment operations and asynchronous events.
- Security: HTTPS, JWT access/refresh, RBAC, protected secrets, audit logging, rate limiting.
- Observability: structured logs, metrics, tracing, dashboards, alerts.
- Accessibility: readable typography, contrast, semantic controls, accessible touch targets.
- Maintainability: Clean Architecture, feature-based mobile structure, automated tests, OpenAPI.

## Technology alignment

The DOCX recommends Flutter, Riverpod, GoRouter, and Dio. The approved project direction is React Native, TypeScript, Expo, Expo Router, TanStack Query, Zustand, Axios, React Hook Form, and Zod. The latter is used in this architecture; no user-facing product requirement is changed. This decision requires human approval if the DOCX recommendation is still authoritative.

## Product boundaries and deferred scope

The customer app is first. Partner and Admin interfaces are future consumers, but their required capabilities determine ownership and authorization boundaries now. Partner operational workflows, admin workflows, restaurant menu detail, product detail, cart checkout detail, review submission, favorites behavior, support case lifecycle, payment-method management, SMS/email provider choice, and delivery pricing are not sufficiently specified and are open questions.

## Acceptance baseline

The architecture is implementation-ready when all APIs and states in this set are approved, unresolved product choices are answered, and each vertical slice has a testable definition of done. No source implementation is included in this phase.
