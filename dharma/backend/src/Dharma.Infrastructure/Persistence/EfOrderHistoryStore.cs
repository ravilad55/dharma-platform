using System.Linq.Expressions;
using Dharma.Order.Application;
using Microsoft.EntityFrameworkCore;

namespace Dharma.Infrastructure.Persistence;

public sealed class EfOrderHistoryStore(DharmaDbContext dbContext) : IOrderHistoryStore
{
    private static readonly Expression<Func<OrderRecord, OrderSummaryData>> SummaryProjection = order => new OrderSummaryData(
        order.Id,
        order.OrderNumber,
        order.Status,
        order.Subtotal,
        order.DeliveryFee,
        order.TotalAmount,
        order.Currency,
        order.CreatedAtUtc,
        order.UpdatedAtUtc);

    public async Task<OrderHistoryData> GetOrdersAsync(Guid customerId, OrderHistoryQuery query, CancellationToken cancellationToken)
    {
        var orders = dbContext.Orders.AsNoTracking().Where(order => order.CustomerId == customerId);
        var totalCount = await orders.CountAsync(cancellationToken);
        var items = await orders
            .OrderByDescending(order => order.CreatedAtUtc)
            .ThenByDescending(order => order.Id)
            .Skip(query.Skip)
            .Take(query.PageSize)
            .Select(SummaryProjection)
            .ToListAsync(cancellationToken);
        return new OrderHistoryData(items, totalCount);
    }

    public async Task<OrderDetailsData?> GetOrderAsync(Guid customerId, Guid orderId, CancellationToken cancellationToken)
    {
        var summary = await dbContext.Orders.AsNoTracking()
            .Where(order => order.Id == orderId && order.CustomerId == customerId)
            .Select(SummaryProjection)
            .SingleOrDefaultAsync(cancellationToken);
        if (summary is null) return null;

        var items = await dbContext.OrderItems.AsNoTracking()
            .Where(item => item.OrderId == summary.Id)
            .OrderBy(item => item.ProductNameSnapshot)
            .ThenBy(item => item.Id)
            .Select(item => new OrderItemSnapshot(item.ProductId, item.ProductNameSnapshot, item.SkuSnapshot, item.Quantity, item.UnitPrice, item.TaxAmount, item.DiscountAmount, item.LineTotal, item.Currency))
            .ToListAsync(cancellationToken);

        var address = await dbContext.OrderAddresses.AsNoTracking()
            .Where(address => address.OrderId == summary.Id)
            .Select(address => new OrderAddressSnapshotData(address.ContactName, address.ContactPhone, address.AddressLine1, address.AddressLine2, address.City, address.State, address.PostalCode, address.Country, address.Latitude, address.Longitude))
            .SingleOrDefaultAsync(cancellationToken);

        return address is null ? null : new OrderDetailsData(summary, items, OrderAddressSnapshotFactory.Create(address));
    }
}