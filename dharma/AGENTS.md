# DHARMA - CODEX ENGINEERING RULES

## 1. PROJECT

Dharma is a spiritual-services marketplace.

The first application is:

Dharma Customer Mobile App

Future applications:

- Dharma Partner Mobile App
- Dharma Admin Web Portal

The requirements documentation under docs/requirements is the primary product source.

Do not invent product requirements.

If requirements are ambiguous, identify the ambiguity before implementation.

---

# 2. TECHNOLOGY

## Mobile

- React Native
- TypeScript
- Expo
- Expo Router
- TanStack Query
- Zustand
- Axios
- React Hook Form
- Zod

## Backend

- ASP.NET Core 8
- C#
- Clean Architecture
- Modular Monolith
- Entity Framework Core
- MySQL

## Infrastructure

- Redis
- OpenSearch
- Docker
- AWS
- ECS/Fargate
- RDS
- S3
- CloudFront
- CloudWatch
- Secrets Manager

## External Services

- Stripe
- Firebase Cloud Messaging
- Google Maps
- Messaging infrastructure

---

# 3. ARCHITECTURE PRINCIPLES

Use Modular Monolith architecture.

Do NOT create microservices unless explicitly approved.

Modules must have clear boundaries.

Avoid unnecessary coupling between modules.

Controllers must remain thin.

Business logic must not live in controllers.

Do not expose database entities directly through APIs.

Use DTOs.

Use dependency injection.

Use asynchronous programming.

Use cancellation tokens where appropriate.

---

# 4. BACKEND MODULES

The initial backend modules are:

Identity
Customer
Pandit
PoojaSamagri
Restaurant
Delivery
Booking
Order
Payment
Notification

Do not merge unrelated business modules simply for convenience.

Do not create microservices for these modules in v1.

---

# 5. API RULES

All APIs use:

/api/v1/

Use REST conventions.

Use appropriate HTTP status codes.

Use consistent API response/error conventions.

Use ProblemDetails for errors.

Validate all requests.

Authorize protected operations server-side.

Use pagination for potentially large collections.

Never trust client-side authorization.

Never trust client-side payment confirmation.

---

# 6. SECURITY

Never hardcode:

- passwords
- API keys
- JWT secrets
- Stripe secrets
- AWS credentials
- database credentials

Never log:

- passwords
- access tokens
- refresh tokens
- payment secrets

Use secure secret management.

Use HTTPS.

Use authentication and authorization.

Use RBAC.

Sensitive operations require audit logging.

---

# 7. BOOKING

Booking is a business-critical workflow.

The system must protect against double booking.

Redis distributed locking may be used for slot reservation.

Booking/payment operations must be idempotent.

Do not finalize a booking solely because the mobile client reports payment success.

Payment must be verified server-side.

Booking state transitions must be explicit.

---

# 8. REACT NATIVE ARCHITECTURE

Use feature-based architecture.

Do not put business logic directly into screens.

Screens are presentation-focused.

Use:

Screen
  ↓
View/Hook
  ↓
State
  ↓
Repository
  ↓
API Client
  ↓
.NET API

Use TanStack Query for server state.

Use Zustand only for appropriate client/application state.

Do not duplicate server state unnecessarily in Zustand.

---

# 9. UI

Follow the Dharma design system.

Current design tokens from requirements:

Primary:
#7A1F3D

Saffron:
#F59E0B

Warm Cream:
#FFF9F0

Green:
#3F8F4F

Text:
#292524

Border:
#E7DED2

Typography:
Inter

Use Material-inspired/custom reusable components.

Use an 8-point spacing system.

Use 12-16px card radius.

Use restrained shadows.

Use large touch-friendly CTAs.

Use bottom sheets for filters and secondary actions.

---

# 10. EVERY SCREEN

Screens must consider:

- Loading
- Empty
- Error
- Success
- Validation
- Network failure
- Retry
- Accessibility
- Responsive layouts

Do not show raw technical errors to users.

---

# 11. REUSABLE COMPONENTS

Create reusable components for:

Buttons
Inputs
Cards
App bars
Bottom navigation
Bottom sheets
Dialogs
Loaders
Skeletons
Empty states
Error states
Confirmation views
Lists
Avatars
Badges
Ratings

Do not create duplicate components.

Before creating a new component, search the existing codebase.

---

# 12. TESTING

Business-critical backend functionality requires:

- Unit tests
- Integration tests

Important mobile functionality requires:

- Unit tests
- Component/widget tests
- Integration tests

Critical flows must be tested end-to-end.

---

# 13. DEVELOPMENT WORKFLOW

Before implementing any feature:

1. Read requirements.
2. Read relevant architecture documentation.
3. Identify affected modules.
4. Identify API changes.
5. Identify database changes.
6. Identify UI changes.
7. Identify security implications.
8. Identify test requirements.
9. Implement.
10. Run tests.
11. Review code.
12. Update documentation.

Do not silently change architecture.

If an architectural change is required:

STOP and explain the change before implementation.

---

# 14. DEFINITION OF DONE

A feature is not complete until:

- Requirements implemented
- Architecture followed
- API implemented
- Database changes implemented
- Validation implemented
- Authorization implemented
- Error handling implemented
- Loading state implemented
- Empty state implemented
- Error state implemented
- Success state implemented
- Tests implemented
- Tests passing
- Security reviewed
- Performance reviewed
- Accessibility reviewed
- Documentation updated
- No compiler errors
- No analyzer/linter errors