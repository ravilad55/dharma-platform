using Dharma.Order.Domain;

namespace Dharma.Order.Application;

public sealed record OrderSummaryData(
    Guid Id,
    string OrderNumber,
    OrderStatus Status,
    decimal Subtotal,
    decimal DeliveryCharge,
    decimal Total,
    string Currency,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset UpdatedAtUtc);

public sealed record OrderHistoryData(IReadOnlyList<OrderSummaryData> Items, int TotalCount);

public sealed record OrderDetailsData(OrderSummaryData Summary, IReadOnlyList<OrderItemSnapshot> Items, OrderAddressSnapshot Address);

/// <summary>
/// Maps persisted order history into customer-visible DTOs. Money is returned exactly as charged:
/// the service charge is the residual component of the stored total after subtotal and delivery charge.
/// Product and address values come only from the immutable snapshots, never from live catalog or address rows.
/// </summary>
public static class OrderHistoryMapper
{
    public static OrderSummaryDto ToSummary(OrderSummaryData order)
    {
        ArgumentNullException.ThrowIfNull(order);
        return new OrderSummaryDto(
            order.Id,
            order.OrderNumber,
            order.Status,
            order.Subtotal,
            order.DeliveryCharge,
            ServiceCharge(order),
            order.Total,
            order.Currency,
            order.CreatedAtUtc);
    }

    public static OrderItemDto ToItem(OrderItemSnapshot item)
    {
        ArgumentNullException.ThrowIfNull(item);
        return new OrderItemDto(item.ProductId, item.ProductNameSnapshot, item.SkuSnapshot, item.Quantity, item.UnitPrice, item.TaxAmount, item.DiscountAmount, item.LineTotal, item.Currency);
    }

    public static OrderAddressDto ToAddress(OrderAddressSnapshot address)
    {
        ArgumentNullException.ThrowIfNull(address);
        return new OrderAddressDto(address.ContactName, address.ContactPhone, address.AddressLine1, address.AddressLine2, address.City, address.State, address.PostalCode, address.Country, address.Latitude, address.Longitude);
    }

    public static OrderDetailsDto ToDetails(OrderDetailsData order)
    {
        ArgumentNullException.ThrowIfNull(order);
        var summary = ToSummary(order.Summary);
        return new OrderDetailsDto(
            summary.Id,
            summary.OrderNumber,
            summary.Status,
            summary.CreatedAtUtc,
            order.Summary.UpdatedAtUtc,
            summary.Subtotal,
            summary.DeliveryCharge,
            summary.ServiceCharge,
            summary.Total,
            summary.Currency,
            order.Items.Select(ToItem).ToArray(),
            ToAddress(order.Address));
    }

    public static OrderHistoryPage ToPage(OrderHistoryData history, OrderHistoryQuery query)
    {
        ArgumentNullException.ThrowIfNull(history);
        ArgumentNullException.ThrowIfNull(query);
        return new OrderHistoryPage(history.Items.Select(ToSummary).ToArray(), query.Page, query.PageSize, history.TotalCount);
    }

    private static decimal ServiceCharge(OrderSummaryData order) => order.Total - order.Subtotal - order.DeliveryCharge;
}