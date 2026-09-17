using Dharma.Order.Domain;

namespace Dharma.Infrastructure.Persistence;

public sealed class CartRecord
{
    public Guid Id { get; set; }
    public Guid CustomerId { get; set; }
    public Guid? ShopId { get; set; }
    public string Currency { get; set; } = "INR";
    public CartStatus Status { get; set; } = CartStatus.Active;
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset UpdatedAtUtc { get; set; }
}

public sealed class CartItemRecord
{
    public Guid Id { get; set; }
    public Guid CartId { get; set; }
    public Guid ProductId { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public string Currency { get; set; } = "INR";
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset UpdatedAtUtc { get; set; }
}