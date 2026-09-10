# Customer Screen Inventory

The requirements explicitly document 13 customer screens. The shared state contract below applies to every screen: loading uses skeletons or a blocking progress state only for an action in flight; empty states explain the next useful action; errors use user-safe ProblemDetails mapping with retry; success confirms the completed action; network failure preserves entered input where safe. All screens require accessible labels, touch targets, contrast, and responsive layouts.

## 1. Splash / Onboarding

- Purpose: Introduce Dharma's four services and route to registration/login.
- Entry: App launch, no completed onboarding.
- Exit/navigation: Get Started -> registration; Login -> login; completion -> Home.
- API/data: Local onboarding-completion flag only; no API required.
- Actions/validation: Advance slides, get started, login; no form validation.
- States: Local loading while bootstrapping; empty not applicable; error offers retry/restart.
- Auth: Public. Authorization: none.

## 2. Home

- Purpose: Personalized discovery hub with location, search, services, upcoming booking, recommendations.
- Entry: Authenticated launch or Home tab.
- Exit/navigation: Service cards -> listings/forms; search -> search results; booking/order cards -> detail; notification -> notifications; bottom tabs.
- API/data: profile summary, selected address/location, recommendations, upcoming booking, unread count.
- Actions/validation: Select location/address; search requires non-empty query when submitted; service shortcuts.
- States: Skeleton sections; empty recommendations/upcoming booking; retry per section or whole page; success is navigation/action feedback.
- Auth: Authenticated for personalized data; public access policy requires approval. Authorization: customer owns returned data.

## 3. Pandit Listing

- Purpose: Compare pandits by service, rating, experience, language, price, and location.
- Entry: Home Pandits, search, back from details.
- Exit/navigation: Pandit card -> details; filter/sort bottom sheet; back/home.
- API/data: paginated `/pandits`, filters, location, search query, facets.
- Actions/validation: Search/filter/sort; date/location filters validated by API schema.
- States: Skeleton list; no results with clear filter/reset action; retry; pagination loading.
- Auth: Public or authenticated browsing requires approval. Authorization: customer-readable published records.

## 4. Pandit Details

- Purpose: Establish trust and expose services before booking.
- Entry: Pandit listing, deep link.
- Exit/navigation: Book Now -> booking details; Reviews -> reviews; back.
- API/data: pandit profile, verification, services, rating, reviews summary.
- Actions/validation: Select service; only active/eligible services may proceed.
- States: Skeleton; unavailable/unpublished pandit state; retry; success is booking navigation.
- Auth: Public or authenticated per policy. Authorization: published data only.

## 5. Booking Details

- Purpose: Collect pooja, date, time, address, notes and show total.
- Entry: Pandit details Book Now.
- Exit/navigation: Continue to Pay -> reservation/payment; back/cancel.
- API/data: pandit services, availability, addresses, fee calculation.
- Actions/validation: Required service/date/time/address; optional notes; date/time must be future and available; server recalculates totals.
- States: Form loading; no addresses/slots with add/select action; inline validation; submission error preserves values; success creates reservation.
- Auth: Required. Authorization: customer may create own booking.

## 6. Payment / Slot Reservation

- Purpose: Show ten-minute slot hold and collect payment.
- Entry: Successful reservation from booking details.
- Exit/navigation: Pay -> provider UI/result; expiry/failure -> retry or booking restart; back policy requires approval.
- API/data: reservation expiry, booking draft, payment intent, totals.
- Actions/validation: Pay only before expiry; payment-provider validation; no client final confirmation.
- States: Countdown; payment unavailable/expired; retry safe with idempotency; success waits for server-confirmed status.
- Auth: Required. Authorization: reservation owner.

## 7. Booking Confirmation

- Purpose: Confirm server-authoritative booking and show reference.
- Entry: verified payment plus confirmed booking; booking deep link.
- Exit/navigation: View Booking -> booking detail; Bookings tab/home.
- API/data: confirmed booking, reference, schedule, address, payment summary.
- Actions/validation: View booking; no mutation.
- States: Loading while polling/retrieving confirmation; missing/pending state explains server verification; error retry.
- Auth: Required. Authorization: booking owner or permitted admin/partner.

