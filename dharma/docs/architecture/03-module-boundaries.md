# 03 Module Boundaries

## Boundary rules

Each module owns its entities, commands, queries, validation, policies, persistence mappings, and public contracts. Shared kernel is limited to primitives such as IDs, money, pagination, time, ProblemDetails, and event envelope. No module exposes EF entities.

## Identity

- Responsibility: registration/login, JWT access and refresh tokens, session revocation, roles, account status.
- Data: User, RefreshSession, Role, UserRole, audit/security events.
- Commands: RegisterCustomer, Login, RefreshToken, Logout, ChangeProfile, RevokeSessions.
- Queries: CurrentUser, UserRoles.
- APIs: `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `/users/profile`.
- Dependencies: email/phone verification provider if approved, token/key management.
- Events: UserRegistered, UserRoleChanged, UserDeactivated.

## Customer

- Responsibility: customer preferences, addresses, favorites, customer-facing profile data.
- Data: CustomerProfile, Address, Favorite.
- Commands: Create/Update/DeleteAddress, SetDefaultAddress, Add/RemoveFavorite, UpdatePreferences.
- Queries: Addresses, Favorites, CustomerSummary.
- APIs: `/users/addresses`, `/users/favorites`, profile preferences.
- Dependencies: Identity; Maps/geocoding for validation if approved.
- Events: AddressChanged, FavoriteChanged.

## Pandit

- Responsibility: verified pandit profiles, services, availability, ratings/reviews read model, future partner operations.
- Data: Pandit, PanditService, AvailabilityRule, AvailabilityException, Review read ownership as defined below.
- Commands: future partner Create/UpdateProfile, MaintainService, MaintainAvailability; customer-facing review command if approved.
- Queries: list/search, detail, availability, reviews.
- APIs: `GET /pandits`, `/pandits/{id}`, `/pandits/{id}/availability`, reviews.
- Dependencies: Identity partner role, Booking read contract, OpenSearch.
- Events: PanditVerified, AvailabilityChanged, ReviewPublished.

## PoojaSamagri

- Responsibility: shops, product categories, products, inventory/availability projection.
- Data: PoojaShop, ProductCategory, Product, ProductImage, inventory fields.
- Commands: future partner MaintainProduct, MaintainCategory, UpdateAvailability.
- Queries: products, categories, product detail, search.
- APIs: `/products`, `/product-categories`, shop/product detail.
- Dependencies: Identity, Order read contract, OpenSearch, S3.
- Events: ProductChanged, ProductAvailabilityChanged.

## Restaurant

- Responsibility: restaurant profiles, pure-veg eligibility, menus, menu availability, restaurant discovery.
- Data: Restaurant, MenuItem, MenuCategory, RestaurantHours.
- Commands: future partner MaintainRestaurant, MaintainMenu, UpdateAvailability.
- Queries: restaurants, restaurant detail/menu, search.
- APIs: `/restaurants`, `/restaurants/{id}`, menu endpoints.
- Dependencies: Identity, Order, OpenSearch, S3.
- Events: RestaurantChanged, MenuItemChanged.

## Delivery

- Responsibility: delivery request lifecycle, assignment, location snapshots, ETA/status.
- Data: DeliveryRequest, DeliveryAssignment, DeliveryLocation, status history.
- Commands: CreateDeliveryRequest, CancelDeliveryRequest; future partner Accept, Pickup, MarkInTransit, Complete.
- Queries: delivery detail, tracking.
- APIs: `/delivery-requests`, `/delivery-requests/{id}`, `/tracking`.
- Dependencies: Customer addresses, Maps, Identity partner role, Notification, Order optional reference.
- Events: DeliveryRequested, PartnerAssigned, DeliveryStatusChanged, DeliveryCompleted.

## Booking

- Responsibility: service selection, slot availability, ten-minute reservation, booking status, reschedule/cancel policy.
- Data: Booking, BookingSlotReservation, booking status history.
- Commands: CreateReservation, ConfirmAfterPayment, Reschedule, Cancel, ExpireReservation.
- Queries: booking detail, customer bookings, availability.
- APIs: `/bookings`, `/bookings/{id}`, `/bookings/{id}/reschedule`, cancel.
- Dependencies: Pandit availability, Customer address, Payment verification, Redis, Notification.
- Events: BookingReserved, BookingConfirmed, BookingExpired, BookingCancelled, BookingRescheduled.

## Order

- Responsibility: customer cart/order aggregate, item snapshots, order status, order history. Separate order type identifies samagri vs restaurant.
- Data: Order, OrderItem, Cart or cart projection, order status history.
- Commands: Add/UpdateCartItem, ClearCart, CreateOrder, CancelOrder where policy allows, UpdateFulfilmentStatus future partner.
- Queries: cart, order detail, customer order list.
- APIs: `/carts`, `/orders`, `/orders/{id}`.
- Dependencies: PoojaSamagri/Restaurant catalog contracts, Customer address, Payment, Delivery, Notification.
- Events: OrderCreated, OrderPaid, OrderAccepted, OrderReady, OrderOutForDelivery, OrderDelivered, OrderCancelled.

## Payment

- Responsibility: Stripe payment intents, provider references, webhook verification, payment status, refunds if approved.
- Data: Payment, PaymentAttempt, ProviderWebhookReceipt, refund references.
- Commands: CreatePaymentIntent, HandleProviderWebhook, VerifyPayment, Refund.
- Queries: payment status for authorized owner/admin.
- APIs: `/payments`, `/payments/{id}`, `/payments/webhooks/stripe`.
- Dependencies: Stripe, Booking/Order contracts, Identity, outbox.
- Events: PaymentCreated, PaymentSucceeded, PaymentFailed, PaymentExpired, RefundCompleted.

## Notification

- Responsibility: notification preferences, in-app notification records, push token registration, delivery attempts.
- Data: Notification, DeviceToken, NotificationPreference, DeliveryAttempt.
- Commands: RegisterDevice, MarkRead, HandleBusinessEvent.
- Queries: notification list/unread count.
- APIs: `/notifications`, `/notifications/{id}/read`, `/devices`.
- Dependencies: FCM, messaging/outbox, Identity.
- Events: NotificationQueued, NotificationSent, NotificationFailed.

## Review ownership

The requirements require Reviews in the database and display ratings/reviews, but do not define review submission rules. Until approved, Pandit owns the read model and Review entity boundary; a review capability may become a separate module only if moderation and cross-domain review scope requires it. This is an open decision.
