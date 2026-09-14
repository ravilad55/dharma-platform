namespace Dharma.Infrastructure.Persistence;

public sealed class OrderIdempotencyRecord
{
    public Guid Id { get; set; }
    public Guid CustomerId { get; set; }
    public string Key { get; set; } = string.Empty;
    public string RequestFingerprint { get; set; } = string.Empty;
    public Guid OrderId { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
}