## 8. Pooja Samagri

- Purpose: Browse categories/products and maintain a sticky cart.
- Entry: Home Samagri, Orders/cart.
- Exit/navigation: product detail if approved; cart -> checkout/order; back.
- API/data: categories, paginated products, availability, cart.
- Actions/validation: Search/filter; quantity min/max and availability; cart mutations idempotent or serialized.
- States: Skeleton; no products; retry; cart update success/error.
- Auth: Browse policy open; cart/order requires auth. Authorization: customer owns cart.

## 9. Pure Veg Restaurants

- Purpose: Discover nearby verified pure-veg restaurants by rating, ETA, price, offers.
- Entry: Home Pure Veg, search.
- Exit/navigation: restaurant detail/menu (required to order but not explicitly wireframed); back.
- API/data: location, restaurant list, filters/facets.
- Actions/validation: Search/filter; location required for nearby results.
- States: Skeleton; no restaurants; retry/pagination.
- Auth: Browse policy open or auth approval. Authorization: published restaurant records.

## 10. Delivery Partner Request

- Purpose: Create a simple delivery request with pickup, drop, package.
- Entry: Home Delivery.
- Exit/navigation: Find Partner -> request/tracking; back.
- API/data: addresses/map places, package options, quote/availability if supported.
- Actions/validation: pickup/drop required and distinct; package required; map coordinates validated server-side.
- States: Map/address loading; no service coverage; validation and request failure; success shows request/tracking.
- Auth: Required. Authorization: customer creates own request.

## 11. Live Delivery Tracking

- Purpose: Show map, partner identity, lifecycle, and ETA.
- Entry: delivery request, order detail, notification.
- Exit/navigation: back/orders; support action only if approved.
- API/data: delivery status, assignment, partner summary, location/ETA.
- Actions/validation: refresh/poll/subscription; no editable tracking data.
- States: map/loading; unassigned or no location; stale/error with last update and retry; delivered success.
- Auth: Required. Authorization: request/order owner, assigned partner, admin.

## 12. My Bookings

- Purpose: Upcoming, completed, cancelled booking history.
- Entry: bottom Bookings, profile, confirmation.
- Exit/navigation: booking detail; reschedule flow; tabs; back.
- API/data: paginated customer bookings grouped by status.
- Actions/validation: reschedule/cancel subject to server policy; filters/tabs.
- States: skeleton; per-tab empty; retry/pagination; mutation confirmation.
- Auth: Required. Authorization: customer-owned bookings.

## 13. Profile

- Purpose: Account management and links to addresses, payment methods, bookings, orders, notifications, favorites, help, settings.
- Entry: bottom Profile.
- Exit/navigation: child management screens; logout -> public onboarding/login.
- API/data: current profile, unread notification count, summary.
- Actions/validation: logout confirmation; child-specific validation.
- States: profile skeleton; missing optional data; retry; logout success clears session.
- Auth: Required. Authorization: own profile only.

## Supporting screens named by the information architecture

The requirements name these additional customer screens without full wireframes. They still receive an implementation contract here; product-specific policies remain approval-gated.

### Login and Registration

- Purpose: Create/authenticate a customer session.
- Entry: Onboarding Login/Get Started, expired session, protected-route redirect.
- Exit/navigation: Successful auth -> Home; recovery -> recovery flow; back -> onboarding.
- API/data: Identity endpoints, session state, safe profile summary.
- Actions/validation: Required approved credentials/verification; client schema plus server validation; rate-limit errors are safe.
- States: Form loading/submission; invalid credentials; locked/rate-limited; success persists secure session; network retry preserves safe input.
- Auth: Public. Authorization: registration creates customer only; login returns authorized subject.

### Addresses

