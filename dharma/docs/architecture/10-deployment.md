# 10 Deployment Architecture

## AWS topology

Use separate environments/accounts or equivalent isolation for development, staging, and production. Route HTTPS through the approved edge/API gateway and ALB to ECS/Fargate API tasks. Use private subnets for ECS, RDS, Redis, and OpenSearch; public access is limited to edge/load-balancer entry points and controlled administration.

```text
CloudFront/S3 for approved static/media assets
             |
       ALB / API edge
             |
      ECS/Fargate API tasks
       |       |       |
     RDS   ElastiCache  OpenSearch
       |
    Outbox -> SQS/SNS or approved queue -> workers/handlers

External: Stripe, FCM, Google Maps
Observability: CloudWatch/OpenTelemetry
Secrets: AWS Secrets Manager + IAM task roles
```

The API and background dispatcher may run in separate ECS task definitions while remaining one modular-monolith codebase/deployment boundary. Scaling them separately is an operational decision, not a microservice split.

## Data and storage

RDS MySQL uses Multi-AZ/automated backups according to the approved availability target. Redis uses managed replication/failover. OpenSearch is rebuildable from MySQL and event replay. S3 uses private buckets, encryption, lifecycle rules, and CloudFront origin access. Do not put sensitive user data in public object keys or URLs.

## Configuration and secrets

Environment configuration is injected at runtime. Secrets Manager stores database, JWT signing, Stripe, FCM, Maps, AWS, queue, and search secrets. ECS task roles use least privilege. No secrets in source, images, logs, mobile bundles, or committed configuration.

## CI/CD gates

Pipeline stages: formatting/static analysis, unit tests, integration tests with ephemeral dependencies, API contract validation, mobile type/test checks, security/dependency/container scans, image build/sign, migration review (when implementation begins), deploy to staging, smoke/E2E tests, approval, production progressive rollout, and post-deploy health verification.

This planning phase does not create migrations or pipelines. The sequence and gates are the approved target.

## Releases and rollback

Use immutable versioned containers and backward-compatible API/database changes. Deploy expand/contract database changes; never require a destructive schema change in the same release as the only compatible application. Roll back application versions using health signals, but handle already-processed events and payment webhooks through compatible consumers. Keep a provider reconciliation procedure.

## Capacity and reliability

Load test home/search, booking contention, payment webhook bursts, order creation, and delivery tracking updates. Define task autoscaling from CPU/memory plus request latency/queue age. Use timeouts, bounded retries, circuit breakers, connection pool limits, and graceful shutdown with cancellation tokens.

## Disaster recovery

Approve RPO/RTO. Test RDS restore, point-in-time recovery, Redis failover behavior, OpenSearch rebuild, queue/DLQ replay, and secrets rotation. Customer-visible transactions must recover from provider reconciliation rather than relying on in-memory state.
