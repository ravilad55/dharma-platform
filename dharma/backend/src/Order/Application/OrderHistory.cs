using Dharma.Order.Domain;

namespace Dharma.Order.Application;

public sealed record OrderSummaryDto(
    Guid Id,
    string OrderNumber,
    OrderStatus Status,
    decimal Subtotal,
    decimal DeliveryCharge,
    decimal ServiceCharge,
    decimal Total,
    string Currency,
    DateTimeOffset CreatedAtUtc);

public sealed record OrderItemDto(
    Guid ProductId,
    string ProductName,
    string Sku,
    int Quantity,
    decimal UnitPrice,
    decimal TaxAmount,
    decimal DiscountAmount,
    decimal LineTotal,
    string Currency);

public sealed record OrderAddressDto(
    string ContactName,
    string ContactPhone,
    string AddressLine1,
    string? AddressLine2,
    string City,
    string State,
    string PostalCode,
    string Country,
    decimal? Latitude,
    decimal? Longitude);

public sealed record OrderDetailsDto(
    Guid Id,
    string OrderNumber,
    OrderStatus Status,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset UpdatedAtUtc,
    decimal Subtotal,
    decimal DeliveryCharge,
    decimal ServiceCharge,
    decimal Total,
    string Currency,
    IReadOnlyList<OrderItemDto> Items,
    OrderAddressDto Address);

public sealed record OrderHistoryPage(IReadOnlyList<OrderSummaryDto> Items, int Page, int PageSize, int TotalCount);

public sealed record OrderHistoryQuery
{
    public const int MaxPageSize = 100;

    public int Page { get; }
    public int PageSize { get; }
    public int Skip => (Page - 1) * PageSize;

    private OrderHistoryQuery(int page, int pageSize)
    {
        Page = page;
        PageSize = pageSize;
    }

    public static OrderHistoryQuery Create(int page = 1, int pageSize = 20)
    {
        if (page < 1 || pageSize is < 1 or > MaxPageSize)
            throw new OrderHistoryException("orders_pagination_invalid", 400, "Use page >= 1 and pageSize between 1 and 100.");

        return new OrderHistoryQuery(page, pageSize);
    }
}

public sealed class OrderHistoryException(string code, int status, string message) : Exception(message)
{
    public string Code { get; } = code;
    public int Status { get; } = status;
}

public interface IOrderHistoryService
{
    Task<OrderHistoryPage> GetOrdersAsync(Guid customerId, OrderHistoryQuery query, CancellationToken cancellationToken = default);
    Task<OrderDetailsDto?> GetOrderAsync(Guid customerId, Guid orderId, CancellationToken cancellationToken = default);
}

public interface IOrderHistoryStore
{
    Task<OrderHistoryData> GetOrdersAsync(Guid customerId, OrderHistoryQuery query, CancellationToken cancellationToken);
    Task<OrderDetailsData?> GetOrderAsync(Guid customerId, Guid orderId, CancellationToken cancellationToken);
}

/// <summary>
/// Customer-owned order history. Every read is customer-scoped so an order that belongs to another
/// customer is indistinguishable from an order that does not exist.
/// </summary>
public sealed class OrderHistoryService(IOrderHistoryStore store) : IOrderHistoryService
{
    public async Task<OrderHistoryPage> GetOrdersAsync(Guid customerId, OrderHistoryQuery query, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(query);
        var history = await store.GetOrdersAsync(RequireCustomer(customerId), query, cancellationToken);
        return OrderHistoryMapper.ToPage(history, query);
    }

    public async Task<OrderDetailsDto?> GetOrderAsync(Guid customerId, Guid orderId, CancellationToken cancellationToken = default)
    {
        if (orderId == Guid.Empty) return null;
        var order = await store.GetOrderAsync(RequireCustomer(customerId), orderId, cancellationToken);
        return order is null ? null : OrderHistoryMapper.ToDetails(order);
    }

    private static Guid RequireCustomer(Guid customerId) =>
        customerId == Guid.Empty ? throw new OrderHistoryException("orders_unauthenticated", 401, "Authentication is required.") : customerId;
}