- Purpose: List, select, create, edit, delete, and set a default customer address.
- Entry: Profile, booking form, cart/checkout, delivery form.
- Exit/navigation: Return selected address to caller; back to Profile or originating flow.
- API/data: Customer address list/detail, optional Maps/geocoding.
- Actions/validation: Required recipient/address fields; coordinates/postal code policy; default and delete rules server-side.
- States: Skeleton; no addresses with add action; inline validation; retry; saved/deleted confirmation.
- Auth: Required. Authorization: owner-only.

### Payment Methods

- Purpose: View/manage provider-supported payment methods if the product enables management.
- Entry: Profile and payment flow.
- Exit/navigation: Select method -> payment; add/remove -> return.
- API/data: Provider-safe method references only.
- Actions/validation: Provider-controlled add/remove/selection; no card data stored by Dharma.
- States: Loading; empty add-method state; provider/network error; success refreshes list.
- Auth: Required. Authorization: owner-only.

### Booking Detail

- Purpose: Show authoritative schedule, pandit, service, address, totals, payment and current status.
- Entry: Confirmation, My Bookings, notification/deep link.
- Exit/navigation: reschedule/cancel where allowed; back to source.
- API/data: Booking detail/status history/payment summary.
- Actions/validation: Server policy validates reschedule/cancel; mutation idempotency required.
- States: Skeleton; not found/unauthorized; retry; success reflects refreshed server state.
- Auth: Required. Authorization: customer owner, or approved partner/admin policy.

### Orders List and Order Detail

- Purpose: List samagri/restaurant orders and show item, payment, fulfilment, and delivery state.
- Entry: Orders tab, Profile, order confirmation, notification.
- Exit/navigation: order detail -> tracking/support if approved; back.
- API/data: paginated orders, order items, payment/delivery summaries.
- Actions/validation: cancel/reorder/support only under approved policies.
- States: Skeleton; per-filter empty; retry/pagination; mutation confirmation.
- Auth: Required. Authorization: customer-owned orders.

### Cart and Checkout

- Purpose: Review quantities, address, totals, and create a product/restaurant order.
- Entry: Samagri sticky cart or restaurant menu.
- Exit/navigation: back to catalog; submit -> payment/order detail.
- API/data: server cart, catalog snapshots, address, fee/tax/discount quote, payment intent.
- Actions/validation: quantity/availability/address/payment validation; server recalculates totals.
- States: Cart loading; empty cart; changed/unavailable item error; success creates pending/paid order according to payment state.
- Auth: Required. Authorization: customer-owned cart/order.

### Product Detail and Restaurant Detail/Menu

- Purpose: Provide the catalog detail required before adding a product or restaurant item.
- Entry: Product/restaurant listing, search, deep link.
- Exit/navigation: add to cart -> cart; back to listing; restaurant menu item selection.
- API/data: published detail, images, availability, price, menu categories/items.
- Actions/validation: quantity and availability; server validates merchant and current price.
- States: Skeleton; unavailable/not found; retry; add-to-cart confirmation/error.
- Auth: Browse policy for detail; authentication required for cart mutation. Authorization: published records/customer cart.

### Reviews

- Purpose: Display moderated pandit reviews and aggregate rating.
- Entry: Pandit details Reviews link.
- Exit/navigation: back to pandit detail.
- API/data: paginated moderated reviews and summary.
- Actions/validation: Submission/editing is not defined and must not be implemented without approval.
- States: Skeleton; no reviews; retry/pagination.
- Auth: Browse policy. Authorization: published reviews only.

### Notifications, Favorites, Help & Support, Settings

- Purpose: Notifications manage/read status; Favorites list approved saved entities; Help & Support provides approved contact/case entry; Settings manages approved preferences/session options.
- Entry: Profile and notification deep links.
- Exit/navigation: back to Profile; notification selects an authorized resource.
- API/data: notification list/read/device preferences, favorites, support/settings contracts once approved.
- Actions/validation: read, remove, preference updates; support submission and account actions require explicit policy.
- States: Skeleton; per-section empty; retry; success confirmation without exposing technical errors.
- Auth: Required. Authorization: own data; admin/support access is separate and server-policy controlled.
