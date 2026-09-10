# 05 API Contract

## Conventions

Base path: `/api/v1`. JSON uses camelCase. All protected requests use `Authorization: Bearer <access-token>`. Mutating commands that can be retried accept `Idempotency-Key`; the server binds the key to authenticated subject, route, normalized request, and a durable result. Responses use DTOs, never EF entities. Errors use RFC 7807 ProblemDetails with stable `code`, `traceId`, and field errors where relevant.

Pagination uses `pageSize` with a server maximum and an opaque `nextCursor` for collections. Money returns `{ amountMinor, currency }`. Timestamps are ISO-8601 UTC; scheduled records also return timezone.

## Identity and customer

| Method | Route | Auth | Request/response summary |
|---|---|---|---|
| POST | `/auth/register` | Public | name, phone/email, password or approved verification data -> customer/session DTO; validation and duplicate identity errors |
| POST | `/auth/login` | Public | credentials -> access/refresh session DTO; invalid/locked/rate-limited errors |
| POST | `/auth/refresh` | Public with refresh token | refresh token -> rotated session; revoked/expired errors |
| POST | `/auth/logout` | Customer | optional current/all session choice -> 204; idempotent |
| GET | `/users/profile` | Customer | -> profile DTO |
| PUT | `/users/profile` | Customer | editable profile fields -> updated profile; validation |
| GET | `/users/addresses` | Customer | paginated addresses -> list |
| POST | `/users/addresses` | Customer | address payload -> address; idempotency recommended |
| PUT | `/users/addresses/{id}` | Customer | editable address -> address; owner check |
| DELETE | `/users/addresses/{id}` | Customer | -> 204; default/used address policy applies |
| POST | `/users/addresses/{id}/default` | Customer | -> address/204; idempotent |
| GET | `/notifications` | Customer | paginated notifications/unread count |
| POST | `/devices` | Customer | FCM token/platform -> registration; idempotent |
| POST | `/notifications/{id}/read` | Customer | -> 204; owner check |

The exact registration verification and payment-method APIs require product/provider decisions.

## Discovery

| Method | Route | Auth | Request/response summary |
|---|---|---|---|
| GET | `/pandits` | Browse policy | query, location, service, language, rating, price, sort, cursor -> paginated summary DTOs |
| GET | `/pandits/{id}` | Browse policy | -> published detail DTO |
| GET | `/pandits/{id}/availability` | Customer | date/range/service -> available slots and timezone |
| GET | `/pandits/{id}/reviews` | Browse policy | cursor -> moderated review DTOs |
| GET | `/products` | Browse policy | query/category/price/availability/cursor -> product DTOs |
| GET | `/products/{id}` | Browse policy | -> product detail |
| GET | `/product-categories` | Browse policy | -> category tree/list |
| GET | `/restaurants` | Browse policy | query/location/rating/pureVeg/ETA/cursor -> restaurant DTOs |
| GET | `/restaurants/{id}` | Browse policy | -> published restaurant detail |
| GET | `/restaurants/{id}/menu` | Browse policy | -> menu categories/items |

All filters are validated and bounded. Search results may be eventually consistent; detail endpoints read MySQL-backed published data when correctness matters.

## Booking

| Method | Route | Auth | Request/response summary |
|---|---|---|---|
| POST | `/bookings/reservations` | Customer | panditId, serviceId, date/time, addressId, notes -> reservation with expiry, totals, payment reference; idempotency required |
| POST | `/bookings/{id}/payment-intent` | Customer | reservation -> payment intent DTO; idempotency required |
| GET | `/bookings/{id}` | Customer/authorized partner/admin | -> booking detail/status/payment summary |
| GET | `/bookings` | Customer | status/cursor -> customer-owned bookings |
| POST | `/bookings/{id}/reschedule` | Customer | new slot/address/notes -> updated reservation/booking; idempotency required |
| POST | `/bookings/{id}/cancel` | Customer | reason -> cancelled booking; idempotency required |

Reservation and payment are distinct so the ten-minute hold is explicit. The final confirmation is produced by the server after Payment verification, not by a client success callback.

## Orders

| Method | Route | Auth | Request/response summary |
|---|---|---|---|
| GET | `/carts` | Customer | active carts by merchant/type |
| POST | `/carts/{id}/items` | Customer | catalog item ID/quantity -> cart; idempotency recommended |
| PUT | `/carts/{id}/items/{itemId}` | Customer | quantity -> cart |
| DELETE | `/carts/{id}/items/{itemId}` | Customer | -> cart/204 |
| POST | `/orders` | Customer | type, merchant, cart, address, payment request -> pending order/payment; idempotency required |
| GET | `/orders` | Customer | type/status/cursor -> own orders |
| GET | `/orders/{id}` | Customer/authorized partner/admin | -> order, items, payment and delivery summary |
| POST | `/orders/{id}/cancel` | Customer | reason -> updated order subject to policy; idempotency |

Order item prices and names are server snapshots. Client totals are advisory.

## Delivery

| Method | Route | Auth | Request/response summary |
|---|---|---|---|
| POST | `/delivery-requests` | Customer | pickup/drop address or coordinates, package type, optional orderId -> request/quote/status; idempotency required |
| GET | `/delivery-requests/{id}` | Customer/assigned partner/admin | -> request, assignment, ETA, latest location |
| POST | `/delivery-requests/{id}/cancel` | Customer | reason -> updated request; policy/idempotency |
| GET | `/delivery-requests/{id}/tracking` | Customer/assigned partner/admin | -> status timeline/location/ETA; polling or future realtime channel |

## Payments and webhook

| Method | Route | Auth | Request/response summary |
|---|---|---|---|
| POST | `/payments` | Customer | owner type/id and amount context -> provider payment intent; server calculates amount; idempotency required |
| GET | `/payments/{id}` | Owner/admin | -> payment status and safe provider reference |
| POST | `/payments/webhooks/stripe` | Stripe signature | raw verified event -> 2xx after durable deduplication; no user JWT |

Webhook processing is idempotent by provider event ID. Provider signature verification precedes parsing/business handling. A payment success response from mobile is never enough to confirm a booking/order.

## Status and errors

Common codes: `validation_error`, `unauthenticated`, `forbidden`, `not_found`, `conflict`, `slot_unavailable`, `reservation_expired`, `payment_pending`, `payment_failed`, `rate_limited`, `dependency_unavailable`, `idempotency_conflict`, and `internal_error`. Return 400/401/403/404/409/422/429/503 as appropriate; include `Retry-After` for rate limits and temporary dependencies.

## API documentation and compatibility

Publish OpenAPI from the API, require contract review for breaking changes, and generate typed client models only after the contract is approved. Include examples for reservation expiry, duplicate webhook, payment pending, validation, and pagination.
