# 07 Redis Strategy

## Responsibilities

Redis/ElastiCache is an optimization and coordination layer, not the source of truth. Use it for cache, short-lived booking reservations/locks, bounded idempotency coordination, rate-limit counters, and optionally ephemeral delivery tracking fan-out.

## Key conventions

Use environment and version prefixes, for example `dharma:{env}:v1:{purpose}:{id}`. Set TTLs on every key. Do not place secrets or raw payment data in values. Values are JSON or a documented compact format with schema version. Include owner/resource IDs and correlation information only when safe.

## Booking lock and reservation

Lock key: `booking:slot:{panditId}:{serviceId}:{slotStartUtc}:{slotEndUtc}`. Acquire with an atomic `SET key token NX PX`, where TTL is bounded around the ten-minute reservation plus clock-skew/grace policy. The value is a cryptographically random ownership token. Release only through an atomic compare-and-delete operation; never delete another holder's lock.

The lock prevents concurrent admission but does not replace database constraints. The reservation record in MySQL carries `expires_at` and status. A customer may renew only through an approved server operation; there is no client-controlled TTL extension. A background expiry process and request-time checks transition abandoned holds. If Redis is unavailable, fail closed for new booking reservations rather than risk double booking.

Payment timeout/failed payment releases the reservation after the server marks the attempt failed or expired. A late provider success is reconciled by Payment and Booking using expected-state rules; it must not create a duplicate booking.

## Cache

Cache only published, read-heavy data: pandit summaries/details, product/category lists, restaurant lists, recommendations, and availability reads where correctness permits. Use short TTLs and explicit invalidation events for profile/catalog changes. Cache keys include all query filters, location bucket, locale, and API version. Never cache customer-private data without subject scoping.

Cache-aside flow: read cache, query source of truth/search, populate with TTL. On stale or unavailable Redis, read through to MySQL/OpenSearch where safe. Do not use cache to decide final price, authorization, payment, or booking availability.

## Idempotency and rate limits

Durable idempotency records belong in MySQL so results survive Redis loss. Redis may provide a short-lived request coalescing key and rate-limit counter. Rate-limit dimensions include IP, authenticated subject, route, and provider webhook source as appropriate. Return 429 with `Retry-After`.

## Invalidation and operations

Publish invalidation after successful commits through the outbox. Treat cache misses and evictions as normal. Monitor memory, evictions, hit ratio, command latency, replication/failover, lock contention, and expired reservations. Alert on lock acquisition failures, unusual hold age, and Redis errors.

## Failure rules

Never make business state dependent solely on Redis. Never extend a lock from an untrusted client. Never use `KEYS` in production; use scoped iteration or explicit keys. Define a single Redis time source policy and account for clock skew. Redis backups are not a replacement for MySQL backups.
