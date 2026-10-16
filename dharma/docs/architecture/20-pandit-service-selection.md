# 20 Pandit Service Selection (DHARMA-BOOKING-02)

This slice builds on BOOKING-01 (Pandit discovery). It lets an authenticated CUSTOMER open a Pandit
profile, view the Pandit's **active** services, **select one** service, and have that selection
**retained when continuing** to the next step. **No booking is created**, and there is no date
selection, time slot, or payment in this slice.

## Scope

In scope:

- Mobile flow: Pandits → Pandit Profile → Services → Select Service → Continue.
- Single-service selection with a clear selected state (radio-style, one at a time).
- Selection retained across navigation via client state.

Explicitly out of scope (later slices): date selection, time slots, booking creation, payment.

## Backend

No backend changes are required for this slice. BOOKING-01 already provides everything needed:

- `GET /api/v1/pandits/{id}` returns the profile (image, name, experience, languages, city/state,
  rating, review count, availability) and the Pandit's **active services** (inactive services are
  excluded server-side by `EfPanditQueryService`).
- Each service carries `id`, `name`, `description`, `durationMinutes`, `price`, `currency`.
- All discovery endpoints remain `[Authorize(Roles = "CUSTOMER")]`; customer identity comes from the
  JWT.

## Mobile

- `app/(protected)/pandits/[panditId].tsx` — the profile screen now renders each active service as a
  **selectable card** (accessibilityRole `radio`). Tapping a card selects exactly one service; the
  selected card shows a filled radio and highlighted border. A **Continue** CTA appears only once a
  service is selected and navigates to the selection-confirmation screen.
- `app/(protected)/pandits/service-selected.tsx` — the "continue" destination. It reads the retained
  selection and shows the chosen Pandit + service (name, duration, price). It creates **no booking**
  and offers no date/slot/payment — only a note that date selection and booking arrive in the next
  slice, plus a "Change Service" action that returns to the profile.
- `src/features/pandits/serviceSelectionStore.ts` — a small Zustand store holding the current
  `SelectedService` (panditId, panditName, serviceId, serviceName, price, currency, durationMinutes).
  Per the project rules, Zustand holds only this lightweight client/application selection; the
  authoritative service catalog stays in TanStack Query (`["pandit", id]`). The selection survives
  navigation so it is retained when the customer continues.
- `src/features/pandits/serviceFormat.ts` — shared `formatDurationLabel` used by the profile and
  confirmation screens.

## Acceptance criteria mapping

- Customer can open Pandit profile — profile route from the discovery list (BOOKING-01).
- Profile shows image, name, experience, languages, location, rating — rendered on the profile screen.
- Active services displayed; inactive hidden — server returns active services only.
- Customer can select one service — selectable cards, single selection tracked by the store.
- Selected service retained when continuing — Zustand store persists across navigation to the
  confirmation screen.
- No booking is created — no write APIs are called; no date/slot/payment UI exists.

## Future boundary

The retained `SelectedService` is the handoff point for the next slice, which will add date/slot
selection and then server-verified, idempotent booking creation against the Pandit/PanditService
records. None of that exists yet.
