using Dharma.Order.Application;
using Dharma.SharedKernel.Abstractions;

namespace Dharma.Unit.Tests;

public sealed class OrderCheckoutTests
{
    [Fact]
    public async Task Create_UsesRevalidatedDataCreatesPendingOrderAndClearsCart()
    {
        var customerId = Guid.NewGuid();
        var addressId = Guid.NewGuid();
        var product = new OrderProductSnapshotData(Guid.NewGuid(), "Brass Diya Set", "DIYA-001", 399m, 0m, 0m, "INR");
        var revalidation = new TestRevalidation(new RevalidatedCart(customerId, Guid.NewGuid(), Guid.NewGuid(), "INR", [new RevalidatedCartItem(Guid.NewGuid(), 2, product, 798m)], 798m, 0m, 0m, 798m));
        var store = new TestCheckoutStore();
        var source = new TestAddressSource(new OrderAddressSnapshotData("Ravi Sharma", "+919876543210", "Flat 101", null, "Thane", "Maharashtra", "400601", "IN", null, null));

        var result = await Service(revalidation, source, store).CreateAsync(customerId, new CreateOrderRequest(addressId), "order-key-1");

        Assert.Equal(Dharma.Order.Domain.OrderStatus.Pending, result.Status);
        Assert.Equal(798m, result.Total);
        Assert.Equal(product.Name, Assert.Single(store.Items).ProductNameSnapshot);
        Assert.Equal("Flat 101", store.Address!.AddressLine1);
        Assert.True(store.CartCleared);
        Assert.True(revalidation.UnderLockCalled);
    }

    [Fact]
    public async Task Create_RejectsMissingAddressAndInvalidIdempotencyKey()
    {
        var service = Service(new TestRevalidation(null), new TestAddressSource(null), new TestCheckoutStore());
        await Assert.ThrowsAsync<OrderCheckoutException>(() => service.CreateAsync(Guid.NewGuid(), new CreateOrderRequest(Guid.Empty), "key"));
        await Assert.ThrowsAsync<OrderCheckoutException>(() => service.CreateAsync(Guid.NewGuid(), new CreateOrderRequest(Guid.NewGuid()), ""));
    }

    private static OrderCheckoutService Service(TestRevalidation revalidation, TestAddressSource source, TestCheckoutStore store) => new(revalidation, source, store, new TestTransaction(), new TestLock(), TimeProvider.System);

    private sealed class TestRevalidation(RevalidatedCart? cart) : IOrderCartRevalidationService
    {
        public bool UnderLockCalled { get; private set; }
        public Task<RevalidatedCart> RevalidateAsync(Guid customerId, CancellationToken cancellationToken = default) => Task.FromResult(cart!);
        public Task<RevalidatedCart> RevalidateUnderCartLockAsync(Guid customerId, CancellationToken cancellationToken = default) { UnderLockCalled = true; return Task.FromResult(cart!); }
    }
    private sealed class TestAddressSource(OrderAddressSnapshotData? address) : IOrderAddressSnapshotSource { public Task<OrderAddressSnapshotData?> GetAsync(Guid customerId, Guid addressId, CancellationToken cancellationToken = default) => Task.FromResult(address); }
    private sealed class TestCheckoutStore : IOrderCheckoutStore
    {
        public List<OrderItemSnapshot> Items { get; } = []; public OrderAddressSnapshot? Address { get; private set; } public bool CartCleared { get; private set; }
        public Task<OrderIdempotencyResult?> GetIdempotencyAsync(Guid customerId, string key, CancellationToken cancellationToken) => Task.FromResult<OrderIdempotencyResult?>(null);
        public Task SaveAsync(Dharma.Order.Domain.Order order, string orderNumber, IReadOnlyList<OrderItemSnapshot> items, OrderAddressSnapshot address, string idempotencyKey, string requestFingerprint, CancellationToken cancellationToken) { Items.AddRange(items); Address = address; return Task.CompletedTask; }
        public Task ClearCartAsync(Guid customerId, CancellationToken cancellationToken) { CartCleared = true; return Task.CompletedTask; }
    }
    private sealed class TestTransaction : ITransactionBoundary { public Task ExecuteAsync(Func<CancellationToken, Task> action, CancellationToken cancellationToken = default) => action(cancellationToken); }
    private sealed class TestLock : IDistributedLock { public Task<IAsyncDisposable?> TryAcquireAsync(string key, TimeSpan expiry, CancellationToken cancellationToken = default) => Task.FromResult<IAsyncDisposable?>(new Lease()); private sealed class Lease : IAsyncDisposable { public ValueTask DisposeAsync() => ValueTask.CompletedTask; } }
}
