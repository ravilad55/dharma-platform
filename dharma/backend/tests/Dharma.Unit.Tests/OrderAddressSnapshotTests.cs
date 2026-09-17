using Dharma.Order.Application;

namespace Dharma.Unit.Tests;

public sealed class OrderAddressSnapshotTests
{
    [Fact]
    public void Create_CopiesCompleteServerLoadedAddressData()
    {
        var source = new OrderAddressSnapshotData("Ravi Sharma", "+919876543210", "Flat 101", "Temple Road", "Thane", "Maharashtra", "400601", "in", 19.2183m, 72.9781m);

        var snapshot = OrderAddressSnapshotFactory.Create(source);

        Assert.Equal("Ravi Sharma", snapshot.ContactName);
        Assert.Equal("Flat 101", snapshot.AddressLine1);
        Assert.Equal("Temple Road", snapshot.AddressLine2);
        Assert.Equal("IN", snapshot.Country);
        Assert.Equal(19.2183m, snapshot.Latitude);
        Assert.Equal(72.9781m, snapshot.Longitude);
    }

    [Fact]
    public void Create_RejectsIncompleteAddress()
    {
        var source = new OrderAddressSnapshotData("", "+919876543210", "Flat 101", null, "Thane", "Maharashtra", "400601", "IN", null, null);

        Assert.Throws<ArgumentException>(() => OrderAddressSnapshotFactory.Create(source));
    }

    [Fact]
    public void Create_RejectsInvalidCoordinates()
    {
        var source = new OrderAddressSnapshotData("Ravi Sharma", "+919876543210", "Flat 101", null, "Thane", "Maharashtra", "400601", "IN", 91m, 72.9781m);

        Assert.Throws<ArgumentException>(() => OrderAddressSnapshotFactory.Create(source));
    }

    [Fact]
    public async Task ServiceLoadsAddressOnlyThroughCustomerScopedSource()
    {
        var customerId = Guid.NewGuid();
        var addressId = Guid.NewGuid();
        var source = new CapturingAddressSource(new OrderAddressSnapshotData("Ravi Sharma", "+919876543210", "Flat 101", null, "Thane", "Maharashtra", "400601", "IN", null, null));

        var snapshot = await new OrderAddressSnapshotService(source).CreateAsync(customerId, addressId);

        Assert.Equal(customerId, source.CustomerId);
        Assert.Equal(addressId, source.AddressId);
        Assert.Equal("Flat 101", snapshot.AddressLine1);
    }

    private sealed class CapturingAddressSource(OrderAddressSnapshotData? address) : IOrderAddressSnapshotSource
    {
        public Guid CustomerId { get; private set; }
        public Guid AddressId { get; private set; }
        public Task<OrderAddressSnapshotData?> GetAsync(Guid customerId, Guid addressId, CancellationToken cancellationToken = default)
        {
            CustomerId = customerId;
            AddressId = addressId;
            return Task.FromResult(address);
        }
    }
}