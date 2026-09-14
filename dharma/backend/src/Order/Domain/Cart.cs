namespace Dharma.Order.Domain;

public enum CartStatus
{
    Active = 1
}

public sealed class Cart
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid CustomerId { get; init; }
    public Guid? ShopId { get; private set; }
    public string Currency { get; private set; } = "INR";
    public CartStatus Status { get; private set; } = CartStatus.Active;
    public DateTimeOffset CreatedAtUtc { get; init; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAtUtc { get; private set; } = DateTimeOffset.UtcNow;

    public void AssignShop(Guid shopId, DateTimeOffset now)
    {
        if (ShopId.HasValue && ShopId.Value != shopId)
            throw new InvalidOperationException("A cart cannot contain products from multiple shops.");
        ShopId = shopId;
        UpdatedAtUtc = now;
    }
}