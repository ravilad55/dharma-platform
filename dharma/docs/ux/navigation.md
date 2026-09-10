# Customer Navigation

## Root navigation

Use Expo Router with a public/auth route group and an authenticated route group. The authenticated root uses four bottom tabs matching the requirements:

- Home
- Bookings
- Orders
- Profile

Service discovery and transactional flows are stack routes pushed from Home or a tab. Modal/bottom-sheet routes handle filters, date/time selection, address selection, confirmations, and secondary actions.

## Proposed route map

```text
app/
  (public)/
    onboarding
    login
    register
    recover
  (customer)/
    (tabs)/
      home
      bookings/index
      orders/index
      profile/index
    pandits/index
    pandits/[panditId]
    pandits/[panditId]/reviews
    booking/new
    booking/[bookingId]
    booking/[bookingId]/payment
    booking/[bookingId]/confirmation
    samagri/index
    samagri/[productId]
    cart/[cartId]
    checkout/[orderId]
    restaurants/index
    restaurants/[restaurantId]
    restaurants/[restaurantId]/menu
    delivery/new
    delivery/[deliveryRequestId]
    addresses/index
    addresses/edit
    notifications/index
    favorites/index
    payment-methods/index
    support/index
    settings/index
```

The names above are route recommendations, not new product requirements. Missing flows remain approval-gated.

## Guards and deep links

- Public routes are available without a session.
- Customer routes require a valid access token; expired access tokens use refresh once, then redirect to login while preserving an allowed return path.
- A deep link to a customer-owned resource performs an authorized fetch; it must not infer access from route parameters.
- Payment and booking confirmation deep links require server state checks and show pending/expired/failed states.
- Logout resets navigation state and clears secure credentials and customer-scoped client state.

## Back behavior

Back from a form with unsaved changes prompts according to the form policy. Back from a payment reservation must not silently cancel or imply success. The server remains authoritative for cancellation/expiry. Tab switching preserves list scroll/filter state only for the active session unless product approval says otherwise.

## Navigation data contracts

Pass opaque IDs and small display context only; fetch authoritative detail data on the destination. Do not pass payment secrets, full entities, or mutable totals through navigation params. Query invalidation/refetch is the source of truth after booking/order/payment mutations.

## Accessibility and failure behavior

Every route has a screen title, semantic focus order, accessible tab labels, and an error boundary. Offline or stale screens show last known safe data with a retry action; mutation buttons are disabled while the command is pending and remain idempotent server-side.
