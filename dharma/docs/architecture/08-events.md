# 08 Events and Asynchronous Processing

## Purpose

Events decouple notifications, search indexing, analytics, partner visibility, and integration work from customer-facing transactions while keeping the modular monolith deployable as one application. Events are integration contracts, not direct table-change notifications.

## Transport and delivery

Use an approved durable transport such as AWS SQS/SNS or the requirements' RabbitMQ alternative. The architecture requires durable queues, retry policy, dead-letter queues, consumer idempotency, correlation/causation IDs, and replay procedures. The final provider choice is an open question.

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
- Order: `OrderCreated`, `OrderPaid`, `OrderAccepted`, `OrderReady`, `OrderOutForDelivery`, `OrderDelivered`, `OrderCancelled`.
- Delivery: `DeliveryRequested`, `PartnerAssigned`, `DeliveryStatusChanged`, `DeliveryCompleted`.
- Notification: `NotificationQueued`, `NotificationSent`, `NotificationFailed`.

## Consumers

Notification consumes booking/payment/order/delivery events. Search indexing consumes published pandit/product/restaurant/catalog events. Analytics consumes non-sensitive business events. Future partner projections consume approved booking/order/delivery events. Cache invalidation consumes catalog and availability events.

## Ordering and consistency

Ordering is guaranteed only where the chosen transport/partitioning contract says so; consumers must tolerate duplicate and out-of-order delivery. A later status transition validates the current aggregate state. Event handlers must be safe to retry. Customer APIs read current MySQL state rather than assuming event delivery has completed.

## Failure handling

Retry transient failures with exponential backoff and jitter. Send poison messages to DLQ with alerting. Provide operator replay after correction, with original event IDs preserved. Record processing latency, attempts, DLQ count, and handler outcome. Never silently discard an event.
