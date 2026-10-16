# 21 Pandit Availability (DHARMA-BOOKING-03)

This slice builds on BOOKING-02 (service selection). It lets an authenticated CUSTOMER see **when a
Pandit is available** for a selected service and pick a date and time. It is **read-only viewing**:
there is **no booking creation, payment, slot holding, or cancellation** in this slice.

## Scope

In scope:

- Explicit, slot-based availability model (`BookingSlot`) stored in UTC.
- Customer-facing availability API for a pandit + service + local date.
- Mobile flow: Pandit Profile → Select Service → Select Date → Available Times → Select Time, with
  the selection retained across steps.

Explicitly out of scope (later slices): booking creation, payment, slot holding, cancellation.

## Why slot-based

V1 uses an explicit slot model rather than computed open ranges. Slots make the later booking flow
and concurrency rules (holding, double-booking prevention) far easier to reason about, which is the
standard approach for appointment-style systems.

## Domain

`BookingSlot` (in `Dharma.Pandit.Domain`):

- `id`, `panditId`, `serviceId`, `startAtUtc`, `endAtUtc`, `status`, timestamps.
- `BookingSlotStatus`: `Available (1)`, `Held (2)`, `Booked (3)`, `Blocked (4)`.

All timestamps are stored in **UTC**. A slot references the service it is scheduled for so the slot
length matches the service duration. For BOOKING-03 slots are read-only; `Held`/`Booked` transitions
arrive in a later slice.

## Timezone handling

Timezone bugs are a major source of scheduling defects, so the boundary is explicit:

- **Storage**: every slot time is UTC (`booking_slots.StartAtUtc` / `EndAtUtc`).
- **Query**: the requested local calendar date (in the display timezone) is resolved to a UTC window
  `[localMidnight, nextLocalMidnight)` and slots are filtered by `StartAtUtc` within that window.
- **Display**: slot times are converted back to the display timezone and returned as ISO-8601 with
  offset (e.g. `2030-06-15T09:00:00+05:30`). V1 display timezone is **Asia/Kolkata**. The service
  resolves the zone by IANA id, then the Windows id (`India Standard Time`), then a fixed +05:30
  fallback so availability never fails on an unusual host.

## Database

Table `booking_slots` (migration `AddBookingSlots`):

- Columns: Id, PanditId, ServiceId, StartAtUtc, EndAtUtc, Status (int), CreatedAtUtc, UpdatedAtUtc.
- Indexes: `(PanditId, ServiceId, StartAtUtc)` for the availability lookup, and `(ServiceId, Status)`.
- Foreign keys to `pandits` and `pandit_services` with **`ON DELETE RESTRICT`** so slots cannot be
  orphaned and future bookings referencing a slot stay safe.

Development seeding generates slots for each active service across the next 7 days at fixed IST hours
(09:00, 11:00, 14:00, 16:00, 18:00), each lasting the service's duration, with mixed statuses so the
UI shows `Available` alongside `Held`/`Booked`/`Blocked`. On databases seeded before this slice, the
seeder tops up slots without duplicating existing data.

## API

### `GET /api/v1/pandits/{panditId}/availability`

Requires a CUSTOMER token. Query parameters:

- `date` — local calendar date `yyyy-MM-dd` (required; invalid format → `400`).
- `serviceId` — the service to view availability for (required; missing/empty → `400`).

Response:

```json
{
  "date": "2026-10-05",
  "timezone": "Asia/Kolkata",
  "slots": [
    { "id": "...", "startAt": "2026-10-05T09:00:00+05:30", "endAt": "2026-10-05T11:00:00+05:30", "status": "Available" }
  ]
}
```

Rules:

- Only returns slots for an **active** pandit and an **active** service that belongs to that pandit.
  Otherwise `404` — an inactive/unknown pandit or service is indistinguishable from missing.
- Slots are ordered by start time. The response exposes only `id`, `startAt`, `endAt`, `status`;
  internal/storage fields (panditId, serviceId, `*Utc`) are never serialized.

## Mobile

Flow (each step retains the running selection in a small Zustand store; authoritative data stays in
TanStack Query):

- `pandits/[panditId].tsx` — select a service, then **Continue** → Select Date.
- `pandits/select-date.tsx` — pick one of the next 14 dates; **Continue** → Available Times.
- `pandits/available-times.tsx` — fetches `["availability", panditId, serviceId, date]`; shows slots
  with loading / error / empty states. Only `Available` slots are selectable; `Held`/`Booked`/
  `Blocked` are shown disabled. Selecting a time and **Continue** → confirmation.
- `pandits/time-selected.tsx` — confirmation showing the retained pandit, service, date and time.
  **No booking is created**; a note states booking and payment arrive in the next slice.

Selection store rules: changing the service clears the chosen date and slot; changing the date clears
the chosen slot. This keeps the retained selection internally consistent.

## Future boundary

The retained service + date + slot is the handoff to the next slice, which will add slot **holding**
(with Redis distributed locking to prevent double-booking), server-verified **payment**, idempotent
**booking creation**, and **cancellation**. None of that exists yet; BOOKING-03 is availability
viewing only.
