using Dharma.SharedKernel.Abstractions;

namespace Dharma.Order.Application;

public sealed record AddCartItemRequest(Guid ProductId, int Quantity);
public sealed record UpdateCartItemRequest(int Quantity);
public sealed record CartItemDto(Guid Id, Guid ProductId, string Name, string? ImageUrl, int Quantity, decimal UnitPrice, decimal Subtotal, bool Available);
public sealed record CartDto(Guid Id, Guid? ShopId, string? ShopName, string Currency, IReadOnlyList<CartItemDto> Items, decimal Subtotal, decimal DeliveryCharge, decimal ServiceCharge, decimal Total, int ItemCount);
public sealed record CartProductData(Guid Id, Guid ShopId, string ShopName, string Name, string? ImageUrl, decimal Price, string Currency, bool IsAvailable);

public interface ICartService
{
    Task<CartDto> GetAsync(Guid customerId, CancellationToken cancellationToken = default);
    Task<CartDto> AddItemAsync(Guid customerId, AddCartItemRequest request, CancellationToken cancellationToken = default);
    Task<CartDto> UpdateItemAsync(Guid customerId, Guid itemId, UpdateCartItemRequest request, CancellationToken cancellationToken = default);
    Task<CartDto> RemoveItemAsync(Guid customerId, Guid itemId, CancellationToken cancellationToken = default);
    Task<CartDto> ClearAsync(Guid customerId, CancellationToken cancellationToken = default);
}

public interface ICartStore
{
    Task<CartDto> ReadAsync(Guid customerId, CancellationToken cancellationToken);
    Task<CartProductData?> GetProductAsync(Guid productId, CancellationToken cancellationToken);
    Task<bool> CartExistsAsync(Guid customerId, CancellationToken cancellationToken);
    Task CreateCartAsync(Guid customerId, Guid shopId, string currency, CancellationToken cancellationToken);
    Task<(Guid ShopId, string Currency)?> GetCartHeaderAsync(Guid customerId, CancellationToken cancellationToken);
    Task<Guid?> GetCartItemProductIdAsync(Guid customerId, Guid itemId, CancellationToken cancellationToken);
    Task AddOrIncreaseItemAsync(Guid customerId, CartProductData product, int quantity, CancellationToken cancellationToken);
    Task UpdateItemAsync(Guid customerId, Guid itemId, int quantity, CartProductData product, CancellationToken cancellationToken);
    Task RemoveItemAsync(Guid customerId, Guid itemId, CancellationToken cancellationToken);
    Task ClearItemsAsync(Guid customerId, CancellationToken cancellationToken);
}

public sealed class CartException(string code, int status, string message) : Exception(message)
{
    public string Code { get; } = code;
    public int Status { get; } = status;
}

public sealed class CartService(ICartStore store, ITransactionBoundary transactionBoundary, IDistributedLock distributedLock) : ICartService
{
    public Task<CartDto> GetAsync(Guid customerId, CancellationToken cancellationToken = default) => store.ReadAsync(customerId, cancellationToken);

    public async Task<CartDto> AddItemAsync(Guid customerId, AddCartItemRequest request, CancellationToken cancellationToken = default)
    {
        if (request.Quantity <= 0) throw new CartException("invalid_quantity", 422, "Quantity must be greater than zero.");
        var product = await store.GetProductAsync(request.ProductId, cancellationToken) ?? throw new CartException("product_not_found", 404, "The product was not found.");
        if (!product.IsAvailable) throw new CartException("product_unavailable", 422, "The product is currently unavailable.");
        await using var cartLock = await distributedLock.TryAcquireAsync($"cart:customer:{customerId}", TimeSpan.FromSeconds(10), cancellationToken)
            ?? throw new CartException("cart_concurrent", 409, "The cart is being updated. Please try again.");

        await transactionBoundary.ExecuteAsync(async ct =>
        {
            var header = await store.GetCartHeaderAsync(customerId, ct);
            if (header is null)
                await store.CreateCartAsync(customerId, product.ShopId, product.Currency, ct);
            else if (header.Value.ShopId != product.ShopId)
                throw new CartException("cart_shop_conflict", 409, "Your cart contains products from another shop. Clear your cart before adding this product.");
            await store.AddOrIncreaseItemAsync(customerId, product, request.Quantity, ct);
        }, cancellationToken);
        return await store.ReadAsync(customerId, cancellationToken);
    }

    public async Task<CartDto> UpdateItemAsync(Guid customerId, Guid itemId, UpdateCartItemRequest request, CancellationToken cancellationToken = default)
    {
        if (request.Quantity <= 0) throw new CartException("invalid_quantity", 422, "Quantity must be greater than zero.");
        await using var cartLock = await distributedLock.TryAcquireAsync($"cart:customer:{customerId}", TimeSpan.FromSeconds(10), cancellationToken)
            ?? throw new CartException("cart_concurrent", 409, "The cart is being updated. Please try again.");
        var productId = await store.GetCartItemProductIdAsync(customerId, itemId, cancellationToken) ?? throw new CartException("cart_item_not_found", 404, "The cart item was not found.");
        var product = await store.GetProductAsync(productId, cancellationToken) ?? throw new CartException("product_not_found", 404, "The product was not found.");
        if (!product.IsAvailable) throw new CartException("product_unavailable", 422, "The product is currently unavailable.");
        await transactionBoundary.ExecuteAsync(ct => store.UpdateItemAsync(customerId, itemId, request.Quantity, product, ct), cancellationToken);
        return await store.ReadAsync(customerId, cancellationToken);
    }

    public async Task<CartDto> RemoveItemAsync(Guid customerId, Guid itemId, CancellationToken cancellationToken = default)
    {
        await using var cartLock = await distributedLock.TryAcquireAsync($"cart:customer:{customerId}", TimeSpan.FromSeconds(10), cancellationToken)
            ?? throw new CartException("cart_concurrent", 409, "The cart is being updated. Please try again.");
        if (await store.GetCartItemProductIdAsync(customerId, itemId, cancellationToken).ConfigureAwait(false) is null)
            throw new CartException("cart_item_not_found", 404, "The cart item was not found.");
        await transactionBoundary.ExecuteAsync(ct => store.RemoveItemAsync(customerId, itemId, ct), cancellationToken);
        return await store.ReadAsync(customerId, cancellationToken);
    }

    public async Task<CartDto> ClearAsync(Guid customerId, CancellationToken cancellationToken = default)
    {
        await using var cartLock = await distributedLock.TryAcquireAsync($"cart:customer:{customerId}", TimeSpan.FromSeconds(10), cancellationToken)
            ?? throw new CartException("cart_concurrent", 409, "The cart is being updated. Please try again.");
        await transactionBoundary.ExecuteAsync(ct => store.ClearItemsAsync(customerId, ct), cancellationToken);
        return await store.ReadAsync(customerId, cancellationToken);
    }
}