# 09 Observability

## Objectives

Make authentication, booking/payment integrity, order fulfilment, delivery tracking, and notification delivery diagnosable across API, database, Redis, search, queues, and providers. Use structured logs, metrics, distributed traces, dashboards, and actionable alarms.

## Correlation and tracing

Generate or accept a validated `traceId`/correlation ID at the edge. Propagate it through application handlers, EF/Redis/OpenSearch calls, Stripe/FCM requests where supported, outbox messages, and background handlers. Include event ID and idempotency key hash, never raw secrets or tokens.

Use OpenTelemetry-compatible traces and export to the approved AWS observability stack. Sample ordinary traffic, but retain booking/payment failures, security events, and slow traces at a higher rate.

## Structured logging

Fields: timestamp UTC, level, service/application, module, environment, traceId, correlationId, eventId, route template, status code, duration, subject ID hash or opaque ID, and outcome. Log state transitions and provider result categories. Never log passwords, access/refresh tokens, Stripe secrets, card data, raw webhook bodies, full addresses, or precise location unless specifically approved and redacted.

## Metrics

### API/platform

Request count, latency p50/p95/p99, error rate by route/status, active requests, throttles, readiness failures, CPU/memory/task count, database pool utilization, and dependency latency/error.

### Booking/payment

Availability query latency, reservation attempts, fixed-slot claim conflicts, lock contention/failure, reservation expiry, duplicate commands, booking confirmation rate, payment intent creation, OTP request/verify/rate-limit outcomes, webhook delay, payment success/failure/pending, reconciliation backlog, refund/void outcomes, and late provider events.

### Orders/delivery/notifications

Order placement/payment conversion, inventory reservation conflicts, status transition latency, delivery quote/assignment time, delivery ETA freshness, polling request latency, location update delay, FCM/SMS/email success/failure, notification deduplication, queue age, and DLQ count.

### Data/search/cache

MySQL slow queries/deadlocks, Redis hit ratio/evictions/lock age, OpenSearch query latency/index lag/failures, outbox age, consumer lag/retries.

## Dashboards and alerts

Dashboards: API health, booking/payment, orders/delivery, notification/event processing, infrastructure, and security. Alert on sustained elevated 5xx/latency, readiness loss, database saturation/deadlocks, Redis failure or lock anomalies, OpenSearch lag, payment/webhook reconciliation gaps, growing outbox/DLQ, FCM failure, and suspicious auth/authorization activity. Alerts must name owner, severity, runbook, and customer impact.

## Health endpoints

Liveness checks process health only. Readiness checks required MySQL/Redis/queue configuration and safe dependency reachability. External provider health should not make every API task unready unless that dependency is essential to all traffic.

## Audit and reporting

Audit records are durable domain data for sensitive actions; operational logs are not a substitute. Retain and restrict access according to privacy policy. Provide dashboards for audit search without exposing secrets or unnecessary personal data.

## SLO preparation

Product has not provided numeric SLOs. Before production, approve availability, latency, booking confirmation time, payment reconciliation time, event processing lag, and notification delivery targets, then derive alert thresholds and capacity tests.
