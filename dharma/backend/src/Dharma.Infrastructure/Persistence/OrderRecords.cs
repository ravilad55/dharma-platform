using Dharma.Order.Domain;

namespace Dharma.Infrastructure.Persistence;

public sealed class OrderRecord
{
    public Guid Id { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public Guid CustomerId { get; set; }
    public Guid ShopId { get; set; }
    public OrderStatus Status { get; set; }
    public string Currency { get; set; } = "INR";
    public decimal Subtotal { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal DeliveryFee { get; set; }
    public decimal TotalAmount { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset UpdatedAtUtc { get; set; }
}

public sealed class OrderItemRecord
{
    public Guid Id { get; set; }
    public Guid OrderId { get; set; }
    public Guid ProductId { get; set; }
    public string ProductNameSnapshot { get; set; } = string.Empty;
    public string SkuSnapshot { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal LineTotal { get; set; }
    public string Currency { get; set; } = "INR";
}

public sealed class OrderAddressRecord
{
    public Guid Id { get; set; }
    public Guid OrderId { get; set; }
    public string ContactName { get; set; } = string.Empty;
    public string ContactPhone { get; set; } = string.Empty;
    public string AddressLine1 { get; set; } = string.Empty;
    public string? AddressLine2 { get; set; }
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    public string Country { get; set; } = "IN";
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
}

public sealed class OrderStatusHistoryRecord
{
    public Guid Id { get; set; }
    public Guid OrderId { get; set; }
    public OrderStatus? FromStatus { get; set; }
    public OrderStatus ToStatus { get; set; }
    public string Actor { get; set; } = string.Empty;
    public string? Reason { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
}