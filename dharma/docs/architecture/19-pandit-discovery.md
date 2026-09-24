# 19 Pandit Discovery (DHARMA-BOOKING-01)

This document describes the first Pandit Booking slice. **BOOKING-01 is discovery only.** It lets an
authenticated CUSTOMER browse available pandits from the Home screen and view a pandit's profile and
services. **Booking creation is not implemented in this slice and will be delivered in a later slice.**

## Scope

In scope:

- Pandit and PanditService as a read-only discovery catalog.
- Customer-facing discovery APIs: list, detail, and services.
- Mobile Pandit list and Pandit profile screens, reachable from the Home "Pandits" service card.

Explicitly out of scope (later slices): booking creation, availability calendars, time slots,
payments, reviews submission, notifications, and any Pandit/provider authentication or onboarding.

## Module boundary

Pandit is a **separate provider domain**, not a Customer and not an extension of `CustomerAddress`.

- `Dharma.Pandit.Domain` — `Pandit`, `PanditService` entities. No dependencies on other modules.
- `Dharma.Pandit.Application` — discovery DTOs, the validated `PanditQuery`, and the
  `IPanditQueryService` port. Depends only on the Pandit domain.
- Persistence lives in `Dharma.Infrastructure` (shared `DharmaDbContext`), consistent with the
  Pooja Samagri catalog: `EfPanditQueryService` implements `IPanditQueryService` with server-side
  projection, filtering, and pagination.

Pandit provider identity is deliberately independent so that a future Booking module can reference a
`Pandit` by id without coupling to customer or authentication concerns.

## Domain model and relationship

```
Pandit (1) ────< (many) PanditService
```

`Pandit` fields: `Id`, `DisplayName`, `ImageUrl`, `ShortDescription`, `ExperienceYears`, `City`,
`State`, `Languages`, `Rating`, `ReviewCount`, `IsAvailable`, `IsActive`, `CreatedAtUtc`,
`UpdatedAtUtc`.

`PanditService` fields: `Id`, `PanditId`, `Name`, `Description`, `DurationMinutes`, `Price`,
`Currency`, `IsActive`, `CreatedAtUtc`, `UpdatedAtUtc`.

Rules:

- `Rating` and `ReviewCount` are server-owned and are never accepted from a customer.
- Money uses `decimal(18,2)`; V1 currency is INR.
- `Languages` is persisted as a single delimited column (no extra join table for V1).

## Database

Tables (migration `AddPanditDiscovery`):

- `pandits`
- `pandit_services`

Foreign key: `pandit_services.PanditId → pandits.Id` with **`ON DELETE RESTRICT`**. Restrict is used
deliberately so a pandit that a future Booking entity references cannot be deleted in a way that
orphans historical booking/service information.

Indexes (kept minimal):

- `pandits (IsActive, City, IsAvailable)` — location/availability browse.
- `pandits (IsActive, State)` — state filtering.
- `pandit_services (PanditId, IsActive)` — active-service lookups per pandit.

## Customer discovery rules

- Discovery is **customer-facing and requires a CUSTOMER JWT**, consistent with the other protected
  surfaces (cart, orders, addresses). Customer identity always comes from the token; no `customerId`
  is accepted in query parameters.
- Only **active** pandits are returned. An inactive pandit is indistinguishable from one that does
  not exist (404), so inactive/internal records are never disclosed.
- Only **active** services are returned and are the only services matched by the service filter.
- Responses expose discovery-safe fields only. Internal identifiers, provider/auth data, audit
  fields, and timestamps are not serialized.

## API contract

All routes are under `/api/v1` and require a CUSTOMER token.

### `GET /api/v1/pandits`

Query parameters: `search`, `city`, `service`, `page` (default 1), `pageSize` (default 20, max 100).

- Bounded pagination; `page < 1`, `pageSize < 1`, or `pageSize > 100` returns `400` ProblemDetails.
- Stable ordering: rating desc, then display name, then id.
- `search` matches pandit display name and active service names (simple database `LIKE`, no fuzzy/AI
  search). `city` is an exact match; `service` matches active service names.
- Returns a paged envelope `{ items, page, pageSize, totalCount }`. Each item includes a primary
  service name and starting price derived from the pandit's active services.

### `GET /api/v1/pandits/{id}`

Returns the pandit profile with its **active** services. Unknown or inactive pandit returns `404`.

### `GET /api/v1/pandits/{id}/services`

Returns the pandit's active services. Unknown or inactive pandit returns `404`.

## Mobile

- Route `(protected)/pandits` — list screen: search bar, filter chips (All, Puja, Havan, Griha
  Pravesh, Wedding, Other) mapped to the API `service` parameter, infinite scroll, and loading /
  error / empty (with Clear Filters) states. Each card shows image, name, experience, location,
  languages, rating, availability, primary service, and starting price, with a **View Profile** CTA.
  There is intentionally **no Book Now** action.
- Route `(protected)/pandits/[panditId]` — profile screen: hero image, name, rating, review count,
  experience, location, languages, description, and service cards. A footer states "Booking will be
  available in the next slice." No booking action is present.
- The Home "Pandits" service card navigates to `(protected)/pandits`. Bottom navigation is unchanged;
  Pandits remains a Home service and is not a bottom tab. The Bookings tab remains a placeholder for a
  later slice (BOOKING-06).
- Server state uses TanStack Query (`["pandits", filters]`, `["pandit", panditId]`) via the existing
  Axios client and auth interceptor. No pandit server data is stored in Zustand.

## Future booking boundary

This slice ends at discovery. A subsequent slice will introduce a Booking module that references
`Pandit`/`PanditService` (for example, snapshotting service name, duration, and price at booking
time) and will add availability, slot reservation with Redis distributed locking, idempotent
server-verified payment, and booking state transitions. None of that behavior exists yet, and the
restrict-on-delete relationship above is the seam that keeps future booking history safe.
