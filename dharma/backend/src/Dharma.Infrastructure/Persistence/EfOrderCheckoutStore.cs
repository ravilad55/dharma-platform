using Dharma.Order.Application;
using Dharma.Order.Domain;
using Microsoft.EntityFrameworkCore;
using OrderAggregate = Dharma.Order.Domain.Order;

namespace Dharma.Infrastructure.Persistence;

public sealed class EfOrderCheckoutStore(DharmaDbContext dbContext) : IOrderCheckoutStore, IOrderAddressSnapshotSource
{
    public async Task<OrderIdempotencyResult?> GetIdempotencyAsync(Guid customerId, string key, CancellationToken cancellationToken)
    {
        var record = await (from item in dbContext.OrderIdempotencyRecords.AsNoTracking()
                            join order in dbContext.Orders.AsNoTracking() on item.OrderId equals order.Id
                            where item.CustomerId == customerId && item.Key == key
                            select new { item.RequestFingerprint, order }).SingleOrDefaultAsync(cancellationToken);
        return record is null ? null : new OrderIdempotencyResult(record.RequestFingerprint, ToResult(record.order));
    }

    public async Task<OrderAddressSnapshotData?> GetAsync(Guid customerId, Guid addressId, CancellationToken cancellationToken = default) => await dbContext.CustomerAddresses.AsNoTracking()
        .Where(address => address.CustomerId == customerId && address.Id == addressId)
        .Select(address => new OrderAddressSnapshotData(address.ContactName, address.ContactPhone, address.AddressLine1, address.AddressLine2, address.City, address.State, address.PostalCode, address.Country, address.Latitude, address.Longitude))
        .SingleOrDefaultAsync(cancellationToken);

    public async Task SaveAsync(OrderAggregate order, string orderNumber, IReadOnlyList<OrderItemSnapshot> items, OrderAddressSnapshot address, string idempotencyKey, string requestFingerprint, CancellationToken cancellationToken)
    {
        var subtotal = items.Sum(item => item.LineTotal);
        dbContext.Orders.Add(new OrderRecord { Id = order.Id, OrderNumber = orderNumber, CustomerId = order.CustomerId, ShopId = order.ShopId, Status = order.Status, Currency = order.Currency, Subtotal = subtotal, TaxAmount = items.Sum(item => item.TaxAmount * item.Quantity), DiscountAmount = items.Sum(item => item.DiscountAmount * item.Quantity), DeliveryFee = 0m, TotalAmount = subtotal, CreatedAtUtc = order.CreatedAtUtc, UpdatedAtUtc = order.CreatedAtUtc });
        dbContext.OrderItems.AddRange(items.Select(item => new OrderItemRecord { Id = Guid.NewGuid(), OrderId = order.Id, ProductId = item.ProductId, ProductNameSnapshot = item.ProductNameSnapshot, SkuSnapshot = item.SkuSnapshot, Quantity = item.Quantity, UnitPrice = item.UnitPrice, TaxAmount = item.TaxAmount, DiscountAmount = item.DiscountAmount, LineTotal = item.LineTotal, Currency = item.Currency }));
        dbContext.OrderAddresses.Add(new OrderAddressRecord { Id = Guid.NewGuid(), OrderId = order.Id, ContactName = address.ContactName, ContactPhone = address.ContactPhone, AddressLine1 = address.AddressLine1, AddressLine2 = address.AddressLine2, City = address.City, State = address.State, PostalCode = address.PostalCode, Country = address.Country, Latitude = address.Latitude, Longitude = address.Longitude });
        dbContext.OrderStatusHistory.AddRange(order.StatusHistory.Select(history => new OrderStatusHistoryRecord { Id = Guid.NewGuid(), OrderId = order.Id, FromStatus = history.FromStatus, ToStatus = history.ToStatus, Actor = history.Actor, Reason = history.Reason, CreatedAtUtc = history.OccurredAtUtc }));
        dbContext.OrderIdempotencyRecords.Add(new OrderIdempotencyRecord { Id = Guid.NewGuid(), CustomerId = order.CustomerId, Key = idempotencyKey, RequestFingerprint = requestFingerprint, OrderId = order.Id, CreatedAtUtc = order.CreatedAtUtc });
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task ClearCartAsync(Guid customerId, CancellationToken cancellationToken)
    {
        var items = await (from item in dbContext.CartItems join cart in dbContext.Carts on item.CartId equals cart.Id where cart.CustomerId == customerId select item).ToListAsync(cancellationToken);
        dbContext.CartItems.RemoveRange(items);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private static OrderCreatedDto ToResult(OrderRecord order) => new(order.Id, order.OrderNumber, order.Status, order.Subtotal, order.DeliveryFee, 0m, order.TotalAmount, order.Currency, order.CreatedAtUtc);
}