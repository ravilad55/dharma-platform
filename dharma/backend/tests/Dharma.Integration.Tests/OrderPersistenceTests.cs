using Dharma.Infrastructure.Persistence;
using Dharma.Order.Application;
using Dharma.Order.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Dharma.Integration.Tests;

public sealed class OrderPersistenceTests(RedisMySqlWebApplicationFactory factory) : IClassFixture<RedisMySqlWebApplicationFactory>
{
    [Fact]
    public async Task OrderSnapshotsRemainImmutableAfterProductAndCustomerAddressChanges()
    {
        await factory.Services.SeedDevelopmentCatalogAsync();
        await using var scope = factory.Services.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<DharmaDbContext>();
        var product = await dbContext.Products.FirstAsync();
        var shop = await dbContext.PoojaShops.SingleAsync(candidate => candidate.Id == product.PoojaShopId);
        var order = CreateOrder(NewOrderNumber(), product, shop.OwnerUserId);
        var productSnapshot = OrderItemSnapshotFactory.Create(new OrderProductSnapshotData(product.Id, product.Name, product.Sku, product.Price, 0m, 0m, product.Currency), 1);
        var customerAddress = new CustomerAddressRecord
        {
            Id = Guid.NewGuid(), CustomerId = shop.OwnerUserId, DefaultForCustomerId = shop.OwnerUserId, Label = "Home", ContactName = "Ravi Sharma", ContactPhone = "+919876543210", AddressLine1 = "Flat 101", AddressLine2 = "Temple Road", City = "Thane", State = "Maharashtra", PostalCode = "400601", Country = "IN", Latitude = 19.2183m, Longitude = 72.9781m, IsDefault = true, CreatedAtUtc = DateTimeOffset.UtcNow, UpdatedAtUtc = DateTimeOffset.UtcNow
        };
        var addressSnapshot = OrderAddressSnapshotFactory.Create(new OrderAddressSnapshotData(customerAddress.ContactName, customerAddress.ContactPhone, customerAddress.AddressLine1, customerAddress.AddressLine2, customerAddress.City, customerAddress.State, customerAddress.PostalCode, customerAddress.Country, customerAddress.Latitude, customerAddress.Longitude));

        dbContext.Orders.Add(order);
        dbContext.CustomerAddresses.Add(customerAddress);
        dbContext.OrderItems.Add(new OrderItemRecord { Id = Guid.NewGuid(), OrderId = order.Id, ProductId = productSnapshot.ProductId, ProductNameSnapshot = productSnapshot.ProductNameSnapshot, SkuSnapshot = productSnapshot.SkuSnapshot, Quantity = productSnapshot.Quantity, UnitPrice = productSnapshot.UnitPrice, TaxAmount = productSnapshot.TaxAmount, DiscountAmount = productSnapshot.DiscountAmount, LineTotal = productSnapshot.LineTotal, Currency = productSnapshot.Currency });
        dbContext.OrderAddresses.Add(ToRecord(order.Id, addressSnapshot));
        dbContext.OrderStatusHistory.Add(new OrderStatusHistoryRecord { Id = Guid.NewGuid(), OrderId = order.Id, ToStatus = OrderStatus.Pending, Actor = "customer", Reason = "Order created.", CreatedAtUtc = order.CreatedAtUtc });
        await dbContext.SaveChangesAsync();

        product.Name = "Premium Brass Diya Set";
        product.Sku = "DIYA-002";
        product.Price += 100m;
        customerAddress.ContactName = "Updated Ravi";
        customerAddress.ContactPhone = "+919876543299";
        customerAddress.AddressLine1 = "Flat 502";
        customerAddress.AddressLine2 = "New Temple Road";
        customerAddress.City = "Mumbai";
        customerAddress.State = "Goa";
        customerAddress.PostalCode = "403001";
        customerAddress.Country = "US";
        customerAddress.Latitude = 18.5204m;
        customerAddress.Longitude = 73.8567m;
        customerAddress.IsDefault = false;
        customerAddress.DefaultForCustomerId = null;
        await dbContext.SaveChangesAsync();
        dbContext.CustomerAddresses.Remove(customerAddress);
        await dbContext.SaveChangesAsync();

        dbContext.ChangeTracker.Clear();
        var persistedItem = await dbContext.OrderItems.AsNoTracking().SingleAsync(item => item.OrderId == order.Id);
        var persistedAddress = await dbContext.OrderAddresses.AsNoTracking().SingleAsync(address => address.OrderId == order.Id);
        Assert.Equal(productSnapshot.ProductNameSnapshot, persistedItem.ProductNameSnapshot);
        Assert.Equal(productSnapshot.SkuSnapshot, persistedItem.SkuSnapshot);
        Assert.Equal(productSnapshot.UnitPrice, persistedItem.UnitPrice);
        Assert.Equal(productSnapshot.LineTotal, persistedItem.LineTotal);
        Assert.Equal(productSnapshot.Currency, persistedItem.Currency);
        Assert.Equal(addressSnapshot, new OrderAddressSnapshot(persistedAddress.ContactName, persistedAddress.ContactPhone, persistedAddress.AddressLine1, persistedAddress.AddressLine2, persistedAddress.City, persistedAddress.State, persistedAddress.PostalCode, persistedAddress.Country, persistedAddress.Latitude, persistedAddress.Longitude));
        Assert.Null(await dbContext.CustomerAddresses.AsNoTracking().SingleOrDefaultAsync(address => address.Id == customerAddress.Id));
    }

