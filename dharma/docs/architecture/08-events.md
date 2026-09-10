# 08 Events and Asynchronous Processing

## Purpose

Events decouple notifications, search indexing, analytics, partner visibility, and integration work from customer-facing transactions while keeping the modular monolith deployable as one application. Events are integration contracts, not direct table-change notifications.

## Transport and delivery

Use AWS SNS topics with SQS queues/subscriptions. The architecture requires durable queues, retry policy, dead-letter queues, consumer idempotency, correlation/causation IDs, ordering keys where needed, and replay procedures. SNS distributes domain events; each consumer owns its subscribed SQS queue and inbox/deduplication records.

Write an outbox row in the same MySQL transaction as the state change. A dispatcher publishes the event, records attempts, and retries transient failures. Consumers record processed event IDs or use an equivalent idempotent effect key.

## Envelope

```json
{
  "eventId": "opaque-id",
  "eventType": "BookingConfirmed",
  "schemaVersion": 1,
  "occurredAtUtc": "2026-08-24T04:30:00Z",
  "producer": "Booking",
  "correlationId": "request-id",
  "causationId": "payment-event-id",
  "subject": { "type": "Booking", "id": "opaque-id" },
  "data": {}
}
```

Do not include credentials, card data, full addresses, or unnecessary personal data. Payloads should carry IDs and safe display fields; consumers fetch authorized details when necessary.

## Required events

- Identity: `UserRegistered`, `UserRoleChanged`, `UserDeactivated`.
- Catalog: `PanditVerified`, `AvailabilityChanged`, `ProductChanged`, `ProductAvailabilityChanged`, `RestaurantChanged`, `MenuItemChanged`.
- Booking: `BookingReserved`, `BookingConfirmed`, `BookingExpired`, `BookingCancelled`, `BookingRescheduled`.
- Payment: `PaymentCreated`, `PaymentSucceeded`, `PaymentFailed`, `PaymentExpired`, `RefundCompleted`.
- Order: `OrderPlaced`, `OrderPaid`, `OrderAccepted`, `OrderReady`, `OrderOutForDelivery`, `OrderDelivered`, `OrderCancelled`.
- Delivery: `DeliveryRequested`, `PartnerAssigned`, `DeliveryStatusChanged`, `DeliveryCompleted`.
- Notification: `NotificationQueued`, `NotificationSent`, `NotificationFailed`.

## Consumers

Notification consumes booking/payment/order/delivery events. Search indexing consumes published pandit/product/restaurant/catalog events. Analytics consumes non-sensitive business events. Future partner projections consume approved booking/order/delivery events. Cache invalidation consumes catalog and availability events.

## Ordering and consistency

Ordering is guaranteed per aggregate ordering key through the SNS/SQS FIFO configuration selected for affected event streams; consumers must still tolerate duplicate and out-of-order delivery. A later status transition validates the current aggregate state. Event handlers must be safe to retry. Customer APIs read current MySQL state rather than assuming event delivery has completed.

## Producer/consumer matrix

| Event | Producer | Consumers | Ordering key | Required idempotency effect |
|---|---|---|---|---|
| `BookingConfirmed` | Booking | Notification, future partner projection, analytics | booking ID | notification deduplication and processed event ID |
| `PaymentSucceeded` | Payment | Booking/Order orchestration, Notification, reconciliation | payment owner ID | one finalization attempt per payment/provider event |
| `OrderPlaced` | Order | Payment, Notification, future merchant projection, analytics | order ID | one payment/order placement effect |
| `PartnerAssigned` | Delivery | Notification, tracking projection | delivery request ID | one assignment notification/projection |
| `DeliveryCompleted` | Delivery | Notification, linked Order, analytics | delivery request ID | one completion transition |
| `BookingExpired` | Booking expiry worker | Payment compensation, Notification, analytics | booking ID | one release/expiry effect |
| `RefundCompleted` | Payment | Booking/Order, Notification, reconciliation | payment ID | one refund terminal transition |

SNS publishes the versioned envelope; each consumer has an SQS subscription and records `(consumer_name, event_id)` in `processed_events`. FIFO ordering is used for aggregate-sensitive streams with the aggregate ID as ordering key. Standard queues may be used for analytics where ordering is not required.

## Failure handling

Retry transient failures with exponential backoff and jitter. Send poison messages to DLQ with alerting. Provide operator replay after correction, with original event IDs preserved. Record processing latency, attempts, DLQ count, and handler outcome. Never silently discard an event. SNS/SQS retention, visibility timeout, retry count, DLQ redrive permissions, and replay are configured per consumer class. Replay requires operator authorization, preserves the original event ID, and cannot bypass aggregate state guards. `OrderPlaced` is the canonical V1 name; aliases are not emitted.
