# 04 Database Design

## General rules

MySQL/RDS is the transactional system of record. Use application-generated UUIDs or another approved opaque identifier consistently; public booking references may be a separate unique human-readable value. Store UTC timestamps and an explicit business timezone on scheduled records. Monetary values use integer minor units plus ISO currency. Every mutable business table has `created_at`, `updated_at`, and, where applicable, `created_by`, `updated_by`, `row_version`, and `deleted_at` for approved soft deletion. Do not expose table entities as API DTOs.

## Identity and customer tables

- `users`: PK `id`; unique normalized phone number; nullable unique normalized email; status, display name, role-independent account fields.
- `roles`: PK `id`; unique code.
- `user_roles`: composite PK `(user_id, role_id)`; FKs to users/roles; unique naturally enforced.
- `refresh_sessions`: PK `id`; FK user; token hash, expiry, revoked time, device metadata.
- `customer_profiles`: PK/FK user; preferences and defaults.
- `addresses`: PK `id`; FK user; label, recipient, address lines, locality, postal code, latitude/longitude, default flag, active flag.
- `favorites`: PK `id`; FK user; target type/id; unique `(user_id, target_type, target_id)`.
- `device_tokens`: PK `id`; FK user; provider token unique, platform, active, last_seen.
- `partner_organizations`: PK `id`; legal/display name, type, approval/status.
- `partner_memberships`: PK `id`; FKs user and organization; partner role, status, unique `(user_id, organization_id, role)`.
- `customer_settings`: PK/FK user; locale, notification preferences, privacy settings.
- `support_cases`: PK `id`; customer FK, status, category, subject, timestamps.
- `support_messages`: PK `id`; case FK, author FK, body, visibility, timestamps.
- `idempotency_records`: PK `id`; subject, route, key, request hash, state, response reference/status, expiry; unique `(subject_id, route, idempotency_key)`.
- `outbox_messages`: PK `id`; event type/version, aggregate, payload, correlation/causation IDs, publish state, attempts, next attempt, published time.
- `processed_events`: PK `id`; consumer name, event ID, processed state/time; unique `(consumer_name, event_id)`.

Indexes: user normalized identifiers, addresses `(user_id, active, created_at)`, favorites `(user_id, target_type, target_id)`, device token unique/provider indexes, partner membership `(organization_id, role, status)`, idempotency lookup, outbox `(status, next_attempt_at)`, processed events unique key.

## Pandit tables

- `pandits`: PK id; FK user where applicable; verification/status, name, biography, experience years, languages, location, rating aggregate.
- `pandit_services`: PK id; FK pandit; service name/type, price minor units, duration, active; unique `(pandit_id, service_code)`.
- `fixed_bookable_slots`: PK id; FK pandit/service; canonical slot key, start/end UTC, timezone, status, active; unique canonical slot key.
- `pandit_availability_rules`: PK id; FK pandit; weekday/time range, timezone, active.
- `pandit_availability_exceptions`: PK id; FK pandit; date/time range, available flag, reason.
- `reviews`: PK id; FK customer; explicit nullable FK to completed booking or order; explicit target FK by review subtype; rating, text, moderation/status, edited/deleted timestamps; unique eligible source `(customer_id, booking_id)` or `(customer_id, order_id)`.

Indexes: pandit `(status, latitude, longitude)`, services `(pandit_id, active, service_code)`, fixed slots `(pandit_id, start_at, status)`, availability rules `(pandit_id, weekday, active)`, reviews `(target_id, status, created_at)` and eligibility uniques.

## Catalog tables

- `pooja_shops`: PK id; partner user/organization FK; status, name, address, location.
- `product_categories`: PK id; optional parent FK; unique normalized name within scope.
- `products`: PK id; shop/category FKs; SKU unique within shop, name, description, price, currency `INR`, stock/availability status, active.
- `inventory_items`: PK id; explicit product or menu-item FK subtype, available quantity, reserved quantity, version; one row per finite-inventory item.
- `inventory_reservations`: PK id; explicit order FK and inventory item FK, quantity, status, expires_at; unique active reservation per order/item.
- `product_images`: PK id; product FK; S3 key, ordering, active.
- `restaurants`: PK id; partner FK; name, pure-veg verification, status, address/location, rating aggregate, hours.
- `menu_categories`: PK id; restaurant FK; name/order.
- `menu_items`: PK id; restaurant/category FKs; name, description, price `INR`, availability, active; optional inventory item FK for finite stock.

