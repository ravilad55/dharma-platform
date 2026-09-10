# 05 API Contract

## Conventions

Base path: `/api/v1`. JSON uses camelCase. All protected requests use `Authorization: Bearer <access-token>`. Mutating commands that can be retried accept `Idempotency-Key`; the server binds the key to authenticated subject, route, normalized request, and a durable result. Responses use DTOs, never EF entities. Errors use RFC 7807 ProblemDetails with stable `code`, `traceId`, and field errors where relevant.

Pagination uses `pageSize` with a server maximum and an opaque `nextCursor` for collections. Money returns `{ amountMinor, currency }`. Timestamps are ISO-8601 UTC; scheduled records also return timezone.

## Identity and customer

| Method | Route | Auth | Request/response summary |
|---|---|---|---|
| POST | `/auth/otp/request` | Public | phone number -> masked delivery/expiry metadata; 202; rate-limit/validation errors |
| POST | `/auth/otp/verify` | Public | phone, OTP, display name on first use -> customer/session DTO; 200/201; invalid/expired/replayed OTP errors |
| POST | `/auth/register` | Public | phone OTP proof, display name, optional email -> customer/session DTO; 201; validation/duplicate errors |
| POST | `/auth/login` | Public | phone OTP proof -> access/refresh session DTO; 200; invalid/locked/rate-limited errors |
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

Phone OTP is the primary registration/login method. OTPs expire after the configured short lifetime, are single-use, have bounded resend/verify attempts, and are rate-limited by phone, device, and IP. Email is an optional associated account field; social login is not a V1 API.

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
| GET | `/home` | Anonymous/customer | location and optional auth context -> service shortcuts, recommendations, upcoming booking summary, unread count; partial section failures are represented per section |
| GET | `/search` | Anonymous/customer | query, location, type filters, cursor -> grouped pandit/product/restaurant results; never booking/inventory authority |
| GET | `/places/autocomplete` | Customer | query/location bias -> place predictions; provider data is validated server-side |
| GET | `/places/{id}` | Customer | -> normalized place/address candidate |

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
| POST | `/checkout` | Customer | cart ID, address ID, payment method reference -> server quote/order/payment state; idempotency required; 201/202 |

Order item prices and names are server snapshots. Client totals are advisory.

## Delivery

| Method | Route | Auth | Request/response summary |
|---|---|---|---|
| POST | `/delivery-requests` | Customer | pickup/drop address or coordinates, package type, optional orderId -> request/quote/status; idempotency required |
| GET | `/delivery-requests/{id}` | Customer/assigned partner/admin | -> request, assignment, ETA, latest location |
| POST | `/delivery-requests/{id}/cancel` | Customer | reason -> updated request; policy/idempotency |
| GET | `/delivery-requests/{id}/tracking` | Customer/assigned partner/admin | -> status timeline/location/ETA; polling or future realtime channel |
| POST | `/delivery-requests/quote` | Customer | pickup/drop/package -> coverage and INR quote; no mutation |

## Payments and webhook

| Method | Route | Auth | Request/response summary |
|---|---|---|---|
| POST | `/payments` | Customer | explicit booking/order owner and server-calculated amount context -> Stripe INR PaymentIntent; idempotency required; 201/202 |
| GET | `/payments/{id}` | Owner/admin | -> payment status and safe provider reference |
| GET | `/payments/{id}/reconciliation` | Owner/admin | -> payment/booking/order reconciliation status and next-safe-action; no secrets |
| POST | `/payments/{id}/refund` | Admin/system policy | reason/amount -> refund status; idempotency required |
| GET | `/payment-methods` | Customer | -> provider-safe saved methods |
| DELETE | `/payment-methods/{id}` | Customer | -> 204; owner/provider policy |
| POST | `/payments/webhooks/stripe` | Stripe signature | raw verified event -> 2xx after durable deduplication; no user JWT |

Webhook processing is idempotent by provider event ID. Provider signature verification precedes parsing/business handling. A payment success response from mobile is never enough to confirm a booking/order.

## V1 customer APIs omitted from the original contract

| Method | Route | Auth | Request/response, validation, status, idempotency/concurrency |
|---|---|---|---|
| GET | `/users/favorites` | Customer | type/cursor -> owned favorites; 200; target must be published |
| POST | `/users/favorites` | Customer | target type/id -> favorite; 201; idempotency recommended; unique conflict is 409 |
| DELETE | `/users/favorites/{id}` | Customer | -> 204; owner check; idempotent |
| GET | `/users/settings` | Customer | -> locale/preferences/privacy settings; 200 |
| PUT | `/users/settings` | Customer | validated settings with row version -> updated settings; 200/412 on stale version |
| POST | `/reviews` | Customer | completed eligible booking/order, rating, text -> moderation-pending review; 201; one-source uniqueness 409 |
| PUT | `/reviews/{id}` | Customer | editable review before/under approved moderation policy; 200/409 |
| DELETE | `/reviews/{id}` | Customer | -> 204; owner/moderation policy |
| GET | `/support/cases` | Customer | cursor/status -> owned cases; 200 |
| POST | `/support/cases` | Customer | category/subject/message -> case; 201; idempotency required |
| POST | `/support/cases/{id}/messages` | Customer | message -> message; 201; owner/status validation |

## V1 state and concurrency contract

All command endpoints return the current resource state or `202` with a durable operation/status reference when processing is asynchronous. `POST` creation returns `201` and `Location` where a resource is created. `204` is used for successful idempotent deletes/reads. Booking, checkout, payment, delivery quote/request, review, support, and favorite writes require `Idempotency-Key` where retries can duplicate effects. `If-Match`/row version is required for profile/settings/cart mutations where concurrent edits can overwrite data; stale writes return `412`. Cursors use stable `(updatedAt, id)` ordering. Offline mobile clients never queue booking, payment, or order mutations; they preserve input and retry online.

## V1 delivery contract

Delivery states are `REQUESTED`, `QUOTED`, `PAYMENT_PENDING`, `ASSIGNED`, `PICKUP`, `ON_THE_WAY`, `DELIVERED`, `CANCELLED`, and `FAILED`. The customer creates a quote, accepts/pays, then creates/activates a request. Active tracking uses polling with `lastUpdatedAt`; the response is shaped so a later WebSocket/SignalR transport can replace polling without changing state semantics. Coverage/quote/payment/cancellation errors use stable ProblemDetails codes.

## Status and errors

Common codes: `validation_error`, `unauthenticated`, `forbidden`, `not_found`, `conflict`, `slot_unavailable`, `reservation_expired`, `payment_pending`, `payment_failed`, `rate_limited`, `dependency_unavailable`, `idempotency_conflict`, and `internal_error`. Return 400/401/403/404/409/422/429/503 as appropriate; include `Retry-After` for rate limits and temporary dependencies.

## API documentation and compatibility

Publish OpenAPI from the API, require contract review for breaking changes, and generate typed client models only after the contract is approved. Include examples for reservation expiry, duplicate webhook, payment pending, validation, and pagination.
