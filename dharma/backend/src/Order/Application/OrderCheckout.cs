using Dharma.Order.Domain;
using Dharma.SharedKernel.Abstractions;
using OrderAggregate = Dharma.Order.Domain.Order;

namespace Dharma.Order.Application;

public sealed record CreateOrderRequest(Guid AddressId);
public sealed record OrderCreatedDto(Guid Id, string OrderNumber, OrderStatus Status, decimal Subtotal, decimal DeliveryFee, decimal ServiceCharge, decimal Total, string Currency, DateTimeOffset CreatedAtUtc);
public sealed record OrderIdempotencyResult(string RequestFingerprint, OrderCreatedDto Result);

public interface IOrderCheckoutStore
{
    Task<OrderIdempotencyResult?> GetIdempotencyAsync(Guid customerId, string key, CancellationToken cancellationToken);
    Task SaveAsync(OrderAggregate order, string orderNumber, IReadOnlyList<OrderItemSnapshot> items, OrderAddressSnapshot address, string idempotencyKey, string requestFingerprint, CancellationToken cancellationToken);
    Task ClearCartAsync(Guid customerId, CancellationToken cancellationToken);
}

public sealed class OrderCheckoutException(string code, int status, string message) : Exception(message)
{
    public string Code { get; } = code;
    public int Status { get; } = status;
}

public interface IOrderCheckoutService
{
    Task<OrderCreatedDto> CreateAsync(Guid customerId, CreateOrderRequest request, string idempotencyKey, CancellationToken cancellationToken = default);
}

public sealed class OrderCheckoutService(IOrderCartRevalidationService revalidationService, IOrderAddressSnapshotSource addressSource, IOrderCheckoutStore store, ITransactionBoundary transactionBoundary, IDistributedLock distributedLock, TimeProvider clock) : IOrderCheckoutService
{
    public async Task<OrderCreatedDto> CreateAsync(Guid customerId, CreateOrderRequest request, string idempotencyKey, CancellationToken cancellationToken = default)
    {
        if (customerId == Guid.Empty || request.AddressId == Guid.Empty) throw new OrderCheckoutException("order_validation", 422, "A delivery address is required.");
        if (string.IsNullOrWhiteSpace(idempotencyKey) || idempotencyKey.Length > 250) throw new OrderCheckoutException("idempotency_key_invalid", 422, "A valid Idempotency-Key is required.");
        await using var cartLock = await distributedLock.TryAcquireAsync($"cart:customer:{customerId}", TimeSpan.FromSeconds(10), cancellationToken)
            ?? throw new OrderCheckoutException("cart_concurrent", 409, "The cart is being updated. Please try again.");
        var fingerprint = request.AddressId.ToString("N");
        var existing = await store.GetIdempotencyAsync(customerId, idempotencyKey, cancellationToken);
        if (existing is not null)
        {
            if (!string.Equals(existing.RequestFingerprint, fingerprint, StringComparison.Ordinal)) throw new OrderCheckoutException("idempotency_conflict", 409, "The idempotency key was already used for a different request.");
            return existing.Result;
        }

        OrderCreatedDto? result = null;
        await transactionBoundary.ExecuteAsync(async ct =>
        {
            var cart = await revalidationService.RevalidateUnderCartLockAsync(customerId, ct);
            var addressData = await addressSource.GetAsync(customerId, request.AddressId, ct) ?? throw new OrderCheckoutException("address_not_found", 404, "The address was not found.");
            var address = OrderAddressSnapshotFactory.Create(addressData);
            var items = cart.Items.Select(item => OrderItemSnapshotFactory.Create(item.Product, item.Quantity)).ToArray();
            var now = clock.GetUtcNow();
            var order = new OrderAggregate(customerId, cart.ShopId, now, cart.Currency, "customer");
            var orderNumber = CreateOrderNumber();
            await store.SaveAsync(order, orderNumber, items, address, idempotencyKey, fingerprint, ct);
            await store.ClearCartAsync(customerId, ct);
            result = new OrderCreatedDto(order.Id, orderNumber, order.Status, cart.Subtotal, cart.DeliveryFee, cart.ServiceCharge, cart.Total, cart.Currency, now);
        }, cancellationToken);
        return result!;
    }

    private static string CreateOrderNumber() => $"DRM-{Guid.NewGuid():N}"[..32];
}