# 03 Module Boundaries

## Boundary rules

Each module owns its entities, commands, queries, validation, policies, persistence mappings, and public contracts. Shared kernel is limited to primitives such as IDs, money, pagination, time, ProblemDetails, and event envelope. No module exposes EF entities.

## Identity

- Responsibility: registration/login, JWT access and refresh tokens, session revocation, roles, account status.
- Data: User, RefreshSession, Role, UserRole, audit/security events.
- Commands: RegisterCustomer, Login, RefreshToken, Logout, ChangeProfile, RevokeSessions.
- Queries: CurrentUser, UserRoles.
- APIs: `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `/users/profile`.
- Dependencies: phone OTP provider, optional email association, token/key management.
- Events: UserRegistered, UserRoleChanged, UserDeactivated.

## Customer

- Responsibility: customer preferences, addresses, favorites, customer-facing profile data.
- Data: CustomerProfile, Address, Favorite, CustomerSetting, SupportCase, SupportMessage.
- Commands: Create/Update/DeleteAddress, SetDefaultAddress, Add/RemoveFavorite, UpdatePreferences.
- Queries: Addresses, Favorites, CustomerSummary.
- APIs: `/users/addresses`, `/users/favorites`, `/users/settings`, `/support/cases`, `/home`, `/search`.
- Dependencies: Identity; Maps/geocoding and place lookup; Home aggregation reads published contracts from discovery modules without owning their tables.
- Events: AddressChanged, FavoriteChanged.

## Pandit

- Responsibility: verified pandit profiles, services, availability, ratings/reviews read model, future partner operations.
- Data: Pandit, PanditService, FixedBookableSlot, AvailabilityRule, AvailabilityException, Review, ReviewModeration.
- Commands: future partner Create/UpdateProfile, MaintainService, MaintainAvailability; customer CreateReview, EditReview, DeleteReview, ModerateReview.
- Queries: list/search, detail, availability, reviews.
- APIs: `GET /pandits`, `/pandits/{id}`, `/pandits/{id}/availability`, reviews CRUD subject to completed-booking eligibility.
- Dependencies: Identity partner membership, Booking completed-eligibility contract, OpenSearch.
- Events: PanditVerified, AvailabilityChanged, ReviewPublished.

## PoojaSamagri

- Responsibility: shops, product categories, products, inventory/availability projection.
- Data: PoojaShop, ProductCategory, Product, ProductImage, InventoryItem, InventoryReservation.
- Commands: future partner MaintainProduct, MaintainCategory, UpdateAvailability.
- Queries: products, categories, product detail, search.
- APIs: `/products`, `/product-categories`, shop/product detail.
- Dependencies: Identity partner membership, Order checkout contract, OpenSearch, S3.
- Events: ProductChanged, ProductAvailabilityChanged.

## Restaurant

- Responsibility: restaurant profiles, pure-veg eligibility, menus, menu availability, restaurant discovery.
- Data: Restaurant, MenuItem, MenuCategory, RestaurantHours.
- Commands: future partner MaintainRestaurant, MaintainMenu, UpdateAvailability.
- Queries: restaurants, restaurant detail/menu, search.
- APIs: `/restaurants`, `/restaurants/{id}`, menu endpoints.
- Dependencies: Identity partner membership, Order checkout contract, OpenSearch, S3.
- Events: RestaurantChanged, MenuItemChanged.

## Delivery

- Responsibility: delivery request lifecycle, assignment, location snapshots, ETA/status.
- Data: DeliveryRequest, DeliveryAssignment, DeliveryLocation, status history.
- Commands: CreateDeliveryRequest, QuoteDelivery, CancelDeliveryRequest; future partner Accept, Pickup, MarkInTransit, Complete.
- Queries: delivery detail, tracking.
- APIs: `/delivery-requests`, `/delivery-requests/{id}`, `/tracking`.
- Dependencies: Customer address/place contracts, Maps, Identity partner membership, Notification events, Order optional reference.
- Events: DeliveryRequested, PartnerAssigned, DeliveryStatusChanged, DeliveryCompleted.

## Booking

- Responsibility: service selection, slot availability, ten-minute reservation, booking status, reschedule/cancel policy.
- Data: Booking, FixedBookableSlot, BookingSlotReservation, booking status history, BookingReconciliation.
- Commands: CreateReservation, ConfirmAfterPayment, Reschedule, Cancel, ExpireReservation, MarkFinalizationFailed, ReconcileBooking.
- Queries: booking detail, customer bookings, availability.
- APIs: `/bookings`, `/bookings/{id}`, `/bookings/{id}/reschedule`, cancel.
- Dependencies: Pandit fixed slots, Customer address snapshot contract, Payment verification port, Redis, transactional outbox. Notification is event-driven only.
- Events: BookingReserved, BookingConfirmed, BookingExpired, BookingCancelled, BookingRescheduled, BookingFinalizationFailed, BookingAwaitingReconciliation, BookingRefundPending, BookingRefunded.

## Order

- Responsibility: one-merchant cart/checkout, item snapshots, inventory reservation coordination, order status, order history. Separate order type identifies samagri vs restaurant.
- Data: Order, OrderItem, Cart, CartItem, InventoryReservation reference, order status history.
- Commands: Add/UpdateCartItem, ClearCart, Checkout, CreateOrder, CancelOrder where policy allows, UpdateFulfilmentStatus future partner.
- Queries: cart, order detail, customer order list.
- APIs: `/carts`, `/orders`, `/orders/{id}`.
- Dependencies: PoojaSamagri/Restaurant catalog contracts, Customer address, Payment, Delivery, Notification.
- Events: OrderPlaced, OrderPaid, OrderAccepted, OrderReady, OrderOutForDelivery, OrderDelivered, OrderCancelled.

## Payment

- Responsibility: Stripe INR PaymentIntents, provider references, webhook verification, payment status, void/refund workflow, reconciliation.
- Data: Payment, PaymentAttempt, PaymentWebhookReceipt, Refund, PaymentReconciliation.
- Commands: CreatePaymentIntent, HandleProviderWebhook, VerifyPayment, VoidOrRefund, ReconcilePayment.
- Queries: payment status for authorized owner/admin.
- APIs: `/payments`, `/payments/{id}`, `/payments/{id}/reconciliation`, `/payments/{id}/refund`, `/payments/webhooks/stripe`, `/payment-methods`.
- Dependencies: Stripe, Booking/Order contracts, Identity, outbox.
- Events: PaymentCreated, PaymentSucceeded, PaymentFailed, PaymentExpired, RefundCompleted.

## Notification

- Responsibility: notification templates, preferences, in-app records, push token registration, delivery attempts, optional important-event SMS/email.
- Data: NotificationTemplate, Notification, DeviceToken, NotificationPreference, DeliveryAttempt.
- Commands: RegisterDevice, MarkRead, HandleBusinessEvent.
- Queries: notification list/unread count.
- APIs: `/notifications`, `/notifications/{id}/read`, `/devices`.
- Dependencies: FCM, optional transactional SMS/email provider, SNS/SQS/outbox, Identity.
- Events: NotificationQueued, NotificationSent, NotificationFailed.

## Partner ownership model

Identity owns `PartnerOrganizations`, `PartnerMemberships`, membership role, approval/status, and resource ownership references. Pandit, PoojaSamagri, Restaurant, and Delivery own their resource records but reference an approved organization and enforce membership/assignment policies. A user may hold multiple partner roles through separate memberships. Admin policies are explicit and audited; no Partner App is built in V1.

## Review ownership

Pandit owns review records and aggregate projections for pandit reviews. Restaurant owns restaurant review records if restaurant reviews are enabled by the customer scope. A customer may create one review per completed eligible booking/order, subject to moderation. Review writes are server-authorized and event updates recalculate aggregates.

## Dependency direction

Identity is foundational. Catalog modules expose published read contracts to Customer/Home/Search and checkout validation. Booking calls a Payment verification port; Payment publishes provider outcomes and never references Booking implementation. Order calls Payment through the same port. Notification, search indexing, cache invalidation, and analytics consume SNS/SQS events only. Delivery may reference an Order ID through an explicit optional FK/contract, not an Order table read.
