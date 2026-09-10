# 04 Database Design

## General rules

MySQL/RDS is the transactional system of record. Use application-generated UUIDs or another approved opaque identifier consistently; public booking references may be a separate unique human-readable value. Store UTC timestamps and an explicit business timezone on scheduled records. Monetary values use integer minor units plus ISO currency. Every mutable business table has `created_at`, `updated_at`, and, where applicable, `created_by`, `updated_by`, `row_version`, and `deleted_at` for approved soft deletion. Do not expose table entities as API DTOs.

## Identity and customer tables

- `users`: PK `id`; unique normalized phone/email as applicable; status, display name, role-independent account fields.
- `roles`: PK `id`; unique code.
- `user_roles`: composite PK `(user_id, role_id)`; FKs to users/roles; unique naturally enforced.
- `refresh_sessions`: PK `id`; FK user; token hash, expiry, revoked time, device metadata.
- `customer_profiles`: PK/FK user; preferences and defaults.
- `addresses`: PK `id`; FK user; label, recipient, address lines, locality, postal code, latitude/longitude, default flag, active flag.
- `favorites`: PK `id`; FK user; target type/id; unique `(user_id, target_type, target_id)`.
- `device_tokens`: PK `id`; FK user; provider token unique, platform, active, last_seen.

Indexes: user normalized identifiers, addresses `(user_id, active)`, favorites `(user_id, target_type)`, device token unique/provider indexes.

## Pandit tables

- `pandits`: PK id; FK user where applicable; verification/status, name, biography, experience years, languages, location, rating aggregate.
- `pandit_services`: PK id; FK pandit; service name/type, price minor units, duration, active; unique `(pandit_id, service_code)`.
- `pandit_availability_rules`: PK id; FK pandit; weekday/time range, timezone, active.
- `pandit_availability_exceptions`: PK id; FK pandit; date/time range, available flag, reason.
- `reviews`: PK id; FK customer, target pandit or approved target; booking/order reference where required; rating, text, moderation/status; uniqueness policy must be approved.

Indexes: pandit status/location, services `(pandit_id, active)`, availability `(pandit_id, date/time)`, reviews `(target, status, created_at)`.

## Catalog tables

- `pooja_shops`: PK id; partner user/organization FK; status, name, address, location.
- `product_categories`: PK id; optional parent FK; unique normalized name within scope.
- `products`: PK id; shop/category FKs; SKU unique within shop, name, description, price, currency, stock/availability status, active.
- `product_images`: PK id; product FK; S3 key, ordering, active.
- `restaurants`: PK id; partner FK; name, pure-veg verification, status, address/location, rating aggregate, hours.
- `menu_categories`: PK id; restaurant FK; name/order.
- `menu_items`: PK id; restaurant/category FKs; name, description, price, availability, active.

Indexes: product `(category_id, availability, active)`, shop, SKU; restaurant location/status/pure-veg; menu `(restaurant_id, active)`.

## Booking tables

- `bookings`: PK id; unique public reference; customer, pandit, service, address snapshot FK/reference, scheduled start/end UTC, timezone, amount totals, currency, status, reservation expiry, idempotency reference.
- `booking_slot_reservations`: PK id; booking FK; pandit/service/start/end, reservation status, expires_at; unique `(pandit_id, service_id, start_at, end_at)` for committed slots as compatible with approved slot granularity.
- `booking_status_history`: PK id; booking FK; from/to status, actor, reason, created_at.

Keep an immutable address and price snapshot on booking so later edits do not rewrite historical facts. The final uniqueness mechanism must cover database commit races in addition to Redis locking.

## Order tables

- `carts`: PK id; customer FK; order type and merchant FK; active status; unique active cart per customer/type/merchant as product rules require.
- `cart_items`: PK id; cart/product or menu item reference; quantity; unique item within cart.
- `orders`: PK id; public order number unique; customer FK; type, merchant reference, delivery address snapshot, totals/currency, status, idempotency reference.
- `order_items`: PK id; order FK; catalog reference, immutable name/price/tax/quantity snapshot.
- `order_status_history`: PK id; order FK; transition and actor.

Cart behavior across multiple merchants is not defined; the schema supports one active cart per merchant until product approval expands it.

## Payment, delivery, and audit tables

- `payments`: PK id; owner type/id, booking/order FK as applicable, Stripe intent/reference unique, amount/currency, status, last verified time.
- `payment_attempts`: PK id; payment FK; provider attempt, status, failure code safe for logs.
- `provider_webhook_receipts`: PK id; provider/event ID unique; received/processed timestamps and result.
- `delivery_requests`: PK id; customer FK; optional order FK; pickup/drop address snapshots, package type, status, pricing, ETA.
- `delivery_assignments`: PK id; request/partner FK; assigned/accepted/completed times.
- `delivery_locations`: PK id; request FK; latitude/longitude, recorded_at; retention policy required.
- `audit_events`: PK id; actor, action, resource type/id, outcome, correlation ID, metadata with sensitive values excluded.

## Constraints and transactions

1. Registration and role assignment: Identity transaction.
2. Booking reservation: Redis lock acquisition, then short MySQL transaction creating reservation/booking/payment intent record; release lock on failure.
3. Payment webhook: unique provider event insert and payment state transition in one transaction; duplicate event returns already processed.
4. Booking finalization: payment verification plus booking transition in one transaction guarded by expected current state and reservation expiry.
5. Order creation: validate catalog snapshots, reserve/validate inventory according to approved policy, create order/items/payment record in one transaction.
6. Outbox: `outbox_messages` is written in the same transaction as every event-producing state change. A dispatcher publishes and marks delivery; retries are safe.

All status transitions require an allowed from/to matrix. Foreign keys, check constraints where supported, unique keys, and optimistic concurrency must complement application validation.
