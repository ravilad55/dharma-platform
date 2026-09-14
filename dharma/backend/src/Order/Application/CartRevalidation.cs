using Dharma.SharedKernel.Abstractions;

namespace Dharma.Order.Application;

public sealed record RevalidationProductData(Guid ShopId, OrderProductSnapshotData Snapshot, bool IsAvailable);
public sealed record CartRevalidationItemData(Guid CartItemId, Guid ProductId, int Quantity, decimal CartUnitPrice, string CartCurrency, RevalidationProductData? Product);
public sealed record CartRevalidationData(Guid CartId, Guid CustomerId, Guid ShopId, string Currency, IReadOnlyList<CartRevalidationItemData> Items);
public sealed record RevalidatedCartItem(Guid CartItemId, int Quantity, OrderProductSnapshotData Product, decimal LineTotal);
public sealed record RevalidatedCart(Guid CustomerId, Guid CartId, Guid ShopId, string Currency, IReadOnlyList<RevalidatedCartItem> Items, decimal Subtotal, decimal DeliveryFee, decimal ServiceCharge, decimal Total);

public sealed class CartRevalidationException(string code, string message) : InvalidOperationException(message)
{
    public string Code { get; } = code;
}

public interface IOrderCartRevalidationStore
{
    Task<CartRevalidationData?> GetAsync(Guid customerId, CancellationToken cancellationToken = default);
}

public interface IOrderCartRevalidationService
{
    Task<RevalidatedCart> RevalidateAsync(Guid customerId, CancellationToken cancellationToken = default);
    Task<RevalidatedCart> RevalidateUnderCartLockAsync(Guid customerId, CancellationToken cancellationToken = default);
}

public sealed class OrderCartRevalidationService(IOrderCartRevalidationStore store, IDistributedLock distributedLock) : IOrderCartRevalidationService
{
    public async Task<RevalidatedCart> RevalidateAsync(Guid customerId, CancellationToken cancellationToken = default)
    {
        if (customerId == Guid.Empty) throw new ArgumentException("Customer is required.", nameof(customerId));
        await using var cartLock = await distributedLock.TryAcquireAsync($"cart:customer:{customerId}", TimeSpan.FromSeconds(10), cancellationToken)
            ?? throw new CartRevalidationException("cart_concurrent", "The cart is being updated. Please try again.");
        return await RevalidateUnderCartLockAsync(customerId, cancellationToken);
    }

    public async Task<RevalidatedCart> RevalidateUnderCartLockAsync(Guid customerId, CancellationToken cancellationToken = default)
    {
        if (customerId == Guid.Empty) throw new ArgumentException("Customer is required.", nameof(customerId));
        var cart = await store.GetAsync(customerId, cancellationToken) ?? throw new CartRevalidationException("cart_not_found", "The cart was not found.");
        if (cart.Items.Count == 0) throw new CartRevalidationException("cart_empty", "The cart is empty.");
        if (!string.Equals(cart.Currency, "INR", StringComparison.Ordinal)) throw new CartRevalidationException("cart_currency_invalid", "The cart currency is invalid.");

        var items = new List<RevalidatedCartItem>(cart.Items.Count);
        foreach (var item in cart.Items)
        {
            if (item.Quantity <= 0) throw new CartRevalidationException("invalid_quantity", "The cart contains an invalid quantity.");
            if (item.Product is null) throw new CartRevalidationException("product_not_found", "A cart product is no longer available.");
            if (!item.Product.IsAvailable) throw new CartRevalidationException("product_unavailable", "A cart product is currently unavailable.");
            if (item.Product.ShopId != cart.ShopId) throw new CartRevalidationException("cart_merchant_mismatch", "The cart contains products from another shop.");
            if (!string.Equals(item.Product.Snapshot.Currency, cart.Currency, StringComparison.Ordinal)) throw new CartRevalidationException("cart_currency_invalid", "The cart contains an invalid currency.");
            if (item.CartUnitPrice != item.Product.Snapshot.UnitPrice) throw new CartRevalidationException("cart_price_changed", "A cart product price has changed. Refresh your cart before placing the order.");

            var snapshot = OrderItemSnapshotFactory.Create(item.Product.Snapshot, item.Quantity);
            items.Add(new RevalidatedCartItem(item.CartItemId, item.Quantity, item.Product.Snapshot, snapshot.LineTotal));
        }

        var subtotal = items.Sum(item => item.LineTotal);
        return new RevalidatedCart(customerId, cart.CartId, cart.ShopId, cart.Currency, items, subtotal, 0m, 0m, subtotal);
    }
}