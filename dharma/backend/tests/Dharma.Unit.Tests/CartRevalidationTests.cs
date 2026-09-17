using Dharma.Order.Application;
using Dharma.SharedKernel.Abstractions;

namespace Dharma.Unit.Tests;

public sealed class CartRevalidationTests
{
    private readonly Guid customerId = Guid.NewGuid();
    private readonly Guid shopId = Guid.NewGuid();

    [Fact]
    public async Task Revalidate_UsesCurrentProductDataAndCalculatesServerTotal()
    {
        var product = Product(399m, "Brass Diya Set", "DIYA-001");
        var result = await Service(Cart(Item(2, 399m, product))).RevalidateAsync(customerId);

        var item = Assert.Single(result.Items);
        Assert.Equal(product.Snapshot, item.Product);
        Assert.Equal(798m, item.LineTotal);
        Assert.Equal(798m, result.Subtotal);
        Assert.Equal(798m, result.Total);
    }

    [Theory]
    [InlineData("cart_not_found")]
    [InlineData("cart_empty")]
    public async Task Revalidate_RejectsMissingOrEmptyCart(string code)
    {
        var data = code == "cart_not_found" ? null : Cart();
        var exception = await Assert.ThrowsAsync<CartRevalidationException>(() => Service(data).RevalidateAsync(customerId));
        Assert.Equal(code, exception.Code);
    }

    [Theory]
    [InlineData("product_not_found")]
    [InlineData("product_unavailable")]
    [InlineData("invalid_quantity")]
    [InlineData("cart_merchant_mismatch")]
    [InlineData("cart_price_changed")]
    public async Task Revalidate_RejectsInvalidCartState(string code)
    {
        var product = Product(399m, "Brass Diya Set", "DIYA-001");
        CartRevalidationItemData item = code switch
        {
            "product_not_found" => Item(1, 399m, null),
            "product_unavailable" => Item(1, 399m, product with { IsAvailable = false }),
            "invalid_quantity" => Item(0, 399m, product),
            "cart_merchant_mismatch" => Item(1, 399m, product with { ShopId = Guid.NewGuid() }),
            _ => Item(1, 300m, product)
        };
        var exception = await Assert.ThrowsAsync<CartRevalidationException>(() => Service(Cart(item)).RevalidateAsync(customerId));
        Assert.Equal(code, exception.Code);
    }

    [Fact]
    public async Task Revalidate_UsesEachCurrentServerProductForMultipleItems()
    {
        var first = Product(399m, "Brass Diya Set", "DIYA-001");
        var second = Product(199m, "Sandalwood Incense", "INC-001");
        var result = await Service(Cart(Item(2, 399m, first), Item(3, 199m, second))).RevalidateAsync(customerId);

        Assert.Equal(1395m, result.Total);
        Assert.Equal(["Brass Diya Set", "Sandalwood Incense"], result.Items.Select(item => item.Product.Name));
    }

    private static OrderCartRevalidationService Service(CartRevalidationData? cart) => new(new TestStore(cart), new TestLock());
    private CartRevalidationData Cart(params CartRevalidationItemData[] items) => new(Guid.NewGuid(), customerId, shopId, "INR", items);
    private static CartRevalidationItemData Item(int quantity, decimal cartUnitPrice, RevalidationProductData? product) => new(Guid.NewGuid(), product?.Snapshot.ProductId ?? Guid.NewGuid(), quantity, cartUnitPrice, "INR", product);
    private RevalidationProductData Product(decimal price, string name, string sku) => new(shopId, new OrderProductSnapshotData(Guid.NewGuid(), name, sku, price, 0m, 0m, "INR"), true);

    private sealed class TestStore(CartRevalidationData? cart) : IOrderCartRevalidationStore
    {
        public Task<CartRevalidationData?> GetAsync(Guid customerId, CancellationToken cancellationToken = default) => Task.FromResult(cart);
    }

    private sealed class TestLock : IDistributedLock
    {
        public Task<IAsyncDisposable?> TryAcquireAsync(string key, TimeSpan expiry, CancellationToken cancellationToken = default) => Task.FromResult<IAsyncDisposable?>(new Lease());
        private sealed class Lease : IAsyncDisposable { public ValueTask DisposeAsync() => ValueTask.CompletedTask; }
    }
}