    [Fact]
    public async Task OrderNumberIsUnique()
    {
        await factory.Services.SeedDevelopmentCatalogAsync();
        await using var scope = factory.Services.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<DharmaDbContext>();
        var product = await dbContext.Products.FirstAsync();
        var shop = await dbContext.PoojaShops.SingleAsync(candidate => candidate.Id == product.PoojaShopId);
        var orderNumber = NewOrderNumber();
        dbContext.Orders.Add(CreateOrder(orderNumber, product, shop.OwnerUserId));
        await dbContext.SaveChangesAsync();
        dbContext.Orders.Add(CreateOrder(orderNumber, product, shop.OwnerUserId));
        await Assert.ThrowsAsync<DbUpdateException>(() => dbContext.SaveChangesAsync());
    }

    [Fact]
    public async Task OrderAcceptsOnlyOneAddressSnapshot()
    {
        await factory.Services.SeedDevelopmentCatalogAsync();
        await using var scope = factory.Services.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<DharmaDbContext>();
        var product = await dbContext.Products.FirstAsync();
        var shop = await dbContext.PoojaShops.SingleAsync(candidate => candidate.Id == product.PoojaShopId);
        var order = CreateOrder(NewOrderNumber(), product, shop.OwnerUserId);
        dbContext.Orders.Add(order);
        await dbContext.SaveChangesAsync();
        dbContext.OrderAddresses.Add(ToRecord(order.Id, OrderAddressSnapshotFactory.Create(new OrderAddressSnapshotData("Ravi Sharma", "+919876543210", "Flat 101", null, "Thane", "Maharashtra", "400601", "IN", null, null))));
        await dbContext.SaveChangesAsync();
        dbContext.OrderAddresses.Add(ToRecord(order.Id, OrderAddressSnapshotFactory.Create(new OrderAddressSnapshotData("Ravi Sharma", "+919876543210", "Flat 502", null, "Thane", "Maharashtra", "400601", "IN", null, null))));
        await Assert.ThrowsAsync<DbUpdateException>(() => dbContext.SaveChangesAsync());
    }

    private static OrderRecord CreateOrder(string orderNumber, ProductRecord product, Guid customerId) => new() { Id = Guid.NewGuid(), OrderNumber = orderNumber, CustomerId = customerId, ShopId = product.PoojaShopId, Status = OrderStatus.Pending, Currency = "INR", CreatedAtUtc = DateTimeOffset.UtcNow, UpdatedAtUtc = DateTimeOffset.UtcNow };
    private static OrderAddressRecord ToRecord(Guid orderId, OrderAddressSnapshot snapshot) => new() { Id = Guid.NewGuid(), OrderId = orderId, ContactName = snapshot.ContactName, ContactPhone = snapshot.ContactPhone, AddressLine1 = snapshot.AddressLine1, AddressLine2 = snapshot.AddressLine2, City = snapshot.City, State = snapshot.State, PostalCode = snapshot.PostalCode, Country = snapshot.Country, Latitude = snapshot.Latitude, Longitude = snapshot.Longitude };
    private static string NewOrderNumber() => $"DRM-{Guid.NewGuid():N}"[..32];
}