Indexes: product `(category_id, availability, active)`, shop, SKU; restaurant location/status/pure-veg; menu `(restaurant_id, active)`.

## Booking tables

- `bookings`: PK id; unique public reference; customer/pandit/service/slot FKs; explicit address snapshot columns; scheduled start/end UTC, timezone, amount/tax/fee/discount snapshots, currency `INR`, status, reservation expiry, idempotency FK.
- `booking_slot_reservations`: PK id; booking FK; fixed slot FK, reservation status, expires_at; unique `(slot_id)` for active reservation/commitment using a status-aware transaction.
- `booking_status_history`: PK id; booking FK; from/to status, actor, reason, created_at.
- `booking_reconciliations`: PK id; booking/payment FKs; state, attempt count, next attempt, provider status, outcome, operator reference.

Keep immutable address, service/price/tax/fee/discount/currency snapshots on booking so later edits do not rewrite historical facts. A fixed slot has one durable commitment; the conditional transaction checks slot status and reservation expiry. Redis lock TTL is shorter than the ten-minute reservation hold.

## Order tables

- `carts`: PK id; customer FK; explicit merchant subtype FK, order type, active status; unique active cart per customer/merchant/type.
- `cart_items`: PK id; cart/product or menu item reference; quantity; unique item within cart.
- `orders`: PK id; public order number unique; customer FK; explicit merchant subtype FK, type, immutable delivery address snapshot, price/tax/fee/discount/currency `INR` snapshots, status, idempotency FK.
- `order_items`: PK id; order FK; catalog reference, immutable name/price/tax/quantity snapshot.
- `order_status_history`: PK id; order FK; transition and actor.

Cart behavior across multiple merchants is not defined; the schema supports one active cart per merchant until product approval expands it.

## Payment, delivery, and audit tables

- `payments`: PK id; explicit nullable booking FK or order FK with a database/application invariant that exactly one owner exists, Stripe PaymentIntent/reference unique, amount/currency `INR`, status, last verified time.
- `payment_attempts`: PK id; payment FK; provider attempt, status, failure code safe for logs.
- `payment_webhook_receipts`: PK id; provider/event ID unique; signature verification result, received/processed timestamps and result.
- `refunds`: PK id; payment FK; provider refund ID unique, amount, status, reason, timestamps.
- `delivery_requests`: PK id; customer FK, optional explicit order FK; pickup/drop address snapshots, coverage/quote/payment status, package type, status, pricing, ETA.
- `delivery_assignments`: PK id; request FK, partner organization/member FK; assigned/accepted/completed times.
- `delivery_locations`: PK id; request FK; latitude/longitude, recorded_at; retention policy required.
- `audit_events`: PK id; actor, action, resource type/id, outcome, correlation ID, metadata with sensitive values excluded.

## Constraints and transactions

1. Registration and role assignment: Identity transaction.
1. Booking reservation: acquire canonical Redis lock with owner token, then one MySQL transaction conditionally claims the fixed slot, creates reservation/booking/payment attempt, idempotency result, and outbox; release lock on failure.
2. Payment webhook: unique provider event insert and payment state transition in one transaction; duplicate event is a no-op.
3. Booking finalization: provider verification plus conditional booking transition in one transaction. If the slot cannot be committed, set `AWAITING_RECONCILIATION` and create an idempotent refund/void workflow.
4. Order checkout: validate catalog snapshots, atomically reserve finite inventory with optimistic version/quantity checks, create cart/order/items/payment/idempotency/outbox records in one transaction.
5. Outbox: `outbox_messages` is written in the same transaction as every event-producing state change. SNS publishes to SQS subscriptions; consumers record `processed_events` and retry through DLQs.

All status transitions require an allowed from/to matrix. Foreign keys, check constraints where supported, unique keys, and optimistic concurrency must complement application validation.
